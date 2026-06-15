let handler = async (m, { conn, text, usedPrefix, command }) => {
  let who;
  if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
  else who = m.chat;

  if (!who) return m.reply(`⚠️ *Devi menzionare o rispondere al messaggio di un utente per simulare il ban.*`);

  let reason = text ? text.replace(/@\d+|^\d+/, '').trim() : 'Violazione dei protocolli interni';
  const tagUtente = who.split('@')[0];

  let messaggioFakeBan = `╭━━━〔 🚫 *UTENTE BANNATO* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* ID_TERMINATED 🛑
┃━━━━━━━━━━━━━━━━━━
┃ 👤 *Target:* @${tagUtente}
┃ 👑 *Eseguito da:* @${m.sender.split('@')[0]}
┃ ⚙️ *Azione:* Ban Permanente da WhatsApp (Simulato)
┃ 📝 *Motivo:* _${reason}_
┃━━━━━━━━━━━━━━━━━━
┃ ⮕ _L'account dell'utente è stato rimosso_
┃   _dalla matrice principale del gruppo._
╰━━━━━━━━━━━━━━━━━━┈
> ⛔ Scherzo! L'utente non è stato bannato davvero.`.trim();

  await conn.sendMessage(m.chat, { 
    text: messaggioFakeBan, 
    mentions: [who, m.sender] 
  }, { quoted: m });
};

handler.help = ['banzozzap', 'fintoban'];
handler.tags = ['giochi'];
handler.command = /^(banzozzap|fintoban|fban)$/i;
handler.group = true;
handler.admin = true; 

export default handler;
