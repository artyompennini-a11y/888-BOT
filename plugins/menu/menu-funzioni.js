// Plugin by elixir, punisher & 888 staff
import fs from 'fs'

let handler = async (m, { conn, usedPrefix, isOwner, isROwner }) => {
  const userName = m.pushName || 'Utente'
  const userNumber = m.sender.split('@')[0]

  const chat = global.db.data.chats[m.chat] || {}
  const bot = global.db.data.settings[conn.user.jid] || {}

  const {
    rileva, jadibotmd, welcome, goodbye, modoadmin, antiporno,
    antivoip, antitrava, antiArab, antiLink, antilinkig, antilinktg,
    antimedia, antispam, antitoxic, antiBot, antioneview,
    antigore, reazioni, bestemmiometro, ai, vocali, logrichieste,
    slowmode, antinuke, antiraid, antiraidlink, antiflood, antighost
  } = chat

  const { antiprivato, soloCreatore, read, anticall } = bot

  let imgBuffer
  try {
    imgBuffer = fs.readFileSync('icone/888.jpg')
  } catch {
    imgBuffer = Buffer.alloc(0)
  }

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: 'MENU_FUNZIONI'
    },
    message: {
      locationMessage: {
        name: '⚙️ MENU FUNZIONI 888',
        jpegThumbnail: imgBuffer
      }
    },
    participant: '0@s.whatsapp.net'
  }

  const s = (val) => val ? '🟩' : '🟥'
  const p = usedPrefix

  const menuText = `
⚙️ *MENU FUNZIONI 888*
Stato pannello: Moduli di Sicurezza

🔧 *Funzioni Gruppo*
• [${s(welcome)}] ${p}benvenuto
• [${s(goodbye)}] ${p}addio
• [${s(modoadmin)}] ${p}modoadmin
• [${s(slowmode)}] ${p}slowmode
• [${s(reazioni)}] ${p}reazioni
• [${s(bestemmiometro)}] ${p}bestemmiometro
• [${s(logrichieste)}] ${p}logrichieste

🚫 *Moduli di Protezione (ANTI)*
• [${s(antinuke)}] ${p}antinuke
• [${s(antiraid)}] ${p}antiraid
• [${s(antiraidlink)}] ${p}antiraidlink
• [${s(antiflood)}] ${p}antiflood
• [${s(antighost)}] ${p}antighost
• [${s(antiporno)}] ${p}antiporno
• [${s(antigore)}] ${p}antigore
• [${s(antispam)}] ${p}antispam
• [${s(antitrava)}] ${p}antitrava
• [${s(antiBot)}] ${p}antibot
• [${s(antivoip)}] ${p}antivoip
• [${s(antimedia)}] ${p}antimedia
• [${s(antiLink)}] ${p}antilink
• [${s(antilinkig)}] ${p}antilinkig

ℹ️ *Guida Rapida*
• Attivare: ${p}attiva [modulo]
• Disattivare: ${p}disattiva [modulo]
`.trim()

  conn.sendMessage(m.chat, { text: menuText }, { quoted: fake })
}

handler.help = ['funzioni']
handler.tags = ['menu']
handler.command = /^(funzioni)$/i;

export default handler
