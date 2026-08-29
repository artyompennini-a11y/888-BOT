// Plugin by Elixir & 888 staff
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
  if (!text) return m.reply(`⚠️ *Uso corretto:* ${usedPrefix + command} *[termine di ricerca]*\n\nEsempio: ${usedPrefix + command} paesaggi italiani`)

  await m.reply('🔍 *Cerco su Pinterest...*')

  try {
    const query = encodeURIComponent(text)
    const res = await fetch(`https://api.pinterest.com/v3/pidgets/search/pins/?q=${query}&rs=typed&term_meta[]=${query}`)
    if (!res.ok) throw new Error('Errore API Pinterest')
    const data = await res.json()

    const pins = data?.data?.results || []
    if (pins.length === 0) return m.reply('❌ *Nessun risultato trovato.*')

    const pin = pins[0]
    const imageUrl = pin.images?.orig?.url || pin.images?.['237x']?.url || pin.image?.original?.url
    const title = pin.description || text
    const author = pin.pinner?.full_name || 'N/D'
    const likes = pin.repin_count || 0

    if (!imageUrl) return m.reply('❌ *Immagine non trovata.*')

    await conn.sendMessage(m.chat, {
      image: { url: imageUrl },
      caption: `📌 *PINTEREST*\n\n` +
        `🖼️ *${title}*\n` +
        `👤 *Autore:* ${author}\n` +
        `🔁 *Repin:* ${likes}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🔗 ${pin.link || ''}`
    }, { quoted: m })
  } catch (e) {
    m.reply('❌ *Errore durante la ricerca su Pinterest.* Riprova più tardi.')
  }
}

handler.help = ['pinterest']
handler.tags = ['downloader']
handler.command = /^(pinterest|pin)$/i

export default handler
