import fetch from 'node-fetch'
import { sticker } from '../lib/sticker.js'

const fetchJson = async (url, options) => {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`)
  return response.json()
}

let handler = async (m, { conn, text }) => {

  // ───────────────────────────────
  // 🔥 NESSUN INPUT — 888
  // ───────────────────────────────
  if (!text) {
    return m.reply(
`╭━━━〔 😎 *EMOJIMIX 888* 〕━━━┈
┃ Scegli quali emoji mixare!
┃━━━━━━━━━━━━━━━━━━
┃ Esempio:
┃ ➜ .emojimix 😋 + 🤤
╰━━━━━━━━━━━━━━━━━━┈`
    )
  }

  // ───────────────────────────────
  // 🔥 ESTRAZIONE EMOJI — 888
  // ───────────────────────────────
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)/gu
  let matches = [...text.matchAll(emojiRegex)].map(match => match[0])

  let emoji1 = matches[0]
  let emoji2 = matches[1]

  if (!emoji1 || !emoji2 || matches.length !== 2) {
    return m.reply(
`╭━━━〔 ❌ *ERRORE EMOJI* 〕━━━┈
┃ Devi usare esattamente *2 emoji*
┃ separate dal simbolo ➜ "+"
┃━━━━━━━━━━━━━━━━━━
┃ Esempio:
┃ ➜ 😎 + 😡
╰━━━━━━━━━━━━━━━━━━┈`
    )
  }

  try {

    // ───────────────────────────────
    // 🔥 RICHIESTA API — 888
    // ───────────────────────────────
    const url =
      `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`

    const anu = await fetchJson(url)

    if (!anu.results || anu.results.length === 0) {
      return m.reply(
`╭━━━〔 ❌ *MIX NON DISPONIBILE* 〕━━━┈
┃ Non è stato possibile mixare
┃ queste emoji. Riprova con altre.
╰━━━━━━━━━━━━━━━━━━┈`
      )
    }

    // ───────────────────────────────
    // 🔥 GENERAZIONE STICKER — 888
    // ───────────────────────────────
    for (const res of anu.results) {
      const stiker = await sticker(false, res.url, global.autore, global.nomepack)
      await conn.sendFile(m.chat, stiker, null, { asSticker: true }, m)
    }

  } catch (e) {
    console.error(e)

    return m.reply(
`╭━━━〔 ❌ *ERRORE API* 〕━━━┈
┃ Si è verificato un errore.
┃ Riprova tra qualche secondo.
╰━━━━━━━━━━━━━━━━━━┈`
    )
  }
}

handler.help = ['emojimix']
handler.tags = ['fun']
handler.command = ['emojimix']

export default handler