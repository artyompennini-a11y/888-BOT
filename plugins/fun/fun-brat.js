import { sticker } from '../../lib/sticker.js'
import fluent_ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import os from 'os'

let jimpCtx = null
async function getJimp() {
  if (jimpCtx) return jimpCtx
  const mod = await import('jimp')
  const JimpClass = mod.Jimp || mod.default || mod
  const legacy =
    typeof JimpClass.FONT_SANS_16_WHITE !== 'undefined' ||
    typeof JimpClass.MIME_PNG === 'string'
  jimpCtx = { mod, JimpClass, legacy }
  return jimpCtx
}

async function getFont(size) {
  const { mod, JimpClass, legacy } = await getJimp()
  if (legacy) {
    const sizes = [8, 10, 12, 14, 16, 32, 64, 128].filter(
      (s) => JimpClass[`FONT_SANS_${s}_WHITE`] !== undefined
    )
    if (!sizes.length) throw new Error('font bitmap jimp non disponibili')
    const nearest = sizes.slice().sort(
      (a, b) => Math.abs(a - size) - Math.abs(b - size) || b - a
    )[0]
    return JimpClass.loadFont(JimpClass[`FONT_SANS_${nearest}_WHITE`])
  }
  const fonts = await import('jimp/fonts')
  const sizes = Object.keys(fonts)
    .filter((k) => /^SANS_\d+_WHITE$/.test(k))
    .map((k) => parseInt(k.slice(5), 10))
  if (!sizes.length) throw new Error('font bitmap jimp non disponibili')
  const nearest = sizes.slice().sort(
    (a, b) => Math.abs(a - size) - Math.abs(b - size) || b - a
  )[0]
  return mod.loadFont(fonts[`SANS_${nearest}_WHITE`])

function newImage(ctx, width, height, color) {
  return ctx.legacy
    ? new ctx.JimpClass(width, height, color)
    : new ctx.JimpClass({ width, height, color })
}

function textWidth(ctx, font, text) {
  const measure = ctx.JimpClass.measureText || ctx.mod.measureText
  if (typeof measure === 'function') return measure(font, String(text))
  return String(text).length * 10
}

function bitmapOf(image) {
  const bitmap = image.bitmap
  return {
    data: bitmap.data,
    width: bitmap.width || image.width,
    height: bitmap.height || image.height,
  }
}

function fillRoundRect(image, x, y, w, h, radius, rgba) {
  const { data, width: imgW, height: imgH } = bitmapOf(image)
  for (let py = 0; py < h; py++) {
    const cy = y + py
    if (cy < 0 || cy >= imgH) continue
    for (let px = 0; px < w; px++) {
      const cx = x + px
      if (cx < 0 || cx >= imgW) continue
      const dx = Math.max(0, Math.min(cx - x, w - cx) - radius)
      const dy = Math.max(0, Math.min(cy - y, h - cy) - radius)
      const d = Math.hypot(Math.max(0, radius - dx), Math.max(0, radius - dy))
      if (d <= 0) continue
      const coverage = Math.max(0, Math.min(1, radius - d + 0.5))
      if (coverage <= 0) continue
      const idx = ((cy * imgW) + cx) << 2
      const dstAlpha = data[idx + 3] / 255
      const srcAlpha = (rgba[3] / 255) * coverage
      const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha)
      if (outAlpha <= 0) { data[idx + 3] = 0; continue }
      for (let c = 0; c < 3; c++) {
        data[idx + c] = Math.round(
          (rgba[c] * srcAlpha + data[idx + c] * dstAlpha * (1 - srcAlpha)) / outAlpha
        )
      }
      data[idx + 3] = Math.round(outAlpha * 255)
    }
  }
  return image
}

function tintLayer(layer, color) {
  const data = layer.bitmap.data
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    data[i] = Math.round((data[i] * color[0]) / 255)
    data[i + 1] = Math.round((data[i + 1] * color[1]) / 255)
    data[i + 2] = Math.round((data[i + 2] * color[2]) / 255)
  }
  return layer
}

function makeTextLayer(ctx, font, text, color, lineHeight) {
  const lines = String(text ?? '').split('\n')
  const maxWidth = Math.max(...lines.map((l) => textWidth(ctx, font, l)))
  const totalHeight = lines.length * lineHeight
  const layer = newImage(ctx, Math.max(4, maxWidth + 4), Math.max(24, totalHeight + 8), 0x00000000)
  try {
    if (ctx.legacy) {
      for (let i = 0; i < lines.length; i++) {
        layer.print(font, 0, i * lineHeight, lines[i])
      }
    } else {
      for (let i = 0; i < lines.length; i++) {
        layer.print({ font, x: 0, y: i * lineHeight, text: lines[i] })
      }
    }
  } catch {}
  tintLayer(layer, color)
  return layer
}

function compositeOver(dst, src, offsetX = 0, offsetY = 0) {
  const d = dst.bitmap.data
  const s = src.bitmap.data
  const w = Math.min(dst.width - offsetX, src.width)
  const h = Math.min(dst.height - offsetY, src.height)
  for (let sy = 0; sy < h; sy++) {
    const dy = sy + offsetY
    if (dy < 0 || dy >= dst.height) continue
    for (let sx = 0; sx < w; sx++) {
      const dx = sx + offsetX
      if (dx < 0 || dx >= dst.width) continue
      const si = ((sy * src.width) + sx) << 2
      const di = ((dy * dst.width) + dx) << 2
      const sa = s[si + 3] / 255
      if (sa <= 0) continue
      const da = d[di + 3] / 255
      const outAlpha = sa + da * (1 - sa)
      if (outAlpha <= 0) { d[di + 3] = 0; continue }
      for (let c = 0; c < 3; c++) {
        d[di + c] = Math.round(
          (s[si + c] * sa + d[di + c] * da * (1 - sa)) / outAlpha
        )
      }
      d[di + 3] = Math.round(outAlpha * 255)
    }
  }
  return dst
}

async function toPngBuffer(ctx, image) {
  if (typeof image.getBufferAsync === 'function') {
    return image.getBufferAsync(ctx.JimpClass.MIME_PNG || 'image/png')
  }
  return image.getBuffer('image/png')
}

function wrapText(text, maxWidth, approxCharWidth) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length * approxCharWidth > maxWidth && current) {
      lines.push(current)
      current = word
      if (lines.length >= 3) break
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function chooseFontSize(text) {
  const len = String(text).length
  if (len <= 8) return 64
  if (len <= 16) return 32
  if (len <= 28) return 16
  if (len <= 40) return 14
  return 12
}
}


let handler = async (m, { conn, text, command }) => {
  const newText = text || m.quoted?.text
  if (!newText) {
    return m.reply(
      '📝 *Uso:*\n- .brat <testo>\n- .bratvid <testo>\n💡 *Esempio:* .brat Hello World\n\nPuoi anche rispondere a un messaggio per usare il suo testo.'
    )
  }

  try {
    const isVideo = command.includes('vid')
    const senderName = m.pushName || m.sender.split('@')[0] || 'Utente'
    const packname = senderName
    const author = '888-BOT'

    // Sanifica testo (font jimp bitmap non supportano emoji/unicode esteso)
    const CHAR_MAP = {
      'œ':'oe','ł':'l','đ':'d','ħ':'h','ı':'i','ğ':'g','ş':'s',
      'š':'s','ž':'z','č':'c','ć':'c','ę':'e','ą':'a','ń':'n',
      'ś':'s','ź':'z','ż':'z','ř':'r','ů':'u','ť':'t','ď':'d','ň':'n'
    }
    const sanitized = String(newText)
      .normalize('NFC')
      .replace(/[^\x20-\x7e\u00a1-\u00ff]/g, (ch) => CHAR_MAP[ch.toLowerCase()] || ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!isVideo) {
      // ── Genera sticker con Jimp ──────────────────────────────────────────
      const ctx = await getJimp()
      const size = 512
      const radius = 48
      const bg = [122, 13, 255]      // viola brat
      const border = [255, 255, 255]
      const textColor = [255, 255, 255]

      const fontSize = chooseFontSize(sanitized)
      const font = await getFont(fontSize)
      const approxCharWidth = textWidth(ctx, font, 'A')
      const maxW = size - 80
      const lines = wrapText(sanitized, maxW, Math.max(6, approxCharWidth))
      const lineHeight = Math.max(20, Math.round(fontSize * 1.25))

      const img = newImage(ctx, size, size, 0x00000000)
      // bordo bianco esterno
      fillRoundRect(img, 3, 3, size - 6, size - 6, radius + 3, [...border, 255])
      // sfondo viola
      fillRoundRect(img, 0, 0, size, size, radius, [...bg, 255])

      if (lines.length) {
        const textLayer = makeTextLayer(ctx, font, lines.join('\n'), textColor, lineHeight)
        if (textLayer) {
          const offsetX = Math.round((size - textLayer.width) / 2)
          const offsetY = Math.round((size - textLayer.height) / 2)
          compositeOver(img, textLayer, offsetX, offsetY)
        }
      }

      // mini cornice interna per stile
      fillRoundRect(img, 10, 10, size - 20, size - 20, radius - 8, [255, 255, 255, 60])

      let pngBuffer
      try {
        pngBuffer = await toPngBuffer(ctx, img)
      } catch (e) {
        console.error('[brat] errore png buffer:', e)
        return m.reply(`${global.errore}\n\nImpossibile generare l'immagine.`)
      }

      const stickerBuffer = await sticker(pngBuffer, false, packname, author)
      await conn.sendFile(m.chat, stickerBuffer, 'sticker.webp', '', m)
    } else {
      // ── Video: genera immagine Jimp e converte con ffmpeg ───────────────
      const ctx = await getJimp()
      const size = 512
      const radius = 48
      const bg = [122, 13, 255]
      const textColor = [255, 255, 255]

      const fontSize = chooseFontSize(sanitized)
      const font = await getFont(fontSize)
      const approxCharWidth = textWidth(ctx, font, 'A')
      const maxW = size - 80
      const lines = wrapText(sanitized, maxW, Math.max(6, approxCharWidth))
      const lineHeight = Math.max(22, Math.round(fontSize * 1.35))

      const img = newImage(ctx, size, size, 0x00000000)
      fillRoundRect(img, 3, 3, size - 6, size - 6, radius + 3, [255, 255, 255, 255])
      fillRoundRect(img, 0, 0, size, size, radius, [...bg, 255])

      if (lines.length) {
        const textLayer = makeTextLayer(ctx, font, lines.join('\n'), textColor, lineHeight)
        if (textLayer) {
          const offsetX = Math.round((size - textLayer.width) / 2)
          const offsetY = Math.round((size - textLayer.height) / 2)
          compositeOver(img, textLayer, offsetX, offsetY)
        }
      }

      const tmpDir = os.tmpdir()
      const pngPath = path.join(tmpDir, `brat_${Date.now()}.png`)
      const outPath = path.join(tmpDir, `brat_${Date.now()}.mp4`)
      await fs.promises.writeFile(pngPath, await toPngBuffer(ctx, img))

      await new Promise((resolve, reject) => {
        fluent_ffmpeg(pngPath)
          .inputFormat('png')
          .videoCodec('libx264')
          .outputOptions([
            '-t', '2',
            '-pix_fmt', 'yuv420p',
            '-r', '10',
            '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0'
          ])
          .output(outPath)
          .on('end', resolve)
          .on('error', reject)
          .run()
      })

      await conn.sendFile(m.chat, outPath, 'brat.mp4', `"${sanitized}"`, m)
      await fs.promises.unlink(pngPath).catch(() => {})
      await fs.promises.unlink(outPath).catch(() => {})
    }
  } catch (error) {
    console.error('[brat] errore:', error)
    await m.react?.('❌')
    m.reply(`${global.errore}\n\n${error.message}`)
  }
}

handler.help = ['brat <testo>', 'bratvid <testo>']
handler.tags = ['strumenti']
handler.command = /^brat(vid(eo)?)?$/i
handler.register = false

export default handler