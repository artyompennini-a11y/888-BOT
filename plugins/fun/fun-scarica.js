import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {

  // ───────────────────────────────
  // 🔥 ERRORE: NESSUN LINK — 888
  // ───────────────────────────────
  if (!text) {
    return m.reply(
`╭━━━〔 ❌ *ERRORE LINK* 〕━━━┈
┃ Inserisci un link TikTok valido.
┃ Esempio:
┃ ➜ .tt https://www.tiktok.com/...
╰━━━━━━━━━━━━━━━━━━┈`
    )
  }

  // ───────────────────────────────
  // 🔥 ERRORE: LINK NON VALIDO — 888
  // ───────────────────────────────
  if (
    !text.includes('tiktok.com') &&
    !text.includes('vm.tiktok.com')
  ) {
    return m.reply(
`╭━━━〔 ❌ *LINK NON VALIDO* 〕━━━┈
┃ Il link inserito non è un
┃ link TikTok riconosciuto.
╰━━━━━━━━━━━━━━━━━━┈`
    )
  }

  // ───────────────────────────────
  // 🔥 AVVIO DOWNLOAD — 888
  // ───────────────────────────────
  await m.reply(
`╭━━━〔 ⏳ *DOWNLOAD IN CORSO* 〕━━━┈
┃ Sto scaricando il video...
┃ Attendere qualche secondo.
┃━━━━━━━━━━━━━━━━━━
┃ 🔰 888 BOT Downloader
╰━━━━━━━━━━━━━━━━━━┈`
  )

  try {
    const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(text)}`
    const res = await fetch(api)
    const json = await res.json()

    if (!json.data || !json.data.play) {
      return m.reply(
`╭━━━〔 ❌ *ERRORE DOWNLOAD* 〕━━━┈
┃ Impossibile scaricare il video.
┃ Riprova più tardi.
╰━━━━━━━━━━━━━━━━━━┈`
      )
    }

    // ───────────────────────────────
    // 🔥 INVIO VIDEO — 888
    // ───────────────────────────────
    await conn.sendMessage(
      m.chat,
      {
        video: { url: json.data.play },
        mimetype: 'video/mp4',
        caption:
`╭━━━〔 🎬 *VIDEO SCARICATO* 〕━━━┈
┃ 🎵 Titolo:
┃ ➜ ${json.data.title || 'TikTok Video'}
┃━━━━━━━━━━━━━━━━━━
┃ 🔰 888 BOT Downloader
╰━━━━━━━━━━━━━━━━━━┈`
      },
      { quoted: m }
    )

  } catch (e) {
    console.error('[fun-scarica] Errore download TikTok:', e || 'Errore non specificato')

    return m.reply(
`╭━━━〔 ❌ *ERRORE* 〕━━━┈
┃ Si è verificato un errore
┃ durante il download.
╰━━━━━━━━━━━━━━━━━━┈`
    )
  }
}

handler.command = /^(tt|tiktok|scarica)$/i
handler.help = ['tt <link>']
handler.tags = ['downloader']

export default handler