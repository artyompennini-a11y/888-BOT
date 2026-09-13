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
    thumbBuffer = await (await fetch("https://i.postimg.cc/3JwB9YkX/menu-audio.jpg")).buffer()
  } catch {
    thumbBuffer = await (await fetch("https://i.postimg.cc/3JwB9YkX/menu-audio.jpg")).buffer()
  }

  const fakeLocation = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "MENU_AUDIO"
    },
    message: {
      locationMessage: {
        name: "🎵 MENU AUDIO 888",
        jpegThumbnail: thumbBuffer
      }
    },
    participant: "0@s.whatsapp.net"
  }

  const menuText = `
🎵 *MENU AUDIO 888*
Modificatori vocali ed effetti

🔍 *Download & Ricerca*
• ${prefix}play  
• ${prefix}playlist  
• ${prefix}audio (testo)

⚡ *Velocità & Struttura*
• ${prefix}fast  
• ${prefix}slow  
• ${prefix}reverse  
• ${prefix}smooth  
• ${prefix}nightcore  

🎛️ *Tonalità & Filtri*
• ${prefix}bass  
• ${prefix}deep  
• ${prefix}fat  
• ${prefix}chipmunk  
• ${prefix}chip  
• ${prefix}robot  

🔊 *Ambiente & Spazio*
• ${prefix}cur  
• ${prefix}echo  
• ${prefix}vibrato  
• ${prefix}reverb  

💥 *Distorsione & Overdrive*
• ${prefix}blown  
• ${prefix}earrape  
• ${prefix}distort  

━━━━━━━━━━━━━━━━━━━━━━
💡 Rispondi a un messaggio vocale o audio  
con il comando dell’effetto da applicare.
`.trim()

  conn.sendMessage(m.chat, { text: menuText }, { quoted: fakeLocation })
}

handler.help = ["menuaudio"]
handler.tags = ["menu"]
handler.command = /^(menuaudio)$/i

export default handler