//Plugin by Elixir, Punisher & 888 staff
import fs from 'fs'
import path from 'path'

let handler = async (m, { conn }) => {
  const audioPath = path.join(process.cwd(), 'media', 'dadobestemmia.mp3.oga')

  if (!fs.existsSync(audioPath)) {
    return conn.sendMessage(m.chat, { text: '❌ Audio dadobestemmia non trovato!' }, { quoted: m })
  }

  await conn.sendMessage(m.chat, {
    audio: fs.readFileSync(audioPath),
    mimetype: 'audio/mpeg',
    ptt: false
  }, { quoted: m })
}

handler.help = ['dadobestemmia']
handler.tags = ['fun']
handler.command = /^dadobestemmia$/i

export default handler
