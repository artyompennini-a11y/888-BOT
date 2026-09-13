// Plugin by Elixir & 888 staff
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`⚠️ *Uso corretto:* ${usedPrefix + command} *[link]*\n\nEsempio: ${usedPrefix + command} https://example.com/very-long-url`)

  const url = text.trim()
  if (!/^https?:\/\/.+/i.test(url)) return m.reply('❌ *Inserisci un link valido che inizia con http:// o https://*')

  await m.reply('🔗 *Accorcio il link...*')

  try {
    const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error('Errore API')
    const shortUrl = (await res.text()).trim()

    if (!shortUrl || shortUrl.includes('Error')) throw new Error('Link non valido')

    await m.reply(
      `🔗 *LINK ACCORCIATO:*\n\n` +
      `📌 *Originale:* ${url}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `✨ *Accorciato:*\n${shortUrl}`
    )
  } catch (e) {
    m.reply('❌ *Errore durante l\'accorciamento del link.*')
  }
}

handler.help = ['urly', 'shortlink', 'accorcia']
handler.tags = ['utility']
handler.command = /^(urly|shortlink|accorcia)$/i

export default handler
