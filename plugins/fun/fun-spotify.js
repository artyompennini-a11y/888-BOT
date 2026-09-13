// Plugin by Elixir & 888 staff
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
  if (!text) return m.reply(`⚠️ *Uso corretto:* ${usedPrefix + command} *[link o nome canzone]*\n\nEsempio: ${usedPrefix + command} https://open.spotify.com/track/...`)

  await m.reply('🔍 *Cerco su Spotify...*')

  const isUrl = text.includes('spotify.com/')
  const query = encodeURIComponent(text)

  try {
    let data
    if (isUrl) {
      const type = text.includes('/track/') ? 'track' : text.includes('/album/') ? 'album' : text.includes('/playlist/') ? 'playlist' : 'track'
      const id = text.split('/').pop().split('?')[0]
      const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(text)}`)
      data = await res.json()
    } else {
      const res = await fetch(`https://api.spotifydown.com/search/${query}`, {
        headers: { 'Origin': 'https://spotifydown.com' }
      })
      data = await res.json()
    }

    if (!data || !data.title) return m.reply('❌ *Nessun risultato trovato.*')

    const result = `🎵 *SPOTIFY*\n\n` +
      `🎤 *Titolo:* ${data.title}\n` +
      `👤 *Artista:* ${data.author_name || data.artist || 'N/D'}\n` +
      `${data.thumbnail_url ? `🖼️ *Copertina:* ${data.thumbnail_url}\n` : ''}` +
      `${data.duration ? `⏱️ *Durata:* ${data.duration}\n` : ''}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🔗 ${text}`

    if (data.thumbnail_url) {
      await conn.sendMessage(m.chat, {
        image: { url: data.thumbnail_url },
        caption: result
      }, { quoted: m })
    } else {
      await m.reply(result)
    }
  } catch (e) {
    m.reply('❌ *Errore durante la ricerca Spotify.* Riprova più tardi.')
  }
}

handler.help = ['spotify']
handler.tags = ['downloader']
handler.command = /^(spotify|sp)$/i

export default handler
