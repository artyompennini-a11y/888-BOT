import { sticker } from '../../lib/sticker.js'
import { createCanvas } from '@napi-rs/canvas'

const handler = async (m, { conn }) => {
  try {
    let q = m.quoted ? m.quoted : m
    
    if (q.msg || q.mediaKey) {
      let mime = (q.msg || q).mimetype || ''
      
      if (!mime.includes('image') && !mime.includes('video')) {
        return m.reply('⚠️ Rispondi a un\'immagine, video o messaggio di testo!')
      }
      
      let media = await q.download?.()
      if (!media) return m.reply('❌ Errore nel download')
      
      let stk = await sticker(false, media, m.pushName)
      await conn.sendFile(m.chat, stk, 'sticker.webp', '', m, false, {
        asSticker: true
      })
    }
    else if (q.text && !q.msg) {
      let text = q.text
      
      const canvas = createCanvas(512, 512)
      const ctx = canvas.getContext('2d')
      
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, 512, 512)
      
      let fontSize = 60
      ctx.font = `bold ${fontSize}px Arial`
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      let textWidth = ctx.measureText(text).width
      if (textWidth > 450) {
        fontSize = Math.floor((450 / textWidth) * fontSize)
        ctx.font = `bold ${fontSize}px Arial`
      }
      
      let lines = []
      let maxCharsPerLine = 20
      
      if (text.length > maxCharsPerLine) {
        for (let i = 0; i < text.length; i += maxCharsPerLine) {
          lines.push(text.substr(i, maxCharsPerLine))
        }
      } else {
        lines = [text]
      }
      
      const lineHeight = fontSize + 20
      const totalHeight = lines.length * lineHeight
      let startY = (512 - totalHeight) / 2 + fontSize / 2
      
      for (let line of lines) {
        ctx.fillText(line, 256, startY)
        startY += lineHeight
      }
      
      const buffer = canvas.toBuffer('image/png')
      let stk = await sticker(false, buffer, m.pushName)
      
      await conn.sendFile(m.chat, stk, 'sticker.webp', '', m, false, {
        asSticker: true
      })
    }
    else {
      m.reply('⚠️ Rispondi a un\'immagine, video o messaggio di testo!')
    }
    
  } catch (error) {
    console.error(error)
    m.reply('❌ Errore: ' + error.message)
  }
}

handler.help = ['stiker', 'stikergif']
handler.tags = ['sticker']
handler.command = /^(s|stiker|sticker|stikergif|stickergif)$/i

export default handler