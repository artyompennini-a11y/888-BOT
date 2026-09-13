// Plugin by Elixir & 888 staff

let handler = async (m, { conn, text, usedPrefix, command }) => {
  await m.reply('📰 *Recupero le ultime notizie...*')

  try {
    const res = await fetch('https://www.ansa.it/sito/notizie/topnews/rss.xml')
    if (!res.ok) throw new Error('Errore RSS')
    const xml = await res.text()

    const items = extractItems(xml).slice(0, 8)
    if (items.length === 0) return m.reply('❌ *Nessuna notizia trovata.*')

    const newsList = items.map((item, i) => {
      return `${i + 1}. *${item.title}*\n   📅 ${item.pubDate || ''}\n   🔗 ${item.link}`
    }).join('\n\n')

    await m.reply(
      `📰 *ULTIME NOTIZIE — ANSA*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `${newsList}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Fonte: Ansa.it`
    )
  } catch (e) {
    m.reply('❌ *Errore durante il recupero delle notizie.* Riprova più tardi.')
  }
}

function extractItems(xml) {
  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]
    const title = getTag(itemXml, 'title')
    const link = getTag(itemXml, 'link')
    const pubDate = getTag(itemXml, 'pubDate')

    if (title && link) {
      items.push({
        title: decodeEntities(title),
        link: link.trim(),
        pubDate: pubDate ? new Date(pubDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
      })
    }
  }
  return items
}

function getTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return match ? match[1].trim() : ''
}

function decodeEntities(str) {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/'/g, "'")
}

handler.help = ['notizie', 'news']
handler.tags = ['utility']
handler.command = /^(notizie|news)$/i

export default handler
