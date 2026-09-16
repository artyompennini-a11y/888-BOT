//Plugin by Elixir, Punisher & 888 staff
import fs from 'fs'

let handler = async (m, { conn, usedPrefix, isOwner, isROwner }) => {
  const userName = m.pushName || 'Utente'
  const userNumber = m.sender.split('@')[0]

  const chat = global.db.data.chats[m.chat] || {}
  const bot = global.db.data.settings[conn.user.jid] || {}

  const {
    rileva, jadibotmd, welcome, goodbye, modoadmin, antiporno,
    antivoip, antitrava, antiArab, antiLink, antilinkig, antilinktiktok,
    antilinktg, antimedia, antispam, antitoxic, antiBot, antioneview,
    antigore, reaction, bestemmiometro, ai, vocali, logrichieste,
    slowmode, antinuke
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

  const catalogs = `
📦 *Cataloghi Rapidi*
• ${p}attiva security  
  _(antilink + antiporno + modoadmin)_
• ${p}attiva protezione  
  _(antispam + antitoxic + antibot + antivoip)_
• ${p}attiva media  
  _(antimedia + antiporno + antigore)_
• ${p}attiva antilink  
  _(antilink + tg + ig + tiktok)_
• ${p}attiva full  
  _(attiva tutti i moduli sopra)_`

  const ownerSection = (isOwner || isROwner) ? `
👑 *Funzioni Owner*
• [${s(antiprivato)}] ${p}antiprivato
• [${s(soloCreatore)}] ${p}solocreatore
• [${s(read)}] ${p}lettura
• [${s(anticall)}] ${p}anticall

👤 Operatore: ${userName}
📱 ID: +${userNumber}
` : ''

  const menuFunzioniText = `
⚙️ *MENU FUNZIONI 888*
Stato pannello: Moduli di Sicurezza

🔧 *Funzioni Gruppo*
• [${s(welcome)}] ${p}benvenuto
• [${s(goodbye)}] ${p}addio
• [${s(modoadmin)}] ${p}modoadmin
• [${s(slowmode)}] ${p}slowmode
• [${s(bestemmiometro)}] ${p}bestemmiometro
• [${s(logrichieste)}] ${p}logrichieste

🤖 *AI Avanzate*
• ${p}groq
• ${p}mistral

🚫 *Moduli di Protezione (ANTI)*
• [${s(antinuke)}] ${p}antinuke
• [${s(antiporno)}] ${p}antiporno
• [${s(antigore)}] ${p}antigore
• [${s(antispam)}] ${p}antispam
• [${s(antitrava)}] ${p}antitrava
• [${s(antiBot)}] ${p}antibot
• [${s(antivoip)}] ${p}antivoip
• [${s(antimedia)}] ${p}antimedia
• [${s(antiLink)}] ${p}antilink
• [${s(antilinkig)}] ${p}antilinkig
• [${s(antilinktiktok)}] ${p}antilinktiktok
• [${s(antilinktg)}] ${p}antilinktg

${catalogs}
${ownerSection}

🟩 = Attivato  
🟥 = Disattivato

ℹ️ *Guida Rapida*
• Attivare: ${p}attiva [modulo]  
• Disattivare: ${p}disattiva [modulo]
`.trim()

  await conn.sendMessage(m.chat, { text: menuFunzioniText }, { quoted: fake })
}

handler.help = ['funzioni']
handler.tags = ['menu']
handler.command = /^(funzioni)$/i

export default handler