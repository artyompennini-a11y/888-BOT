import fetch from 'node-fetch'
import { sticker } from '../../lib/sticker.js'

const fetchJson = async (url, options) => {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`)
  return response.json()
}

let handler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply(
`Scegli quali emoji mixare!
Esempio:
.emojimix 😋 + 🤤`
    )
  }

  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)/gu
  let matches = [...text.matchAll(emojiRegex)].map(match => match[0])

  let emoji1 = matches[0]
  let emoji2 = matches[1]

  if (!emoji1 || !emoji2 || matches.length !== 2) {
    return m.reply(
`Errore: usa esattamente 2 emoji separate da "+"
Esempio:
😎 + 😡`
    )
  }

  try {
    const url =
      `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`

    const anu = await fetchJson(url)

    if (!anu.results || anu.results.length === 0) {
      return m.reply(`Mix non disponibile, prova altre emoji.`)
    }

    for (const res of anu.results) {
      const stiker = await sticker(false, res.url, global.autore, global.nomepack)
      await conn.sendFile(m.chat, stiker, null, { asSticker: true }, m)
    }

  } catch (e) {
    console.error(e)
    return m.reply(`Errore API, riprova.`)
  }
}

handler.help = ['emojimix']
handler.tags = ['fun']
handler.command = ['emojimix']

export default handler