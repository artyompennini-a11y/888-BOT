//Plugin by 888 staff
import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix: prefix }) => {
  const chat = global.db.data.chats[m.chat] || {}

  let target = m.quoted?.sender
    || m.mentionedJid?.[0]
    || (m.fromMe ? conn.user.jid : m.sender)

  const profilePicUrl =
    (await conn.profilePictureUrl(target, "image").catch(() => null)) ||
    "https://i.postimg.cc/3JwB9YkX/default-avatar.png"

  let profileBuffer
  try {
    profileBuffer = await (await fetch(profilePicUrl)).buffer()
  } catch {
    profileBuffer = await (await fetch("https://i.postimg.cc/3JwB9YkX/default-avatar.png")).buffer()
  }

  let thumbBuffer
  try {
    thumbBuffer = await (await fetch("https://i.postimg.cc/3JwB9YkX/menu-giochi.jpg")).buffer()
  } catch {
    thumbBuffer = await (await fetch("https://i.postimg.cc/3JwB9YkX/menu-giochi.jpg")).buffer()
  }

  const fakeLocation = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "MENU_GIOCHI"
    },
    message: {
      locationMessage: {
        name: "🎮 MENU GIOCHI 888",
        jpegThumbnail: thumbBuffer
      }
    },
    participant: "0@s.whatsapp.net"
  }

  const menuText = `
🎮 *MENU GIOCHI 888*
Intrattenimento & Funzioni Community

♟️ *Giochi da Tavolo*
• ${prefix}scacchi
• ${prefix}startblast
• ${prefix}trivia
• ${prefix}indovina
• ${prefix}indovinamedio
• ${prefix}indovinadifficile
• ${prefix}toptrivia

🧩 *Funny*
• ${prefix}impiccato
• ${prefix}tris
• ${prefix}uno
• ${prefix}bandiera
• ${prefix}mascotte
• ${prefix}labirinto
• ${prefix}bomba
• ${prefix}scf
• ${prefix}scramble
• ${prefix}basket
• ${prefix}rigore
• ${prefix}screenshot
• ${prefix}screenshotgp
 • ${prefix}snake
• ${prefix}canta

🔞 *Hard Interattivi*
• ${prefix}lesbica
• ${prefix}frocio
• ${prefix}gay
• ${prefix}puttana
• ${prefix}porca
• ${prefix}porco
• ${prefix}alcolizzato
• ${prefix}negro
• ${prefix}sbiro
• ${prefix}figa
• ${prefix}pene
• ${prefix}ditalino
• ${prefix}sega
• ${prefix}lecca
• ${prefix}lecco
• ${prefix}tette
• ${prefix}bottiglia
• ${prefix}obbligo
• ${prefix}verità
• ${prefix}mordi
• ${prefix}insulta

❤️ *Love*
• ${prefix}adotta
• ${prefix}famiglia
• ${prefix}sposa
• ${prefix}bacia
• ${prefix}abbraccia
• ${prefix}crush
• ${prefix}trovafid
• ${prefix}odio
• ${prefix}clan

🔧 *Strumenti & Utility*
• ${prefix}removebg
• ${prefix}calendario
• ${prefix}screen
• ${prefix}emojimix
• ${prefix}setig
• ${prefix}rimuoviig
• ${prefix}statsgiornaliere
• ${prefix}topbestemmie
• ${prefix}topricchi
• ${prefix}traduci
• ${prefix}nota
• ${prefix}scarica
• ${prefix}ricetta
• ${prefix}quiz
• ${prefix}quizpatente
• ${prefix}calcioquiz
• ${prefix}meteo
• ${prefix}notizie
• ${prefix}oroscopo
• ${prefix}urly
• ${prefix}spotify
• ${prefix}twitter
• ${prefix}reddit
• ${prefix}pinterest

🎲 *Random*
• ${prefix}identita
• ${prefix}telefono
• ${prefix}dox
• ${prefix}zizzania
• ${prefix}barzelletta
• ${prefix}saluta
• ${prefix}segreto

━━━━━━━━━━━━━━━━━━━━━━
⚠️ In caso di bug usa: *${prefix}segnala*
`.trim()

  conn.sendMessage(m.chat, { text: menuText }, { quoted: fakeLocation })
}

handler.help = ["giochi"]
handler.tags = ["menu"]
handler.command = /^(giochi)$/i

export default handler