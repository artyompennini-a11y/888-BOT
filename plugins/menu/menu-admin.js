// Plugin by elixir, punisher & 888 staff

const handler = async (m, { conn, usedPrefix: prefix }) => {
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
• ${prefix}warn @user motivo (mod: max 4, 5 solo Admin) 
• ${prefix}unwarn @user [ID|all] (mod: 1 ogni 5 min) 
• ${prefix}warnlist (solo utenti con warn) 
• ${prefix}warninfo @user (dettagli + ID) 
• ${prefix}resetwarn @user (solo Admin) 
• ${prefix}muta @user [durata] (mod: max 5 min) 
• ${prefix}smuta @user 
• ${prefix}banuser @user [durata] (mod: max 15 min) 
• ${prefix}unbanuser @user (mod: solo temporanei) 
• ${prefix}denuncia @user motivo 
• ${prefix}modstats 
• ${prefix}unwarnlink 
• ${prefix}freezegp 
• ${prefix}addparole 
• ${prefix}listaparole 
• ${prefix}delparole 

📢 *Menzioni & Tag*
• ${prefix}hidetag testo (mod: max 6, salta AFK) 
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

━━━━━━━━━━━━━━━━━━━━━━
⚠️ In caso di bug usa: *${prefix}segnala*
`.trim()

  return conn.sendMessage(m.chat, { text: menuText }, { quoted: m })
}

handler.help = ["admin"]
handler.tags = ["menu"]
handler.command = /^(admin|visualizzaadmin|menuadmin)$/i

export default handler