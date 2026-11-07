// Plugin by Elixir, Punisher & 888 Staff
import yts from 'yt-search'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

const FOOTER = '𝟴𝟴𝟴 𝗕𝗢𝗧 • Downloader'
const MAX_CARDS = 5

const run = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (err) => (err ? reject(err) : resolve()))
  })

const fmtViews = (n) => Number(n || 0).toLocaleString('it-IT')

const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

const youtubeId = (url) => {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/)
  return m ? m[1] : null
}

const buildButtons = (usedPrefix, url) => [
  {
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({
      display_text: '🎧 𝐌𝐏𝟑',
      id: `${usedPrefix}playaud ${url}`
    })
  },
  {
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({
      display_text: '📹 𝐌𝐏𝟒',
      id: `${usedPrefix}playvid ${url}`
    })
  }
]

const sendCarousel = async (conn, m, usedPrefix, query, videos) => {
  const cards = videos.slice(0, MAX_CARDS).map((v, i) => ({
    image: { url: v.thumbnail },
    title: `${i + 1}. ${cut(v.title, 60)}`,
    body: `👤 ${v.author?.name || '—'}\n⏱️ ${v.timestamp || '—'}  •  👁️ ${fmtViews(v.views)}`,
    footer: FOOTER,
    buttons: buildButtons(usedPrefix, v.url)
  }))

  await conn.sendMessage(
    m.chat,
    {
      text: `─── 𝟴𝟴𝟴 𝗣𝗟𝗔𝗬𝗘𝗥 ───\n\n🔎 *Risultati per:*\n• ${query}\n\n👇 *Scegli il brano e il formato*`,
      footer: FOOTER,
      cards
    },
    { quoted: m }
  )
}

const sendSingleMenu = async (conn, m, usedPrefix, vid) => {
  const infoMsg = `
─── 𝟴𝟴𝟴 𝗣𝗟𝗔𝗬𝗘𝗥 ───

🎵 *Titolo:* ${vid.title}
⏱️ *Durata:* ${vid.timestamp || '—'}
👤 *Canale:* ${vid.author?.name || '—'}
👁️ *Visualizzazioni:* ${fmtViews(vid.views)}

👇 *Scegli il formato:*`.trim()

  const buttons = [
    { buttonId: `${usedPrefix}playaud ${vid.url}`, buttonText: { displayText: '🎧 𝐌𝐏𝟑' }, type: 1 },
    { buttonId: `${usedPrefix}playvid ${vid.url}`, buttonText: { displayText: '📹 𝐌𝐏𝟒' }, type: 1 }
  ]

  const payload = vid.thumbnail
    ? { image: { url: vid.thumbnail }, caption: infoMsg, footer: FOOTER, buttons, headerType: 4 }
    : { text: infoMsg, footer: FOOTER, buttons, headerType: 1 }

  return conn.sendMessage(m.chat, payload, { quoted: m })
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let outputPath
  let voicePath

  if (!text) {
    return m.reply(
      `💡 *Uso corretto:* 
${usedPrefix + command} <nome canzone>`
    )
  }

  try {
    const isDownloadCommand = command === 'playaud' || command === 'playvid'

    const directUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(text.trim())
      ? text.trim()
      : null

    if (!isDownloadCommand) {
      if (directUrl) {
        const id = youtubeId(directUrl)
        const vid = {
          url: directUrl,
          title: directUrl,
          timestamp: '',
          author: { name: '' },
          views: 0,
          thumbnail: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
        }
        return await sendSingleMenu(conn, m, usedPrefix, vid)
      }

      const search = await yts(text)
      const videos = (search?.videos || []).filter((v) => v?.url)
      if (!videos.length) return m.reply('❌ *Nessun risultato trovato per la ricerca.*')

      try {
        return await sendCarousel(conn, m, usedPrefix, text, videos)
      } catch (err) {
        console.error('Carousel Error:', err.message)
        return await sendSingleMenu(conn, m, usedPrefix, videos[0])
      }
    }

    const url = directUrl || text.trim()

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    const isAudio = command === 'playaud'
    const tmpDir = os.tmpdir()
    const fileName = `file_${Date.now()}`
    outputPath = path.join(tmpDir, `${fileName}.${isAudio ? 'mp3' : 'mp4'}`)

    const cmd = isAudio
      ? `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${url}"`
      : `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${outputPath}" "${url}"`

    await run(cmd)

    if (!fs.existsSync(outputPath)) throw new Error('Download fallito.')

    if (isAudio) {
      voicePath = path.join(tmpDir, `${fileName}.ogg`)

      await run(
        `ffmpeg -hide_banner -loglevel error -y -i "${outputPath}" -map_metadata -1 -vn -ar 48000 -ac 1 -c:a libopus -b:a 64k -application voip -f ogg "${voicePath}"`
      )

      await conn.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(voicePath),
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true
        },
        { quoted: m }
      )
    } else {
      await conn.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(outputPath),
          mimetype: 'video/mp4',
          caption: `✨ *Completato da 𝟴𝟴𝟴 𝗕𝗢𝗧*`
        },
        { quoted: m }
      )
    }

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
  } catch (e) {
    console.error('Handler Error:', e.message)
    const message = /not found|is not recognized/i.test(e.message)
      ? '⚠️ *Errore:* Installa yt-dlp e ffmpeg, poi riprova.'
      : '⚠️ *Errore:* Impossibile completare il download.'
    m.reply(message)
  } finally {
    for (const file of [outputPath, voicePath]) {
      if (file && fs.existsSync(file)) fs.unlinkSync(file)
    }
  }
}

handler.help = ['play']
handler.tags = ['downloader']
handler.command = /^(play|playaud|playvid)$/i

export default handler
