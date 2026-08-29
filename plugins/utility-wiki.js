import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`❌ Uso: ${usedPrefix + command} <ricerca>\n\nEsempio: ${usedPrefix + command} Italia`)
  }

  try {
    const query = encodeURIComponent(text.trim())
    const url = `https://it.wikipedia.org/wiki/Speciale:Search?search=${query}&go=Go`
    
    const res = await fetch(url)
    const html = await res.text()
    const $ = cheerio.load(html)
    
    const firstResult = $('.mw-search-result-heading a').first()
    const title = firstResult.text().trim()
    const link = 'https://it.wikipedia.org' + firstResult.attr('href')
    
    if (!title) {
      return m.reply('❌ Nessun risultato trovato su Wikipedia.')
    }

    const articleRes = await fetch(link)
    const articleHtml = await articleRes.text()
    const $$ = cheerio.load(articleHtml)
    
    let snippet = $$('.mw-parser-output p').first().text().trim()
    snippet = snippet.replace(/\[\d+\]/g, '').trim()
    
    if (snippet.length > 500) {
      snippet = snippet.substring(0, 500) + '...'
    }

    const caption = `📚 *${title}*\n\n${snippet || 'Nessuna descrizione disponibile.'}\n\n🔗 ${link}`

    await conn.sendMessage(m.chat, { text: caption }, { quoted: m })
  } catch (e) {
    m.reply(`❌ Errore nella ricerca Wikipedia: ${e.message}`)
  }
}

handler.command = ['wiki', 'wikipedia', 'cerca']
handler.help = ['wiki <ricerca>']
handler.tags = ['utility', 'info']

export default handler
