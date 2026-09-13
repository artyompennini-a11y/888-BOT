//Plugin by Elixir, Punisher & 888 staff
import fs from 'fs'
import path from 'path'

let handler = async (m, { conn }) => {
  const audioPath = path.join(process.cwd(), 'media', 'dadosclera.mp3')

  if (!fs.existsSync(audioPath)) {
    return conn.sendMessage(m.chat, { text: '❌ Audio dadosclera non trovato!' }, { quoted: m })
  }

  await conn.sendMessage(m.chat, {
    audio: fs.readFileSync(audioPath),
    mimetype: 'audio/mpeg',
    ptt: false
  }, { quoted: m })
}

handler.help = ['dadosclera']
handler.tags = ['fun']
handler.command = /^dadosclera$/i

export default handler