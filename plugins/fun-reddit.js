// Plugin by Elixir & 888 staff
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
  const subCommand = (args[0] || '').toLowerCase()

  if (!text || subCommand === 'cerca' || subCommand === 'search') {
    const searchQuery = subCommand === 'cerca' || subCommand === 'search' ? args.slice(1).join(' ') : text
    if (!searchQuery) return m.reply('⚠️ *Specifica un termine di ricerca.*\n\nEsempio: ' + usedPrefix + 'reddit cerca gatti')

    await m.reply(`🔍 *Cerco "${searchQuery}" su Reddit...*`)

    try {
      const res = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&limit=5&sort=relevance`)
      if (!res.ok) throw new Error('Errore API Reddit')
      const data = await res.json()

      const posts = data.data?.children?.filter(c => c.data?.post_hint || c.data?.url_overridden_by_dest).slice(0, 5)
      if (!posts || posts.length === 0) return m.reply('❌ *Nessun risultato trovato.*')

      const results = posts.map((post, i) => {
        const p = post.data
        return `${i + 1}. *${p.title}*\n   👤 u/${p.author} | 👍 ${p.ups} | 💬 ${p.num_comments}\n   🔗 ${p.url}`
      }).join('\n\n')

      await m.reply(`📋 *RISULTATI REDDIT*\n\n${results}\n\n━━━━━━━━━━━━━━━━━━\nUsa ${usedPrefix}reddit *[link del post]* per scaricare il media.`)
    } catch (e) {
      m.reply('❌ *Errore durante la ricerca su Reddit.*')
    }
    return
  }

  if (text.includes('reddit.com') || text.includes('redd.it')) {
    await m.reply('⬇️ *Scarico il media da Reddit...*')

    try {
      let jsonUrl = text.replace(/\/?$/, '.json')
      if (text.includes('?')) jsonUrl = text.split('?')[0] + '.json'

      const res = await fetch(jsonUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      if (!res.ok) throw new Error('Errore API Reddit')
      const data = await res.json()

      const post = data[0]?.data?.children?.[0]?.data
      if (!post) throw new Error('Post non trovato')

      const mediaUrl = post.url_overridden_by_dest || post.url
      const title = post.title
      const author = post.author
      const ups = post.ups
      const comments = post.num_comments
      const subreddit = post.subreddit_name_prefixed

      const caption = `📌 *REDDIT*\n\n` +
        `📰 *${title}*\n` +
        `👤 u/${author} | ${subreddit}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👍 ${ups} | 💬 ${comments} commenti`

      const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('v.redd.it') || post.is_video
      const isImage = mediaUrl.includes('.jpg') || mediaUrl.includes('.png') || mediaUrl.includes('.jpeg') || mediaUrl.includes('.gif') || mediaUrl.includes('.webp') || mediaUrl.includes('i.redd.it')

      if (post.is_video && post.media?.reddit_video?.fallback_url) {
        await conn.sendMessage(m.chat, { video: { url: post.media.reddit_video.fallback_url }, caption }, { quoted: m })
      } else if (isVideo) {
        await conn.sendMessage(m.chat, { video: { url: mediaUrl }, caption }, { quoted: m })
      } else if (isImage) {
        await conn.sendMessage(m.chat, { image: { url: mediaUrl }, caption }, { quoted: m })
      } else {
        await m.reply(`📌 *REDDIT*\n\n📰 *${title}*\n👤 u/${author}\n\n${mediaUrl}`)
      }
    } catch (e) {
      m.reply('❌ *Errore durante il download del media.*')
    }
    return
  }

  if (subCommand === 'top') {
    const subreddit = args[1]?.replace('r/', '') || 'italy'
    await m.reply(`🔝 *Recupero i top post da r/${subreddit}...*`)

    try {
      const res = await fetch(`https://www.reddit.com/r/${subreddit}/top.json?limit=10&t=week`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      if (!res.ok) throw new Error('Subreddit non trovato')
      const data = await res.json()

      const posts = data.data?.children?.filter(c => c.data?.post_hint || c.data?.url).slice(0, 10)
      if (!posts || posts.length === 0) return m.reply('❌ *Nessun post trovato in questo subreddit.*')

      const results = posts.map((post, i) => {
        const p = post.data
        return `${i + 1}. *${p.title}*\n   👤 u/${p.author} | 👍 ${p.ups}\n   🔗 ${p.url}`
      }).join('\n\n')

      await m.reply(`🔝 *TOP POST — r/${subreddit}*\n\n${results}`)
    } catch (e) {
      m.reply('❌ *Errore.* Subreddit non trovato o problema di rete.')
    }
    return
  }

  return m.reply(`⚠️ *Comando non valido.*\n\n• ${usedPrefix}reddit cerca *[termine]*\n• ${usedPrefix}reddit top *[subreddit]*\n• ${usedPrefix}reddit *[link]*`)
}

handler.help = ['reddit']
handler.tags = ['downloader']
handler.command = /^(reddit)$/i

export default handler
