import fs from 'fs'
import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {

  if (!text) {
    return m.reply(
`❌ Nessun testo rilevato.
Scrivi qualcosa da convertire in audio TTS.

Esempio:
.audio ciao ragazzi`
    )
  }

  await m.reply(
`⏳ Generazione audio...
Attendere qualche secondo...`
  )

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=it&client=tw-ob`

  let res
  try {
    res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })
  } catch (e) {
    return m.reply(
`❌ Errore TTS.
Impossibile recuperare l’audio, riprova più tardi.`
    )
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  const filePath = `./tmp_${Date.now()}.mp3`
  fs.writeFileSync(filePath, buffer)

  await conn.sendMessage(
    m.chat,
    {
      audio: fs.readFileSync(filePath),
      mimetype: 'audio/mpeg'
    },
    { quoted: m }
  )

  fs.unlinkSync(filePath)
}

handler.command = ['audio']
handler.help = ['audio <testo>']
handler.tags = ['fun']

export default handler