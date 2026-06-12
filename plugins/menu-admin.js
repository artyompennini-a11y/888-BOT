import os from 'os'
import util from 'util'
import fs from 'fs'
import { performance } from 'perf_hooks'

let handler = async (m, { conn, usedPrefix: prefix }) => {
  const { welcome, detect } = global.db.data.chats[m.chat] || {}
  
 
  let target = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
  
  
  const profilePicUrl = await conn.profilePictureUrl(target, "image").catch(() => null) || "./src/avatar_contact.png"

  let profileBuffer
  if (profilePicUrl !== "./src/avatar_contact.png") {
    let res = await fetch(profilePicUrl)
    profileBuffer = await res.buffer()
  } else {
    let res = await fetch("https://qu.ax/DQsgr.png")
    profileBuffer = await res.buffer()
  }

 
  let thumbRes = await fetch("https://qu.ax/JKCXP.jpg")
  let thumbBuffer = await thumbRes.buffer()

  let fakeLocation = {
    'key': {
      'participants': "0@s.whatsapp.net",
      'fromMe': false,
      'id': "Halo"
    },
    'message': {
      'locationMessage': {
        'name': "👑 MENU ADMIN 888",
        'jpegThumbnail': thumbBuffer
      }
    },
    'participant': "0@s.whatsapp.net"
  }

 
  let menuText = 
`╭━━━〔 👑 *MENU ADMIN* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Livello:* Privilegi Amministratore
┃━━━━━━━━━━━━━━━━━━
┃ 👥 *Gestione Utenti:*
┃  ⮕ ${prefix}promuovi / p
┃  ⮕ ${prefix}retrocedi / r
┃  ⮕ ${prefix}kick / puffo / sparisci
┃  ⮕ ${prefix}inattivi
┃  ⮕ ${prefix}invita
┃  ⮕ ${prefix}richieste
┃ 
┃ ⚙️ *Impostazioni Gruppo:*
┃  ⮕ ${prefix}aperto / apri
┃  ⮕ ${prefix}chiuso / chiudi
┃  ⮕ ${prefix}closetime (minuti)
┃  ⮕ ${prefix}setwelcome
┃  ⮕ ${prefix}setbye
┃  ⮕ ${prefix}reimposta
┃  ⮕ ${prefix}nome
┃  ⮕ ${prefix}bio
┃ 
┃ 🛡️ *Controllo & Moderazione:*
┃  ⮕ ${prefix}warn / unwarn
┃  ⮕ ${prefix}unwarnlink
┃  ⮕ ${prefix}muta (@)
┃  ⮕ ${prefix}smuta (@)
┃  ⮕ ${prefix}freezegp
┃  ⮕ ${prefix}addparole
┃  ⮕ ${prefix}listaparole
┃  ⮕ ${prefix}delparole
┃ 
┃ 📢 *Menzioni & Tag:*
┃  ⮕ ${prefix}hidetag / tag
┃  ⮕ ${prefix}tagall
┃  ⮕ ${prefix}admins
┃ 
┃ 🔧 *Strumenti & Utility:*
┃  ⮕ ${prefix}pin
┃  ⮕ ${prefix}unpin
┃  ⮕ ${prefix}clear
┃  ⮕ ${prefix}del
┃  ⮕ ${prefix}s
┃  ⮕ ${prefix}wm
┃  ⮕ ${prefix}pfp @tag
┃ 
┃ 📊 *Info & Sistema:*
┃  ⮕ ${prefix}infogruppo
┃  ⮕ ${prefix}staff
┃  ⮕ ${prefix}ping
┃  ⮕ ${prefix}link / linkqr
┃  ⮕ ${prefix}rules
┃  ⮕ ${prefix}statsgiornaliere
┃  ⮕ ${prefix}riassunto
┃  ⮕ ${prefix}logadmin
┃  ⮕ ${prefix}ticket
┃ 
┃ 🃏 *Fun & Mod:*
┃  ⮕ ${prefix}addmod @user
┃  ⮕ ${prefix}delmod @user
┃  ⮕ ${prefix}mods
┃  ⮕ ${prefix}arresta
┃  ⮕ ${prefix}giuria
┃  ⮕ ${prefix}simula
┃  ⮕ ${prefix}fakenuke
┃  ⮕ ${prefix}ds
╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici, 
> utilizza il comando *${prefix}ticket* per 
> segnalarlo subito allo staff.`.trim()

  conn.sendMessage(m.chat, { text: menuText }, { quoted: fakeLocation })
}

handler.help = ["menu"]
handler.tags = ["menu"]
handler.command = /^(admin)$/i

export default handler
