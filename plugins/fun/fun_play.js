// Plugin by Elixir, Punisher & 888 Staff
import yts from 'yt-search'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

const FOOTER = '𝟴𝟴𝟴 𝗕𝗢𝗧 • Downloader'
const MAX_CARDS = 5
const CACHE_TTL = 15 * 60 * 1000

const cache = new Map()

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

const searchVideos = async (query) => {
  const key = `search_${query.toLowerCase()}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.timestamp < CACHE_TTL) return hit.data
  const search = await yts(query)
  const videos = (search?.videos || []).filter((v) => v?.url).slice(0, MAX_CARDS)
  if (videos.length) cache.set(key, { data: videos, timestamp: Date.now() })
  return videos
}

const buildCardButtons = (usedPrefix, v) => [
  {
    name: 'single_select',
    buttonParamsJson: JSON.stringify({
      title: '🎵 Riproduci / Leggi',
      sections: [
        {
          title: cut(v.title, 24),
          rows: [
            {
              header: '🎧',
              title: '🎵 Scarica Audio',
              description: `👤 ${v.author?.name || '—'} | ⏱️ ${v.timestamp || '—'}`,
              id: `${usedPrefix}playaud ${v.url}`
            },
            {
              header: '📹',
              title: '📹 Scarica Video',
              description: `👤 ${v.author?.name || '—'} | ⏱️ ${v.timestamp || '—'}`,
              id: `${usedPrefix}playvid ${v.url}`
            }
          ]
        }
      ]
    })
  }
]

const loadBaileys = async () => {
  const names = [
    '@realvare/baileys',
    '@realvare/based',
    '@whiskeysockets/baileys',
    'baileys',
    '@adiwajshing/baileys'
  ]
  for (const name of names) {
    try {
      const mod = await import(name)
      const b = mod.default?.generateWAMessageFromContent ? mod.default : mod
      if (b.generateWAMessageFromContent && b.prepareWAMessageMedia && b.proto) return b
    } catch {}
  }
  return null
}

const sendCarousel = async (conn, m, usedPrefix, query, videos) => {
  const b = await loadBaileys()
  if (!b) throw new Error('Baileys non trovato')
  const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = b
  const IM = proto.Message.InteractiveMessage

  const cards = []
  for (let i = 0; i < videos.length; i++) {
    const v = videos[i]
    let header = IM.Header.fromObject({ title: '', hasMediaAttachment: false })
    try {
      const media = await prepareWAMessageMedia(
        { image: { url: v.thumbnail } },
        { upload: conn.waUploadToServer }
      )
      header = IM.Header.fromObject({
        title: '',
        hasMediaAttachment: true,
        imageMessage: media.imageMessage
      })
    } catch {}

    cards.push({
      header,
      body: IM.Body.fromObject({
        text: `*${i + 1}. ${cut(v.title, 60)}*\n\n『 👤 』 *${v.author?.name || '—'}*\n『 ⏱️ 』 *${v.timestamp || '—'}*  •  『 👁️ 』 *${fmtViews(v.views)}*`
      }),
      footer: IM.Footer.fromObject({ text: FOOTER }),
      nativeFlowMessage: IM.NativeFlowMessage.fromObject({
        buttons: buildCardButtons(usedPrefix, v)
      })
    })
  }

  const msg = generateWAMessageFromContent(
    m.chat,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: IM.fromObject({
            body: IM.Body.fromObject({
              text: `─── 𝟴𝟴𝟴 𝗣𝗟𝗔𝗬𝗘𝗥 ───\n\n『 🔍 』 *Risultati trovati per:*\n• ↳ \`${query}\``
            }),
            footer: IM.Footer.fromObject({ text: FOOTER }),
            header: IM.Header.fromObject({ hasMediaAttachment: false }),
            carouselMessage: IM.CarouselMessage.fromObject({ cards, messageVersion: 1 })
          })
        }
      }
    },
    { quoted: m, userJid: conn.user?.jid || conn.user?.id }
  )

  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

const sendList = async (conn, m, usedPrefix, query, videos) => {
  const rows = []
  videos.forEach((v) => {
    const desc = `👤 ${v.author?.name || '—'} | ⏱️ ${v.timestamp || '—'}`
    const title = cut(v.title, 30)
    rows.push({ title: `🎵 Audio: ${title}`, description: desc, rowId: `${usedPrefix}playaud ${v.url}` })
    rows.push({ title: `📹 Video: ${title}`, description: desc, rowId: `${usedPrefix}playvid ${v.url}` })
  })

  await conn.sendMessage(
    m.chat,
    {
      text: `─── 𝟴𝟴𝟴 𝗣𝗟𝗔𝗬𝗘𝗥 ───\n\n『 🔍 』 *Risultati trovati per:*\n• ↳ \`${query}\`\n\n👇 *Seleziona un'opzione dal menu*`,
      footer: FOOTER,
      title: 'Seleziona un Media',
      buttonText: '📋 Mostra Risultati',
      sections: [{ title: 'Risultati YouTube', rows }]
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

      const videos = await searchVideos(text)
      if (!videos.length) return m.reply('❌ *Nessun risultato trovato per la ricerca.*')

      try {
        return await sendCarousel(conn, m, usedPrefix, text, videos)
      } catch (e1) {
        console.error('Carousel error:', e1.message)
      }

      try {
        return await sendList(conn, m, usedPrefix, text, videos)
      } catch (e2) {
        console.error('List error:', e2.message)
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
