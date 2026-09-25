import fetch from 'node-fetch'
import fs from 'fs'


let handler = async (m, { conn, usedPrefix }) => {
  const targetJid = m.mentionedJid?.[0] || m.quoted?.sender || m.sender
  const p = usedPrefix || '.'

  const menuButton = (displayText, command) => ({
    buttonId: `${p}${command}`,
    buttonText: { displayText },
    type: 1
  })

  let imageBuffer = null
  try {
    imageBuffer = fs.readFileSync('./media/888.jpeg.jpeg')
  } catch {
    try {
      imageBuffer = await (await fetch('https://telegra.ph/file/22b3e3d2a7b9f346e21b3.png')).buffer()
    } catch {
      imageBuffer = null
    }
  }

  const botName = global.db.data.nomedelbot || "𝟴𝟴𝟴 BOT"
  const botVersion = global.db.data.version || "*1.3*"

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: 'MENU'
    },
    message: {
      contactMessage: {
        displayName: `Menu`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\\nFN:y\nitem1.TEL;waid=${targetJid.split('@')[0]}:${targetJid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: "0@s.whatsapp.net"
  }

  const menuText = `
⚡ *${botName}*
*VERSIONE*: ${botVersion}

🛡️ *Staff & Moderatori:* ${p}mods

📂 *Altre sezioni*
• ${p}giochi
• ${p}rpg
• ${p}menuaudio
• ${p}modstats
• ${p}owner
`.trim()

  const mainButtons = [
    menuButton('⚙️ 𝐅𝐮𝐧𝐳𝐢𝐨𝐧𝐢', 'funzioni'),
    menuButton('🛡️ 𝐌𝐨𝐝𝐞𝐫𝐚𝐭𝐨𝐫𝐢', 'mods'),
    menuButton('👑 𝐀𝐝𝐦𝐢𝐧', 'admin')
  ]
  const playButtons = [
    menuButton('🎮 𝐆𝐢𝐨𝐜𝐡𝐢', 'giochi'),
    menuButton('🎰 𝐑𝐏𝐆', 'rpg'),
    menuButton('🎵 𝐀𝐮𝐝𝐢𝐨', 'menuaudio')
  ]
  const staffButtons = [
    menuButton('📊 𝐒𝐭𝐚𝐟𝐟', 'modstats'),
    menuButton('🔐 𝐎𝐰𝐧𝐞𝐫', 'owner')
  ]

  const payload = {
    caption: menuText,
    footer: botName,
    buttons: mainButtons,
    headerType: 4
  }
  if (imageBuffer) payload.image = imageBuffer

  await conn.sendMessage(m.chat, payload, { quoted: fake })
  await conn.sendMessage(m.chat, {
    text: '🎮 *GIOCHI, RPG E AUDIO*\nScegli direttamente la sezione che ti interessa.',
    footer: botName,
    buttons: playButtons,
    headerType: 1
  })
  await conn.sendMessage(m.chat, {
    text: '🛡️ *STAFF E statistiche*\nAccesso ai pannelli riservati.',
    footer: botName,
    buttons: staffButtons,
    headerType: 1
  })
}

handler.help = ["menu"]
handler.tags = ['menu']
handler.command = /^(menu|comandi)$/i

export default handler
