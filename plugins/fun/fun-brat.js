import { sticker } from '../../lib/sticker.js'
import Jimp from 'jimp'

let handler = async (m, { conn, text, command }) => {
  const newText = text || m.quoted?.text
  if (!newText) {
    return m.reply(
      "Uso:\n.brat <testo>\nEsempio: .brat Hello"
    )
  }

  try {
    const sanitized = String(newText)
      .replace(/[^\x20-\x7e]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const size = 512
    const bgColor = 0x7a0dffff   // viola brat
    const textColor = 0xffffffff

    const img = new Jimp(size, size, bgColor)

    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE)

    const maxWidth = size - 40
    const lines = []
    let current = ""

    for (const w of sanitized.split(" ")) {
      const test = current ? current + " " + w : w
      if (Jimp.measureText(font, test) > maxWidth) {
        lines.push(current)
        current = w
      } else {
        current = test
      }
    }
    if (current) lines.push(current)

    const textBlock = lines.join("\n")
    const textHeight = Jimp.measureTextHeight(font, textBlock, maxWidth)

    const x = (size - maxWidth) / 2
    const y = (size - textHeight) / 2

    img.print(font, x, y, { text: textBlock, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER })

    const buffer = await img.getBufferAsync(Jimp.MIME_PNG)

    const senderName = m.pushName || m.sender.split('@')[0]
    const packname = senderName
    const author = "888-BOT"

    const st = await sticker(buffer, false, packname, author)
    await conn.sendFile(m.chat, st, "sticker.webp", "", m)

  } catch (e) {
    m.reply("Errore: " + e.message)
  }
}

handler.help = ['brat <testo>']
handler.tags = ['tools']
handler.command = /^brat$/i

export default handler