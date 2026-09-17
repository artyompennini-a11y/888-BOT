import fetch from 'node-fetch'
import fs from 'fs'

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

  const menuText = `
⚡ *${botName}*
Versione: ${botVersion}

📂 Seleziona una categoria dal menu.
`.trim()

  const listMessage = {
    text: menuText,
    footer: "",
    title: "Menu 888",
    buttonText: "Apri il Menu",
    sections: [
      {
        title: "📁 Menu Completo",
        rows: [
          { title: "⚙️ Funzioni", rowId: `${usedPrefix}funzioni` },
          { title: "👑 Admin", rowId: `${usedPrefix}admin` },
          { title: "🎮 Giochi", rowId: `${usedPrefix}giochi` },
          { title: "🎰 RPG", rowId: `${usedPrefix}rpg` },
          { title: "🎵 Audio", rowId: `${usedPrefix}menuaudio` },
          { title: "🔐 Owner", rowId: `${usedPrefix}owner` }
        ]
      }
    ]
  }

  await conn.sendMessage(m.chat, { image: imageBuffer, caption: menuText })
  await conn.sendMessage(m.chat, listMessage)
}

handler.help = ["menu"]
handler.tags = ['menu']
handler.command = /^(menu|comandi)$/i

export default handler