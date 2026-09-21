// Plugin by Elixir & 888 staff
import fetch from 'node-fetch'
import fs from 'fs'
import path, { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const loadStaff = () => {
  try {
    return JSON.parse(fs.readFileSync(join(__dirname, '../../data/staff.json'), 'utf8'))
  } catch {
    return []
  }
}

const formattaMembro = (m) => {
  const emoji = m.emoji || '👤'
  const righe = [`${emoji} *${m.nome}*`, `_${m.ruolo}_`]

  if (m.bio) righe.push(`\n${m.bio}`)
  if (m.telefono) righe.push(`\n📱 wa.me/${m.telefono}`)
  if (m.instagram) righe.push(`📸 IG: ${String(m.instagram).replace(/^@/, '')}`)
  if (m.telegram) righe.push(`✈️ TG: ${String(m.telegram).replace(/^@/, '')}`)

  return righe.join('\n')
}

const inviaTelegram = async (conn, chat, staffData, quoted) => {
  const membri = staffData.filter(m => m.telegram)
  if (membri.length === 0) {
    return conn.sendMessage(chat, { text: '❌ Nessun contatto Telegram disponibile.' }, { quoted })
  }

  const testo = `✈️ *TELEGRAM STAFF*\n\n${
    membri.map(m => `👤 *${m.nome}* (${m.ruolo})\n✈️ https://t.me/${String(m.telegram).replace(/^@/, '')}`).join('\n\n')
  }`

  return conn.sendMessage(chat, { text: testo }, { quoted })
}

const inviaInstagram = async (conn, chat, staffData, quoted) => {
  const membri = staffData.filter(m => m.instagram)
  if (membri.length === 0) {
    return conn.sendMessage(chat, { text: '❌ Nessun contatto Instagram disponibile.' }, { quoted })
  }

  const testo = `📸 *INSTAGRAM STAFF*\n\n${
    membri.map(m => `👤 *${m.nome}* (${m.ruolo})\n📸 https://instagram.com/${String(m.instagram).replace(/^@/, '')}`).join('\n\n')
  }`

  return conn.sendMessage(chat, { text: testo }, { quoted })
}

const inviaStaff = async (conn, chat, staffData, quoted) => {
  if (!staffData || staffData.length === 0) {
    return conn.sendMessage(chat, { text: '❌ Nessun membro dello staff trovato.' }, { quoted })
  }

  const testo = `⚡ *TEAM 888*\n\n${
    staffData.map(formattaMembro).join('\n\n──────────────\n\n')
  }`

  const conTelefono = staffData.filter(m => m.telefono)
  if (conTelefono.length > 0) {
    await conn.sendContact(
      chat,
      conTelefono.map(m => [String(m.telefono).replace(/\D/g, ''), `${m.nome} • ${m.ruolo}`]),
      quoted
    )
  }

  return conn.sendMessage(chat, { text: testo }, { quoted })
}

let handler = async (m, { conn, usedPrefix, text }) => {
  const staffData = loadStaff()
  const lowerText = String(text || '').toLowerCase()

  if (lowerText.includes('tg') || lowerText.includes('telegram')) {
    return inviaTelegram(conn, m.chat, staffData, m)
  }

  if (lowerText.includes('ig') || lowerText.includes('instagram')) {
    return inviaInstagram(conn, m.chat, staffData, m)
  }

  if (lowerText.includes('lista') || lowerText.includes('team') || lowerText === 'staff') {
    return inviaStaff(conn, m.chat, staffData, m)
  }

  let imageBuffer
  try {
    imageBuffer = fs.readFileSync('./media/888.jpeg.jpeg')
  } catch {
    imageBuffer = await (await fetch('https://telegra.ph/file/22b3e3d2a7b9f346e21b3.png')).buffer()
  }

  const botName = global.db?.data?.nomedelbot || global.nomebot || "888 BOT"
  const botVersion = global.versione || global.db?.data?.version || "1.1"

  const menuText = `
⚡ *TEAM ${botName.toUpperCase()}*
*VERSIONE*: ${botVersion}

📂 Scegli una categoria dai bottoni sotto.
`.trim()

  const buttons = [
    { id: `${usedPrefix}staff tg`, title: "✈️ Telegram" },
    { id: `${usedPrefix}staff ig`, title: "📸 Instagram" },
    { id: `${usedPrefix}staff lista`, title: "👥 Tutto lo staff" }
  ]

  const interactiveButtons = buttons.map(b => ({
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: b.title,
      id: b.id
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
    { quoted: m }
  )

  m.react('📌')
}

handler.help = ['staff', 'team']
handler.tags = ['main']
handler.command = ['staff', 'team']

export default handler