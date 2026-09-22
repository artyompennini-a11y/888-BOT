// Plugin by Elixir
import yts from 'yt-search'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Solo Elixir può usare questo comando
const ONLY_ELIXIR = '393297014539'

const isOwner = (m) => {
  const sender = String(m.sender || '').split('@')[0].replace(/[^0-9]/g, '')
  return sender === ONLY_ELIXIR
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!isOwner(m, { conn })) {
    return m.reply('❌ *Questo comando è riservato agli owner.*')
  }

  if (!text) {
    return m.reply(`💡 *Uso corretto:*
${usedPrefix + command} <nome album>

🔥 *Esempio:* ${usedPrefix + command} The Dark Side of the Moon

⚠️ *ATTENZIONE:* Tutti gli eroi moriranno.`);
  }

  try {

    await m.reply('💀 *TUTTI GLI EROI MUOIONO...* 💀\n\n🎸 L\'album sta per suonare, preparatevi.\n⏳ Attendere il download di tutte le tracce...')


    const albumQuery = text + ' album'
    const search = await yts(albumQuery)
    const results = search?.videos || []

    if (!results.length) {
      return m.reply('❌ *Nessun album trovato.*')
    }

  
    const tracks = results.slice(0, 12)


    let playlistVideos = []
    const first = results[0]
    if (/list=.+/i.test(first.url) || /playlist/i.test(first.title)) {

      const playlistUrl = first.url
      const flatResult = await new Promise((resolve, reject) => {
        exec(`yt-dlp --flat-playlist --print "%(url)s\\n" "${playlistUrl}"`, (err, stdout) => {
          if (err) reject(err)
          else resolve(stdout.trim().split('\\n').filter(Boolean))
        })
      })
      playlistVideos = flatResult.map(url => ({ url, title: 'Traccia playlist' }))
      if (playlistVideos.length) {
      
        tracks.length = 0
        tracks.push(...playlistVideos.map(v => ({
          url: v.url,
          title: v.title,
          thumbnail: '',
          timestamp: '',
          author: { name: '' },
          views: 0
        })))
      }
    }

    const total = tracks.length
    let sent = 0

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      const idx = i + 1
      await m.reply(`⏳ *Traccia ${idx}/${total}:* ${track.title}`)
      try {
        const tmpDir = os.tmpdir()
        const fileName = `album_${Date.now()}_${idx}`
        const outputPath = path.join(tmpDir, `${fileName}.mp3`)

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
          await m.reply(`❌ *Traccia ${idx}/${total} fallita:* ${track.title}`)
          continue
        }

        await conn.sendMessage(
          m.chat,
          {
            audio: fs.readFileSync(outputPath),
            mimetype: 'audio/mp3',
            ptt: false,
            caption: `🎵 *${idx}/${total}* — ${track.title}`
          },
          { quoted: m }
        )

        fs.unlinkSync(outputPath)
        sent++
  
        await new Promise(r => setTimeout(r, 1500))
      } catch (e) {
        console.error(`[playalbum] errore traccia ${idx}:`, e.message)
        await m.reply(`❌ *Errore alla traccia ${idx}/${total}:* ${track.title}`)
      }
    }

    await m.reply(`✅ *ALBUM COMPLETATO* ✅\n\n🎵 *Tracce inviate:* ${sent}/${total}\n💀 *Gli eroi sono morti.*`)

  } catch (e) {
    console.error('[playalbum] errore:', e.message)
    await m.reply('⚠️ *Errore:* Impossibile completare il download dell\'album.')
  }
}

handler.help = ['playalbum <album>']
handler.tags = ['downloader', 'owner']
handler.command = /^playalbum$/i

export default handler
