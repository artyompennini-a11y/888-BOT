// Plugin by Elixir
import yts from 'yt-search'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

const ONLY_ELIXIR = '393297014539'

const isOwner = (m) => {
  const sender = String(m.sender || '').split('@')[0].replace(/[^0-9]/g, '')
  return sender === ONLY_ELIXIR
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let outputPath
  let voicePath

  if (!isOwner(m)) {
    return m.reply('❌ *Questo comando è riservato al proprietario.*')
  }

  if (!text) {
    return m.reply(
      `💡 *Uso corretto:* 
${usedPrefix + command} <nome album>`
    )
  }

  try {
    const directUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(text.trim())
      ? text.trim()
      : null

    const search = directUrl ? null : await yts(text)
    const vid = directUrl
      ? { url: directUrl, title: directUrl, timestamp: '', author: { name: '' }, views: 0 }
      : search?.videos?.[0]

    if (!vid) return m.reply('❌ *Nessun risultato trovato.*')

    const first = vid
    const isPlaylist = /list=.+/i.test(first.url) || /playlist/i.test(first.title)

    let tracks = []

    if (isPlaylist) {
      const flatResult = await new Promise((resolve, reject) => {
        exec(`yt-dlp --flat-playlist --print "%(url)s\n" "${first.url}"`, (err, stdout) => {
          if (err) reject(err)
          else resolve(stdout.trim().split('\n').filter(Boolean))
        })
      })
      tracks = flatResult.map(url => ({
        url,
        title: 'Traccia playlist',
        timestamp: '',
        author: { name: '' },
        views: 0
      }))
    } else {
      tracks = [vid]
    }

    const total = tracks.length
    let sent = 0
    const tmpDir = os.tmpdir()

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      const idx = i + 1
      await m.reply(`Traccia ${idx}/${total}: ${track.title}`)

      const fileName = `album_${Date.now()}_${idx}`
      outputPath = path.join(tmpDir, `${fileName}.mp3`)

      await new Promise((resolve, reject) => {
        exec(
          `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${track.url}"`,
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      if (!fs.existsSync(outputPath)) {
        await m.reply(`Traccia ${idx}/${total} fallita: ${track.title}`)
        continue
      }

      voicePath = path.join(tmpDir, `${fileName}.ogg`)

      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -hide_banner -loglevel error -y -i "${outputPath}" -map_metadata -1 -vn -ar 48000 -ac 1 -c:a libopus -b:a 64k -application voip -f ogg "${voicePath}"`,
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      await conn.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(voicePath),
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true
        },
        { quoted: m }
      )

      if (fs.existsSync(voicePath)) fs.unlinkSync(voicePath)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
      sent++
    }

    await m.reply(`Album completato: ${sent}/${total} tracce.`)

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

handler.help = ['playalbum <album>']
handler.tags = ['downloader']
handler.command = /^playalbum$/i

export default handler
