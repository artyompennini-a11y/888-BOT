//Plugin Admin — Grafica Premium 888
import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix: prefix }) => {
  const chat = global.db.data.chats[m.chat] || {}

  let target = m.quoted?.sender
    || m.mentionedJid?.[0]
    || (m.fromMe ? conn.user.jid : m.sender)

  let profileBuffer
  try {
    const url = await conn.profilePictureUrl(target, "image")
    profileBuffer = await (await fetch(url)).buffer()
  } catch {
    profileBuffer = Buffer.from([])
  }

  let thumbBuffer = Buffer.from([])

  const fakeLocation = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "MENU_ADMIN"
    },
    message: {
      locationMessage: {
        name: "👑 MENU ADMIN 888",
        jpegThumbnail: thumbBuffer
      }
    },
    participant: "0@s.whatsapp.net"
  }

  const menuText = `
👑 *MENU ADMIN 888*
Privilegi Amministratore

👥 *Gestione Utenti*
• ${prefix}promuovi / p  
• ${prefix}retrocedi / r  
• ${prefix}kick / puffo / sparisci  
• ${prefix}inattivi  
• ${prefix}invita  
• ${prefix}richieste  

⚙️ *Impostazioni Gruppo*
• ${prefix}aperto / apri  
• ${prefix}chiuso / chiudi  
• ${prefix}closetime (minuti)  
• ${prefix}setwelcome  
• ${prefix}setbye  
• ${prefix}reimposta  
• ${prefix}nome  
• ${prefix}bio  

🛡️ *Controllo & Moderazione*
• ${prefix}warn / unwarn  
• ${prefix}unwarnlink  
• ${prefix}muta (@)  
• ${prefix}smuta (@)  
• ${prefix}freezegp  
• ${prefix}addparole  
• ${prefix}listaparole  
• ${prefix}delparole  

📢 *Menzioni & Tag*
• ${prefix}hidetag / tag  
• ${prefix}tagall  
• ${prefix}admins  

🔧 *Strumenti & Utility*
• ${prefix}pin  
• ${prefix}unpin  
• ${prefix}clear  
• ${prefix}del  
• ${prefix}s  
• ${prefix}wm  
• ${prefix}pfp @tag  

📊 *Info & Sistema*
• ${prefix}infogruppo  
• ${prefix}staff  
• ${prefix}ping  
• ${prefix}link / linkqr  
• ${prefix}rules  
• ${prefix}statsgiornaliere  
• ${prefix}riassunto  
• ${prefix}logadmin  
• ${prefix}segnala  

🃏 *Fun & Mod*
• ${prefix}addmod @user  
• ${prefix}delmod @user  
• ${prefix}mods  
• ${prefix}arresta  
• ${prefix}giuria  
• ${prefix}simula  
• ${prefix}nuke  
• ${prefix}rs  

━━━━━━━━━━━━━━━━━━━━━━
⚠️ In caso di bug usa: *${prefix}segnala*
`.trim()

  conn.sendMessage(m.chat, { text: menuText }, { quoted: fakeLocation })
}

handler.help = ["admin"]
handler.tags = ["menu"]
handler.command = /^(admin)$/i

export default handler