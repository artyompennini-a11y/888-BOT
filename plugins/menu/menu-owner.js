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
    thumbBuffer = await (await fetch("https://i.postimg.cc/3JwB9YkX/menu-owner.jpg")).buffer()
  } catch {
    thumbBuffer = await (await fetch("https://i.postimg.cc/3JwB9YkX/menu-owner.jpg")).buffer()
  }

  const fakeLocation = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "MENU_OWNER"
    },
    message: {
      locationMessage: {
        name: "🔐 MENU OWNER 888",
        jpegThumbnail: thumbBuffer
      }
    },
    participant: "0@s.whatsapp.net"
  }

  const menuText = `
🔐 *MENU OWNER 888*
Livello: Sviluppatore / Creatore Core

⚙️ *Gestione Bot & Credenziali*
• ${prefix}impostanome  
• ${prefix}resettanome  
• ${prefix}addowner  
• ${prefix}delowner  
• ${prefix}addperms  
• ${prefix}setppbot  
• ${prefix}prefisso  
• ${prefix}resettaprefisso  

🛡️ *Sicurezza & Protezione*
• ${prefix}antinuke  
• ${prefix}banchat  
• ${prefix}banuser (@)  
• ${prefix}unbanuser (@)  
• ${prefix}block (@)  
• ${prefix}unblock (@)  
• ${prefix}banlist  
• ${prefix}listamuti  
• ${prefix}delprem  

💻 *Gestione Sviluppo & Plugin*
• ${prefix}getfile  
• ${prefix}saveplugin  
• ${prefix}getplugin  
• ${prefix}editplugin  
• ${prefix}listpl  
• ${prefix}disablepl  
• ${prefix}enablepl  
• ${prefix}dp (plugin)  
• ${prefix}codifica  
• ${prefix}offusca  

🚪 *Controllo Gruppi & Spostamenti*
• ${prefix}hidetagall  
• ${prefix}ispeziona <link>  
• ${prefix}join <link>  
• ${prefix}gruppi  
• ${prefix}adminall  
• ${prefix}out  
• ${prefix}outall  

🔧 *Modifiche Database & Logica*
• ${prefix}azzera (@)  
• ${prefix}aggiungi (messaggi)  
• ${prefix}rimuovi (messaggi)  
• ${prefix}addrank (livelli) (@user)  
• ${prefix}delrank (livelli) (@user)  
• ${prefix}lock  

📊 *Diagnostica & Server*
• ${prefix}diagnosi  
• ${prefix}sistema  
• ${prefix}dio  

━━━━━━━━━━━━━━━━━━━━━━
⚠️ In caso di bug usa: *${prefix}segnala*
`.trim()

  conn.sendMessage(m.chat, { text: menuText }, { quoted: fakeLocation })
}

handler.help = ["owner"]
handler.tags = ["menu"]
handler.command = /^(owner)$/i
handler.rowner = true

export default handler