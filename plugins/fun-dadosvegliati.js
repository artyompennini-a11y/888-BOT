// Plugin by elixir & 888 staff

import fs from 'fs'
import path from 'path'

let handler = async (m, { conn }) => {
  const audioPath = path.join(process.cwd(), 'media', 'dadosvegliati.mp3')

  if (!fs.existsSync(audioPath)) {
    return conn.sendMessage(m.chat, { text: '❌ Audio dadosvegliati non trovato!' }, { quoted: m })
  }

  try {
    await conn.sendMessage(m.chat, {
      audio: fs.readFileSync(audioPath),
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
    }, { quoted: m })
  } catch (e) {
    console.error('❌ .dadosvegliati - errore invio audio:', e)
    return conn.sendMessage(m.chat, { text: '❌ Errore durante l\'invio dell\'audio.' }, { quoted: m })
  }
}

handler.help = ['dadosvegliati']
handler.tags = ['fun']
handler.command = /^dadosvegliati$/i

export default handler
