import { createCanvas } from '@napi-rs/canvas'
import { sticker } from '../../lib/sticker.js'

const makeImage = (text) => {
  const canvas = createCanvas(600, 300)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 600, 300)

  ctx.fillStyle = '#000000'
  ctx.font = 'bold 40px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const maxWidth = 550
  const lineHeight = 50
  const words = text.split(' ')
  const lines = []
  let line = ''

  for (let w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = w
    } else line = test
  }
  if (line) lines.push(line)

  const totalHeight = lines.length * lineHeight
  let y = (300 - totalHeight) / 2

  for (let l of lines) {
    ctx.fillText(l, 300, y)
    y += lineHeight
  }

  return canvas.toBuffer('image/png')
}

let handler = async (m, { conn }) => {
  if (!m.quoted) return m.reply('Rispondi a un messaggio con .brat')

  let text =
    m.quoted.text ||
    m.quoted.body ||
    m.quoted.caption ||
    m.quoted.conversation ||
    m.quoted.msg?.conversation ||
    m.quoted.msg?.text ||
    m.quoted.msg?.extendedTextMessage?.text ||
    m.quoted.extendedTextMessage?.text ||
    ''

  text = String(text).trim()
  if (!text) return m.reply('Il messaggio non contiene testo')

  const img = makeImage(text)
  const st = await sticker(img, false, m.pushName || 'brat', '888 bot')

  await conn.sendFile(m.chat, st, 'brat.webp', '', m)
}

handler.command = /^brat$/i
handler.tags = ['fun']
handler.help = ['brat']

export default handler