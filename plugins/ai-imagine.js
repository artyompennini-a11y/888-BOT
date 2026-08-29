// Plugin by Elixir & 888 staff
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`⚠️ *Uso corretto:* ${usedPrefix + command} *[descrizione]*\n\nEsempio: ${usedPrefix + command} un gatto cyberpunk che guida una macchina volante`)

  await m.reply('🎨 *Genero immagine...* attendi qualche secondo')

  const prompt = encodeURIComponent(text)
  const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Errore generazione immagine')
    const buffer = await res.buffer()

    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: `🎨 *Immagine generata*\n\n📝 *Prompt:* ${text}\n✨ *Generato da:* 𝟴𝟴𝟴 𝗕𝗢𝗧 AI`
    }, { quoted: m })
  } catch (e) {
    m.reply('❌ *Errore durante la generazione dell\'immagine.* Riprova più tardi.')
  }
}

handler.help = ['aiimg', 'imagine', 'immagina']
handler.tags = ['ai']
handler.command = /^(aiimg|imagine|immagina|disegna)$/i

export default handler
