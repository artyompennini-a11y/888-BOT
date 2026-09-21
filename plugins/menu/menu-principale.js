import fetch from 'node-fetch'
import fs from 'fs'

/**
 * Menu 888 — versione con pulsanti per tutte le piattaforme
 */

let handler = async (m, { conn, usedPrefix }) => {
  const targetJid = m.mentionedJid?.[0] || m.quoted?.sender || m.sender

  let imageBuffer
  try {
    imageBuffer = fs.readFileSync('./media/888.jpeg.jpeg')
  } catch {
    imageBuffer = await (await fetch('https://telegra.ph/file/22b3e3d2a7b9f346e21b3.png')).buffer()
  }

  const botName = global.db.data.nomedelbot || "𝟴𝟴𝟴 BOT"
  const botVersion = global.db.data.version || "*1.2*"

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: 'MENU'
    },
    message: {
      contactMessage: {
        displayName: `Menu`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${targetJid.split('@')[0]}:${targetJid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: "0@s.whatsapp.net"
  }

  const menuText = `
⚡ *${botName}*
*VERSIONE*: ${botVersion}

📂 *Apri il menu dal pulsante sotto.*
`.trim()

  const rows = [
    { id: `${usedPrefix}funzioni`, title: "⚙️ Funzioni" },
    { id: `${usedPrefix}admin`, title: "👑 Admin" },
    { id: `${usedPrefix}giochi`, title: "🎮 Giochi" },
    { id: `${usedPrefix}rpg`, title: "🎰 RPG" },
    { id: `${usedPrefix}menuaudio`, title: "🎵 Audio" },
    { id: `${usedPrefix}owner`, title: "🔐 Owner" }
  ]

  const interactiveButtons = rows.map(row => ({
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({
      display_text: row.title,
      id: row.id
    })
  }))

  await conn.sendMessage(
    m.chat,
    {
      image: imageBuffer,
      caption: menuText,
      footer: "",
      headerType: 4,
      interactiveButtons
    },
    { quoted: fake }
  )
}

handler.help = ["menu"]
handler.tags = ['menu']
handler.command = /^(menu|comandi)$/i

export default handler