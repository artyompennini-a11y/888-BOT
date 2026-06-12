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
    antigore, antibusiness, reaction, bestemmiometro, ai, vocali, logrichieste,
    slowmode
  } = chat

  const { antiprivato, soloCreatore, read, anticall } = bot

  // Gestione sicura del file immagine per evitare crash se non esiste
  let imgBuffer
  try {
    imgBuffer = fs.readFileSync('icone/888.jpg')
  } catch (e) {
    // Buffer vuoto di fallback se l'immagine non viene trovata
    imgBuffer = Buffer.alloc(0)
  }

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: '333Funzioni'
    },
    message: {
      locationMessage: {
        name: '⚙️ MENU FUNZIONI 888',
        jpegThumbnail: imgBuffer, // Baileys vuole il Buffer diretto, non toString('base64')
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;333;;;\nFN:333\nEND:VCARD'
      }
    },
    participant: '0@s.whatsapp.net'
  }

  const s = (val) => val ? '🟩' : '🟥'
  const p = usedPrefix

  const catalogs = `┃ 
┃ 📦 *CATALOGHI RAPIDI:*
┃  ⮕ ${p}attiva security
┃    _(antilink + antiporno + modoadmin)_
┃  ⮕ ${p}attiva protezione
┃    _(antispam + antitoxic + antibot + antivoip)_
┃  ⮕ ${p}attiva media
┃    _(antimedia + antiporno + antigore)_
┃  ⮕ ${p}attiva antilink
┃    _(antilink + tg + ig + tiktok)_
┃  ⮕ ${p}attiva full
┃    _(attiva tutti i moduli descritti sopra)_`

  const ownerSection = (isOwner || isROwner) ? `
┃ 
┃ 👑 *FUNZIONI OWNER:*
┃  [${s(antiprivato)}] ⮕ ${p}antiprivato
┃  [${s(soloCreatore)}] ⮕ ${p}solocreatore
┃  [${s(read)}] ⮕ ${p}lettura
┃  [${s(anticall)}] ⮕ ${p}anticall
┃━━━━━━━━━━━━━━━━━━
┃ 👤 *Operatore:* ${userName}
┃ 📱 *ID:* +${userNumber}` : ''

  const menuFunzioniText =
`╭━━━〔 ⚙️ *MENU FUNZIONI* 〕━━━┈
┃ 🤖 *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ 🛡️ *Stato Pannello:* Moduli di Sicurezza
┃━━━━━━━━━━━━━━━━━━
┃ 🔧 *FUNZIONI GRUPPO:*
┃  [${s(welcome)}] ⮕ ${p}benvenuto
┃  [${s(goodbye)}] ⮕ ${p}addio
┃  [${s(modoadmin)}] ⮕ ${p}modoadmin
┃  [${s(slowmode)}] ⮕ ${p}slowmode
┃  [${s(bestemmiometro)}] ⮕ ${p}bestemmiometro
┃  [${s(logrichieste)}] ⮕ ${p}logrichieste
┃ 
┃ 🚫 *MODULI DI PROTEZIONE (ANTI):*
┃  [${s(antiporno)}] ⮕ ${p}antiporno
┃  [${s(antigore)}] ⮕ ${p}antigore
┃  [${s(antispam)}] ⮕ ${p}antispam
┃  [${s(antitrava)}] ⮕ ${p}antitrava
┃  [${s(antiBot)}] ⮕ ${p}antibot
┃  [${s(antibusiness)}] ⮕ ${p}antibusiness
┃  [${s(antivoip)}] ⮕ ${p}antivoip
┃  [${s(antimedia)}] ⮕ ${p}antimedia
┃  [${s(antiLink)}] ⮕ ${p}antilink
┃  [${s(antilinkig)}] ⮕ ${p}antilinkig
┃  [${s(antilinktiktok)}] ⮕ ${p}antilinktiktok
┃  [${s(antilinktg)}] ⮕ ${p}antilinktg
${catalogs}${ownerSection}
┃━━━━━━━━━━━━━━━━━━
┃ 🟩 = Attivo  |  🟥 = Disattivo
┃━━━━━━━━━━━━━━━━━━
┃ ℹ️ *GUIDA RAPIDA USO:*
┃  • _Per attivare:_ ${p}attiva [modulo]
┃  • _Per disattivare:_ ${p}disabilita [modulo]
╰━━━━━━━━━━━━━━━━━━┈`.trim()

  await conn.sendMessage(m.chat, {
    text: menuFunzioniText
  }, { quoted: fake })
}

handler.help = ['funzioni']
handler.tags = ['menu']
handler.command = /^(funzioni)$/i

export default handler
