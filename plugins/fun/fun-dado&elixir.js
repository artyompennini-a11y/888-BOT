//Plugin by Dado, Elixir
import fs from 'fs'
import path from 'path'

let handler = async (m, { conn }) => {
  const audioPath = path.join(process.cwd(), 'media', 'dado&elixir.mp3')

  if (!fs.existsSync(audioPath)) {
    return conn.sendMessage(m.chat, { text: '❌ Audio dado&elixir non trovato!' }, { quoted: m })
  }

  await conn.sendMessage(m.chat, {
    audio: fs.readFileSync(audioPath),
    mimetype: 'audio/mpeg',
    ptt: false
  }, { quoted: m })
}

handler.help = ['dado&elixir']
handler.tags = ['fun']
handler.command = /^dado&elixir$/i

export default handler