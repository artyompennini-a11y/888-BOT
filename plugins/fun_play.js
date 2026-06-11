// Plugin by Elixir, Punisher, 888 & 333 staff
import yts from 'yt-search'
import fg from 'api-dylux'
import fetch from 'node-fetch'
import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const { promises: fsPromises } = fs
global.playChoice = global.playChoice || {}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (command === "play") {
    if (!text) return m.reply(`⚡ *𝗧𝗛𝗘 888-𝗕𝗢𝗧*\n\n💡 _Scrivi:_ ${usedPrefix + command} nome canzone`)

    const search = await yts(text)
    const vid = search.videos[0]
    if (!vid) return m.reply('⚠️ *𝗥𝗶𝘀𝘂𝗹𝘁𝗮𝘁𝗼 𝗻𝗼𝗻 𝘁𝗿𝗼𝘃𝗮𝘁𝗼.*')

    global.playChoice[m.sender] = vid

    let infoMsg = `┏━━━━━━━━━━━━━━━━━━━┓\n` +
                  `   🎧  *𝗧𝗛𝗘 888-𝗕𝗢𝗧* 🎧\n` +
                  `┗━━━━━━━━━━━━━━━━━━━┛\n\n` +
                  `◈ 📌 *𝗧𝗶𝘁𝗼𝗹𝗼:* ${vid.title}\n` +
                  `◈ ⏱️ *𝗗𝘂𝗿𝗮𝘁𝗮:* ${vid.timestamp}\n\n` +
                  `*𝗦𝗲𝗹𝗲𝘇𝗶𝗼𝗻𝗮 𝗶𝗹 𝗳𝗼𝗿𝗺𝗮𝘁𝗼:*`

    return await conn.sendMessage(m.chat, {
      image: { url: vid.thumbnail },
      caption: infoMsg,
      footer: '\n 𝗧𝗛𝗘 888-𝗕𝗢𝗧',
      buttons: [
        { buttonId: `${usedPrefix}playaud`, buttonText: { displayText: '🎵 𝗔𝗨𝗗𝗜𝗢 (ᴍᴘ3)' }, type: 1 },
        { buttonId: `${usedPrefix}playvid`, buttonText: { displayText: '🎬 𝗩𝗜𝗗𝗘𝗢 (ᴍᴘ4)' }, type: 1 }
      ],
      headerType: 4
    }, { quoted: m })
  }

  const vid = global.playChoice[m.sender]
  if (!vid) return m.reply("❌ Nessuna richiesta attiva. Cerca prima una canzone con .play")

  if (command === "playaud") {
    await conn.sendMessage(m.chat, { react: { text: "🎵", key: m.key } })

    let downloadUrl = null
    const url = vid.url

    try {
      let res = await fg.yta(url)
      if (res && res.dl_url) downloadUrl = res.dl_url
    } catch (e) { console.log("Dylux API failed") }

    if (!downloadUrl) {
      try {
        let res = await fetch(`https://vreden.my.id{encodeURIComponent(url)}`)
        let json = await res.json()
        downloadUrl = json.result?.download?.url || json.result?.url || json.result?.downloadUrl
      } catch (e) { console.log("Vreden API failed:", e.message) }
    }

    if (!downloadUrl) {
      return m.reply('🚀 *𝙋𝙡𝙖𝙮 𝙀𝙧𝙧𝙤rer:* Al momento i server di download sono sovraccarichi o offline. Riprova tra poco.')
    }

    const tmpDir = os.tmpdir()
    const fileName = `file_${Date.now()}`
    const inputPath = path.join(tmpDir, `${fileName}.mp3`)
    const voicePath = path.join(tmpDir, `${fileName}.ogg`)

    try {
      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const arrayBuffer = await response.arrayBuffer()
      await fsPromises.writeFile(inputPath, Buffer.from(arrayBuffer))

      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -hide_banner -loglevel error -y -i "${inputPath}" -map_metadata -1 -vn -ar 48000 -ac 1 -c:a libopus -b:a 64k -application voip -f ogg "${voicePath}"`,
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      await conn.sendMessage(m.chat, {
        audio: await fsPromises.readFile(voicePath),
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true
      }, { quoted: m })

      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
    } catch (e) {
      console.error(e)
      m.reply("❌ Errore durante l'invio dell'audio")
    } finally {
      if (fs.existsSync(inputPath)) await fsPromises.unlink(inputPath)
      if (fs.existsSync(voicePath)) await fsPromises.unlink(voicePath)
      delete global.playChoice[m.sender]
    }
  }

  if (command === "playvid") {
    await conn.sendMessage(m.chat, { react: { text: "🎬", key: m.key } })

    let downloadUrl = null
    const url = vid.url

    try {
      let res = await fg.ytv(url)
      if (res && res.dl_url) downloadUrl = res.dl_url
    } catch (e) { console.log("Dylux API failed") }

    if (!downloadUrl) {
      try {
        let res = await fetch(`https://vreden.my.id{encodeURIComponent(url)}`)
        let json = await res.json()
        downloadUrl = json.result?.download?.url || json.result?.url || json.result?.downloadUrl
      } catch (e) { console.log("Vreden API failed:", e.message) }
    }

    if (!downloadUrl) {
      return m.reply('🚀 *𝙋𝙡𝙖𝙮 𝙀𝙧𝙧𝙤rer:* Al momento i server di download sono sovraccarichi o offline. Riprova tra poco.')
    }

    const tmpDir = os.tmpdir()
    const fileName = `file_${Date.now()}`
    const inputPath = path.join(tmpDir, `${fileName}.mp4`)

    try {
      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer()
      await fsPromises.writeFile(inputPath, Buffer.from(arrayBuffer))

      await conn.sendMessage(m.chat, {
        video: await fsPromises.readFile(inputPath),
        mimetype: 'video/mp4',
        caption: `✅ *canzoni salvate da 𝗧𝗛𝗘 888-𝗕𝗢𝗧*`
      }, { quoted: m })

      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
    } catch (e) {
      console.error(e)
      m.reply("❌ Errore durante l'invio del video")
    } finally {
      if (fs.existsSync(inputPath)) await fsPromises.unlink(inputPath)
      delete global.playChoice[m.sender]
    }
  }
}

handler.help = ['play']
handler.tags = ['downloader']
handler.command = /^(play|playaud|playvid)$/i

export default handler
