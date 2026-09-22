// Plugin by Elixir
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { sticker } from '../../lib/sticker.js'

const DEFAULT_AVATAR = 'https://i.imgur.com/7O4pLPL.png'

const quotes = [
  '"La vita è ciò che ti succede mentre sei impegnato a fare altri piani." — John Lennon',
  '"Chi non rischiando non rosica." — Proverbio italiano',
  '"Il vero viaggiatore è colui che prende il treno n.9 e una città che non conosce." — Bill Bryson',
  '"Non preoccuparti e fai sotto." — Niente panico',
  '"Sì, ok, ma tu rifletti su questo." — Sarcasmo quotidiano',
  '"Il tempo è relativo, ha senso solo se la cucina è vuota." — Einstein (presunto)',
  '"Ci sono due modi per scrivere errori senza errori." — Tony Hoare',
  '"Prima della programmazione c\'è solo la programmazione." — Lloyd Bock',
  '"640K dovrebbe essere abbastanza per chiunque." — Bill Gates (forse)',
  '"La scienza non è altro che la percezione." — Proverbio zen',
  '"La speranza è l\'unica cosa con le penne." — Emily Dickinson',
  '"Le cose che si muovono mantengono in movimento." — Albert Einstein'
]

const CARD_W      = 512
const CARD_H      = 220
const PADDING     = 28
const AVATAR_D    = 130
const AVATAR_CX   = PADDING + AVATAR_D / 2
const AVATAR_CY   = PADDING + AVATAR_D / 2
const TEXT_X      = PADDING + AVATAR_D + 28
const TEXT_Y      = PADDING + 14
const TEXT_MAX_W  = CARD_W - TEXT_X - PADDING

const G = { s: { r: 126, g: 38, b: 205 }, e: { r: 135, g: 206, b: 250 } }

// ── bitmap helpers ────────────────────────────────────────────────────────
function bitmapOf(img) {
  const b = img.bitmap
  return { data: b.data, width: b.width || img.width, height: b.height || img.height }
}

function roundRectCoverage(x, y, w, h, r) {
  if (r <= 0) return 1
  const cx = Math.min(Math.max(x + 0.5, r), w - r)
  const cy = Math.min(Math.max(y + 0.5, r), h - r)
  return Math.max(0, Math.min(1, r - Math.hypot(x + 0.5 - cx, y + 0.5 - cy) + 0.5))
}

function blendPixel(data, idx, rgb, alpha) {
  if (alpha <= 0) return
  const da = data[idx + 3] / 255
  const oa = alpha + da * (1 - alpha)
  if (oa <= 0) { data[idx + 3] = 0; return }
  for (let c = 0; c < 3; c++) data[idx + c] = Math.round(
    (rgb[c] * alpha + data[idx + c] * da * (1 - alpha)) / oa
  )
  data[idx + 3] = Math.round(oa * 255)
}

function fillRoundRect(img, bx, by, w, h, radius, rgba) {
  const { data, width: iw, height: ih } = bitmapOf(img)
  for (let y = 0; y < h; y++) {
    const py = by + y
    if (py < 0 || py >= ih) continue
    for (let x = 0; x < w; x++) {
      const px = bx + x
      if (px < 0 || px >= iw) continue
      const cov = roundRectCoverage(x, y, w, h, radius)
      if (cov <= 0) continue
      blendPixel(data, ((py * iw) + px) << 2, rgba, (rgba[3] / 255) * cov)
    }
  }
  return img
}

function fillRect(img, x, y, w, h, rgba) {
  return fillRoundRect(img, x, y, w, h, 0, rgba)
}

function fillCircle(img, cx, cy, radius, rgba) {
  const { data, width: iw, height: ih } = bitmapOf(img)
  const sx = Math.max(0, Math.floor(cx - radius))
  const ex = Math.min(iw - 1, Math.ceil(cx + radius))
  const sy = Math.max(0, Math.floor(cy - radius))
  const ey = Math.min(ih - 1, Math.ceil(cy + radius))
  for (let py = sy; py <= ey; py++) {
    for (let px = sx; px <= ex; px++) {
      const cov = Math.max(0, Math.min(
        1, radius - Math.hypot(px + 0.5 - cx, py + 0.5 - cy) + 0.5
      ))
      if (cov <= 0) continue
      blendPixel(data, ((py * iw) + px) << 2, rgba, (rgba[3] / 255) * cov)
    }
  }
  return img
}

function fillGradientVertical(img, s, e) {
  const { data, width, height } = bitmapOf(img)
  for (let y = 0; y < height; y++) {
    const t = y / height
    const r = Math.round(s.r + (e.r - s.r) * t)
    const g = Math.round(s.g + (e.g - s.g) * t)
    const b = Math.round(s.b + (e.b - s.b) * t)
    for (let x = 0; x < width; x++) {
      const i = ((y * width) + x) << 2
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255
    }
  }
  return img
}

function applyRoundedCorners(img, radius) {
  const { data, width, height } = bitmapOf(img)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cov = roundRectCoverage(x, y, width, height, radius)
      if (cov >= 1) continue
      const i = ((y * width) + x) << 2
      data[i + 3] = Math.round(data[i + 3] * cov)
    }
  }
  return img
}

﻿
// ── avatar rotondo (senza nome, solo immagine) ────────────────────────────
async function drawAvatar(canvas, avatarUrl, cx, cy, size) {
  let avatarImg
  try {
    const res    = await fetch(avatarUrl)
    const buffer = Buffer.from(await res.arrayBuffer())
    avatarImg    = await loadImage(buffer)
  } catch {
    const ph     = createCanvas(size, size)
    const pctx   = ph.getContext('2d')
    pctx.fillStyle = '#c8c8d0'
    pctx.fillRect(0, 0, size, size)
    avatarImg = ph
  }

  const scale  = size / Math.max(avatarImg.width, avatarImg.height)
  const nW     = Math.round(avatarImg.width * scale)
  const nH     = Math.round(avatarImg.height * scale)

  // render centrato su quadrato
  const sq     = createCanvas(size, size)
  const sctx   = sq.getContext('2d')
  sctx.drawImage(avatarImg, (size - nW) / 2, (size - nH) / 2, nW, nH)

  // clip circolare
  const sq2 = createCanvas(size, size)
  const s2  = sq2.getContext('2d')
  s2.beginPath()
  s2.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  s2.closePath()
  s2.clip()
  s2.drawImage(sq, 0, 0)

  // composizione sul canvas principale
  const mainCtx = canvas.getContext('2d')
  mainCtx.save()
  mainCtx.beginPath()
  mainCtx.arc(cx, cy, size / 2, 0, Math.PI * 2)
  mainCtx.closePath()
  mainCtx.clip()
  mainCtx.drawImage(sq2, cx - size / 2, cy - size / 2)
  mainCtx.restore()

  // sottile bordo bianco sul cerchio profilo
  mainCtx.beginPath()
  mainCtx.arc(cx, cy, size / 2, 0, Math.PI * 2)
  mainCtx.strokeStyle = 'rgba(255,255,255,0.6)'
  mainCtx.lineWidth   = 2
  mainCtx.stroke()
}

// ── wrap text ──────────────────────────────────────────────────────────────
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur); cur = w
    } else cur = test
  }
  if (cur) lines.push(cur)
  return lines
}
// ── render card ────────────────────────────────────────────────────────────
async function generateQuoteCard(avatarUrl, messageText) {
  const canvas = createCanvas(CARD_W, CARD_H)
  const ctx    = canvas.getContext('2d')

  // gradiente verticale viola → azzurro
  const grad = ctx.createLinearGradient(0, 0, 0, CARD_H)
  grad.addColorStop(0, `rgb(${G.s.r},${G.s.g},${G.s.b})`)
  grad.addColorStop(1, `rgb(${G.e.r},${G.e.g},${G.e.b})`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // leggera texture polvere
  const dot = createCanvas(1, 1)
  const dctx = dot.getContext('2d')
  for (let i = 0; i < 25; i++) {
    dctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`
    dctx.fillRect(Math.random() * CARD_W, Math.random() * CARD_H, 2, 2)
  }
  ctx.drawImage(dot, 0, 0, CARD_W, CARD_H)

  // avatar a sinistra
  await drawAvatar(canvas, avatarUrl, AVATAR_CX, AVATAR_CY, AVATAR_D)

  // separatore verticale sottile
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillRect(TEXT_X - 14, TEXT_Y + 4, 1, CARD_H - TEXT_Y - PADDING - 8)

  // testo citato (a destra, bianco)
  ctx.font         = 'bold 16px "Segoe UI", "Helvetica Neue", Arial, sans-serif'
  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'

  const lines = wrapText(ctx, messageText, TEXT_MAX_W)
  const lineH = 24
  let curY    = TEXT_Y

  for (const line of lines.slice(0, 7)) {
    if (curY + 32 > CARD_H - PADDING) break
    ctx.fillStyle = '#ffffff'
    ctx.fillText(line, TEXT_X, curY)
    curY += lineH
  }
  if (lines.length > 7) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.fillText('…', TEXT_X, curY)
  }

  // angoli arrotondati + borda interna
  applyRoundedCorners(canvas, 20)
  const cctx = canvas.getContext('2d')
  cctx.save()
  cctx.beginPath()
  cctx.roundRect(0, 0, CARD_W, CARD_H, 20)
  cctx.closePath()
  cctx.strokeStyle = 'rgba(255,255,255,0.5)'
  cctx.lineWidth   = 2
  cctx.stroke()
  cctx.restore()

  return canvas.toBuffer('image/png')
}

// ── handler ────────────────────────────────────────────────────────────────
const handler = async (m, { conn, text, quoted, isGroup }) => {
  try {
    if (quoted) {
      const from = quoted.sender || m.sender
      const msgText = quoted.text || quoted.body || quoted.conversation || ''
      if (!msgText || msgText.trim() === '') {
        return m.reply('❌ Il messaggio selezionato non contiene testo.')
      }

      let pfpUrl = ''
      try { pfpUrl = await conn.profilePictureUrl(from, 'image') } catch {}
      if (!pfpUrl) try { pfpUrl = await conn.profilePictureUrl(m.chat, 'image') } catch {}
      if (!pfpUrl) pfpUrl = DEFAULT_AVATAR

      const senderName = (m.pushName || from.split('@')[0] || 'Utente').trim() || 'Utente'

      const loading = await m.reply('⏳  Creo lo sticker quote …')
      try {
        const buf = await generateQuoteCard(pfpUrl, msgText.trim())
        const stk = await sticker(buf, false, senderName, '888-BOT')
        conn.sendFile(m.chat, stk, 'quote.webp', '', m, { quoted: loading })
      } catch (genErr) {
        console.error('[fun-quote] Errore generazione:', genErr)
        await conn.sendMessage(m.chat, {
          text: `❌ Errore nella generazione dello sticker\n\n${msgText}`
        }, { quoted: loading })
      } finally {
        await conn.sendMessage(m.chat, { delete: loading.key }).catch(() => {})
      }
      return
    }

    if (text && !isNaN(text)) {
      const idx = parseInt(text, 10) - 1
      if (idx >= 0 && idx < quotes.length) {
        await conn.sendMessage(m.chat, {
          text: `📜 *CITAZIONE #${idx + 1}*\n\n${quotes[idx]}`
        }, { quoted: m })
        return
      }
      return m.reply(`❌ Numero non valido! Usa da 1 a ${quotes.length}.`)
    }

    const qi = Math.floor(Math.random() * quotes.length)
    await conn.sendMessage(m.chat, {
      text: `📜 *CITAZIONE CASUALE*\n\n${quotes[qi]}`
    }, { quoted: m })
  } catch (err) {
    console.error('[fun-quote] Errore:', err)
    m.reply('❌ Errore durante il recupero della citazione!')
  }
}

handler.help      = ['quote <numero>', 'quote (rispondi a un messaggio)']
handler.tags      = ['fun', 'utils']
handler.command   = /^quote$/i
handler.prefix    = false
export default handler

