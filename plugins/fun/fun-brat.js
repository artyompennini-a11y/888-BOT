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
  const { JimpClass, legacy } = await getJimp()
  const sizes = [8, 10, 12, 14, 16, 32, 64, 128]
  const available = sizes.filter(s => JimpClass[`FONT_SANS_${s}_WHITE`])
  if (!available.length) throw new Error('font non disponibili')
  const nearest = available.sort((a, b) => Math.abs(a - size) - Math.abs(b - size))[0]
  return JimpClass.loadFont(JimpClass[`FONT_SANS_${nearest}_WHITE`])
}

function newImage(ctx, width, height, color) {
  return ctx.legacy
    ? new ctx.JimpClass(width, height, color)
    : new ctx.JimpClass({ width, height, color })
}

function textWidth(ctx, font, text) {
  try {
    return ctx.JimpClass.measureText(font, String(text))
  } catch {
    return String(text).length * 12
  }
}

function bitmapOf(image) {
  const b = image.bitmap
  return { data: b.data, width: b.width, height: b.height }
}

function fillRoundRect(image, x, y, w, h, radius, rgba) {
  const { data, width, height } = bitmapOf(image)
  for (let py = 0; py < h; py++) {
    const cy = y + py
    if (cy < 0 || cy >= height) continue
    for (let px = 0; px < w; px++) {
      const cx = x + px
      if (cx < 0 || cx >= width) continue
      const dx = Math.max(0, Math.min(cx - x, w - cx) - radius)
      const dy = Math.max(0, Math.min(cy - y, h - cy) - radius)
      const d = Math.hypot(Math.max(0, radius - dx), Math.max(0, radius - dy))
      if (d <= 0) continue
      const coverage = Math.max(0, Math.min(1, radius - d + 0.5))
      if (coverage <= 0) continue
      const idx = ((cy * width) + cx) << 2
      const dstA = data[idx + 3] / 255
      const srcA = (rgba[3] / 255) * coverage
      const outA = srcA + dstA * (1 - srcA)
      if (outA <= 0) { data[idx + 3] = 0; continue }
      for (let c = 0; c < 3; c++) {
        data[idx + c] = Math.round(
          (rgba[c] * srcA + data[idx + c] * dstA * (1 - srcA)) / outA
        )
      }
      data[idx + 3] = Math.round(outA * 255)
    }
  }
  return image
}

function tintLayer(layer, color) {
  const d = layer.bitmap.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    d[i] = Math.round((d[i] * color[0]) / 255)
    d[i + 1] = Math.round((d[i + 1] * color[1]) / 255)
    d[i + 2] = Math.round((d[i + 2] * color[2]) / 255)
  }
  return layer
}

function makeTextLayer(ctx, font, text, color, lineHeight) {
  const lines = String(text).split('\n')
  const maxWidth = Math.max(...lines.map(l => textWidth(ctx, font, l)))
  const totalHeight = lines.length * lineHeight
  const layer = newImage(ctx, maxWidth + 4, totalHeight + 8, 0x00000000)
  try {
    for (let i = 0; i < lines.length; i++) {
      layer.print(font, 0, i * lineHeight, lines[i])
    }
  } catch {}
  tintLayer(layer, color)
  return layer
}

function compositeOver(dst, src, ox = 0, oy = 0) {
  const d = dst.bitmap.data
  const s = src.bitmap.data
  const w = Math.min(dst.width - ox, src.width)
  const h = Math.min(dst.height - oy, src.height)
  for (let sy = 0; sy < h; sy++) {
    const dy = sy + oy
    for (let sx = 0; sx < w; sx++) {
      const dx = sx + ox
      const si = ((sy * src.width) + sx) << 2
      const di = ((dy * dst.width) + dx) << 2
      const sa = s[si + 3] / 255
      if (sa <= 0) continue
      const da = d[di + 3] / 255
      const outA = sa + da * (1 - sa)
      if (outA <= 0) { d[di + 3] = 0; continue }
      for (let c = 0; c < 3; c++) {
        d[di + c] = Math.round(
          (s[si + c] * sa + d[di + c] * da * (1 - sa)) / outA
        )
      }
      d[di + 3] = Math.round(outA * 255)
    }
  }
  return dst
}

async function toPngBuffer(ctx, image) {
  try {
    return image.getBufferAsync(ctx.JimpClass.MIME_PNG || 'image/png')
  } catch {
    return image.getBuffer('image/png')
  }
}

function wrapText(text, maxWidth, approxCharWidth) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const w of words) {
    const cand = current ? `${current} ${w}` : w
    if (cand.length * approxCharWidth > maxWidth && current) {
      lines.push(current)
      current = w
      if (lines.length >= 3) break
    } else current = cand
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

let handler = async (m, { conn, text, command }) => {
  const newText = text || m.quoted?.text
  if (!newText) {
    return m.reply(
      '📝 *Uso:*\n- .brat <testo>\n- .bratvid <testo>\n💡 Esempio: .brat Hello'
    )
  }

  try {
    const isVideo = command.includes('vid')
    const senderName = m.pushName || m.sender.split('@')[0] || 'Utente'
    const packname = senderName
    const author = '888-BOT'

    const sanitized = String(newText)
      .normalize('NFC')
      .replace(/[^\x20-\x7e]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const ctx = await getJimp()
    const size = 512
    const radius = 48
    const bg = [122, 13, 255]
    const border = [255, 255, 255]
    const textColor = [255, 255, 255]

    const fontSize = chooseFontSize(sanitized)
    const font = await getFont(fontSize)
    const approxCharWidth = textWidth(ctx, font, 'A')
    const maxW = size - 80
    const lines = wrapText(sanitized, maxW, Math.max(6, approxCharWidth))
    const lineHeight = Math.max(20, Math.round(fontSize * 1.25))

    const img = newImage(ctx, size, size, 0x00000000)
    fillRoundRect(img, 3, 3, size - 6, size - 6, radius + 3, [...border, 255])
    fillRoundRect(img, 0, 0, size, size, radius, [...bg, 255])

    if (lines.length) {
      const textLayer = makeTextLayer(ctx, font, lines.join('\n'), textColor, lineHeight)
      const ox = Math.round((size - textLayer.width) / 2)
      const oy = Math.round((size - textLayer.height) / 2)
      compositeOver(img, textLayer, ox, oy)
    }

    fillRoundRect(img, 10, 10, size - 20, size - 20, radius - 8, [255, 255, 255, 60])

    if (!isVideo) {
      const pngBuffer = await toPngBuffer(ctx, img)
      const stickerBuffer = await sticker(pngBuffer, false, packname, author)
      await conn.sendFile(m.chat, stickerBuffer, 'sticker.webp', '', m)
    } else {
      const tmp = os.tmpdir()
      const pngPath = path.join(tmp, `brat_${Date.now()}.png`)
      const outPath = path.join(tmp, `brat_${Date.now()}.mp4`)
      await fs.promises.writeFile(pngPath, await toPngBuffer(ctx, img))

      await new Promise((resolve, reject) => {
        fluent_ffmpeg(pngPath)
          .inputOptions(['-framerate 10'])
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
  } catch (e) {
    await m.react?.('❌')
    m.reply(`Errore: ${e.message}`)
  }
}

handler.help = ['brat <testo>', 'bratvid <testo>']
handler.tags = ['strumenti']
handler.command = /^brat(vid(eo)?)?$/i
handler.register = false

export default handler