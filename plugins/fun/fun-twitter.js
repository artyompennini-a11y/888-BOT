// Plugin by Elixir & 888 staff
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`⚠️ *Uso corretto:* ${usedPrefix + command} *[link Twitter/X]*\n\nEsempio: ${usedPrefix + command} https://x.com/...`)

  if (!text.includes('twitter.com') && !text.includes('x.com')) {
    return m.reply('❌ *Inserisci un link valido di Twitter/X.*')
  }

  await m.reply('⬇️ *Scarico il video da Twitter/X...*')

  try {
    const apiUrl = `https://api.vxtwitter.com/${getTweetId(text)}`
    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error('Errore API')

    const data = await res.json()
    if (!data || !data.media_urls || data.media_urls.length === 0) {
      throw new Error('Nessun media trovato')
    }

    const videoUrl = data.media_urls[0]
    const author = `${data.user_name} (@${data.user_screen_name})`
    const text_content = data.text || ''
    const likes = data.likes || 0
    const retweets = data.retweets || 0

    const caption = `🐦 *TWITTER/X*\n\n` +
      `👤 *${author}*\n` +
      `💬 ${text_content}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `❤️ Like: ${likes} | 🔁 RT: ${retweets}`

    const isVideo = videoUrl.includes('.mp4') || videoUrl.includes('/video/')
    const isImage = videoUrl.includes('.jpg') || videoUrl.includes('.png') || videoUrl.includes('.jpeg') || videoUrl.includes('.webp') || data.media_ext === 'jpg' || data.media_ext === 'png'

    if (isVideo) {
      await conn.sendMessage(m.chat, { video: { url: videoUrl }, caption }, { quoted: m })
    } else if (isImage) {
      await conn.sendMessage(m.chat, { image: { url: videoUrl }, caption }, { quoted: m })
    } else {
      // Prova come video se non è immagine
      await conn.sendMessage(m.chat, { video: { url: videoUrl }, caption }, { quoted: m })
    }
  } catch (e) {
    m.reply('❌ *Errore durante il download.* Il video potrebbe essere protetto o il link non è valido.')
  }
}

function getTweetId(url) {
  const match = url.match(/\/status\/(\d+)/)
  if (match) return match[1]
  const parts = url.split('/').filter(Boolean)
  return parts[parts.length - 1]
}

handler.help = ['twitter', 'x']
handler.tags = ['downloader']
handler.command = /^(twitter|xdl|twdl)$/i

export default handler
