import uploadImage from '../../lib/uploadImage.js'

let handler = async (m, { conn, command }) => {
  if (!m.quoted) return m.reply('Rispondi a un messaggio con .brat')
  let text = m.quoted.text || ''
  if (!text) return m.reply('Il messaggio non contiene testo')

  let buffer = Buffer.from(text, 'utf-8')
  let url = await uploadImage(buffer)

  await conn.sendMessage(
    m.chat,
    { sticker: { url } },
    { quoted: m }
  )
}

handler.command = /^brat$/i
handler.tags = ['fun']
handler.help = ['brat']

export default handler