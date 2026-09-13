const MAX_WARN = 5;

const handler = async (msg, { conn }) => {
  const chatId = msg.chat;

  if (!msg.isGroup) {
    return conn.reply(chatId, '❌ Questo comando funziona solo nei gruppi.', msg);
  }

  const groupMetadata = await conn.groupMetadata(chatId);
  const participants = groupMetadata.participants;
  const sender = participants.find(p => p.id === msg.sender);

  if (!sender || !(sender.admin === 'admin' || sender.admin === 'superadmin')) {
    return conn.reply(chatId, '⛔ Accesso negato — servono privilegi admin.', msg);
  }

  let warnList = [];
  for (let jid in global.db.data.users) {
    let user = global.db.data.users[jid];
    if (user.warn && user.warn > 0) {
      warnList.push({ jid, warn: user.warn });
    }
  }

  if (warnList.length === 0) {
    return conn.reply(chatId, '📋 Nessun utente ha avvertimenti attivi.', msg);
  }

  let testo = `📊 *Lista Warn 888*\nUtenti con avvisi attivi:\n\n`;
  const mentions = [];

  warnList.forEach((u, index) => {
    const tag = '@' + u.jid.split('@')[0];
    testo += `${index + 1}. ${tag} — [ ${u.warn} / ${MAX_WARN} ]\n`;
    mentions.push(u.jid);
  });

  testo += `\nGli utenti sopra elencati hanno avvisi attivi.`;

  return conn.sendMessage(chatId, { text: testo, mentions }, { quoted: msg });
};

handler.help = ['listawarn', 'warnlist'];
handler.tags = ['admin'];
handler.command = /^(listawarn|warnlist)$/i;
handler.group = true;

export default handler;