/**
 * jimp-fallback.js - Sostituzione pure-JS di 'canvas' con Jimp + Browserless.
 * Pattern preso da plugins/fun/fun-quote.js:
 *  1) prova screenshot HTML via Browserless (se global.browserless configurato)
 *  2) fallback disegno diretto con Jimp (font built-in, nessuna dipendenza nativa)
 * MAI importa 'canvas' o '@napi-rs/canvas' qui dentro per evitare crash su Termux.
 */
import Jimp from 'jimp'
import axios from 'axios'

const getBotName = () => global?.nomebot || global?.nomepack || '888.BOT'
const getVersion = () => global?.versione || '1.4'
const getBrowserlessKey = () => global?.browserless || process.env?.BROWSERLESS_KEY || null

export async function screenshotViaBrowserless(html, width = 1000, height = 600, retries = 4) {
  const key = getBrowserlessKey()
  if (!key) throw new Error('Browserless key non configurata (global.browserless)')
  let lastErr = null
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.post(
        `https://chrome.browserless.io/screenshot?token=${key}`,
        { html, options: { type: 'jpeg', quality: 90 }, viewport: { width, height } },
        { responseType: 'arraybuffer', timeout: 20000 }
      )
      return Buffer.from(res.data)
    } catch (e) {
      lastErr = e
      await new Promise(r => setTimeout(r, 1500))
    }
  }
  throw lastErr || new Error('Browserless fallito')
}

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function botFooter() {
  return `${getBotName()} v${getVersion()}`
}

// ---- Compat layer: createCanvas / loadImage senza dipendenze native ----
let font32 = null
async function getFont32() {
  if (!font32) font32 = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE)
  return font32
}

export async function loadImage(source) {
  if (typeof source === 'string' && /^https?:\/\//i.test(source)) {
    const res = await fetch(source)
    if (!res.ok) throw new Error(`loadImage http ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    return Jimp.read(buf)
  }
  return Jimp.read(source)
}

export async function createCanvas(width, height, color = 0x000000ff) {
  const img = await Jimp.create(width, height, color)
  return new JimpCanvas(img)
}

export class JimpCanvas {
  constructor(img) { this.img = img }
  get width() { return this.img.bitmap.width }
  get height() { return this.img.bitmap.height }
  getContext() { return new JimpContext2D(this.img) }
  async toBuffer(mime = Jimp.MIME_PNG) { return this.img.getBufferAsync(mime) }
  // compat sync: alcuni plugin chiamano canvas.toBuffer() senza await
  // -> ritorna Promise comunque (await-safe)
}

export class JimpContext2D {
  constructor(img) {
    this.img = img
    this.fillStyle = '#ffffff'
    this.font = '32px sans-serif'
    this.textAlign = 'left'
  }
  _parseColor(c) {
    try {
      if (typeof c === 'number') return c
      return Jimp.cssColorToHex(String(c || '#ffffff'))
    } catch { return 0xffffffff }
  }
  fillRect(x, y, w, h) {
    const col = this._parseColor(this.fillStyle)
    const x0 = Math.max(0, Math.round(x)); const y0 = Math.max(0, Math.round(y))
    const x1 = Math.min(this.img.bitmap.width, x0 + Math.round(w))
    const y1 = Math.min(this.img.bitmap.height, y0 + Math.round(h))
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) this.img.setPixelColor(col, px, py)
    }
  }
  async fillText(text, x, y) {
    const font = await getFont32()
    this.img.print(font, Math.round(x), Math.round(y), String(text ?? ''))
  }
  measureText(text) {
    // stima sincrona: ~16px per carattere a 32px (meglio di niente per wrap)
    return { width: String(text ?? '').length * 16 }
  }
  async drawImage(src, dx, dy, dW, dH) {
    let layer = src?.img ? src.img : src
    if (!layer || typeof layer.clone !== 'function') return
    layer = layer.clone()
    if (dW && dH) layer.resize(Math.round(dW), Math.round(dH))
    this.img.composite(layer, Math.round(dx), Math.round(dy))
  }
  beginPath() {}
  moveTo() {}
  lineTo() {}
  closePath() {}
  stroke() {}
  fill() {}
  quadraticCurveTo() {}
  roundRect() {}
  createLinearGradient() { return { addColorStop() {} } }
}
