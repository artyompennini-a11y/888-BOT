let handler = async (m, { conn }) => {
  const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null;

  if (!who) {
    return m.reply(
      `⚠️ Devi menzionare l’utente a cui rimuovere il warn link.`,
      m
    );
  }

  if (!global.db.data.users[who]) {
    return m.reply(
      `❌ L’utente non esiste nel database.`,
      m
    );
  }

  const warnIg = global.db.data.users[who].warnIg || 0;
  const warnTiktok = global.db.data.users[who].warnTiktok || 0;

  if (warnIg === 0 && warnTiktok === 0) {
    return m.reply(
      `ℹ️ @${who.split('@')[0]} non ha warn da rimuovere.`,
      null,
      { mentions: [who] }
    );
  }

  if (warnIg > 0) global.db.data.users[who].warnIg--;
  if (warnTiktok > 0) global.db.data.users[who].warnTiktok--;

  const newIg = global.db.data.users[who].warnIg || 0;
  const newTt = global.db.data.users[who].warnTiktok || 0;

  await m.reply(
    `✅ *Warn rimosso*\n` +
    `È stato rimosso 1 warn a @${who.split('@')[0]}\n\n` +
    `📊 *Warn attuali:*\n` +
    `• Instagram: ${newIg} / 3\n` +
    `• TikTok: ${newTt} / 3`,
    null,
    { mentions: [who] }
  );
};

handler.command = ['unwarnlink'];
handler.tags = ['admin'];
handler.help = ['unwarnlink @utente'];
handler.admin = true;
handler.botAdmin = true;

export default handler;