const handler = async (m, { conn }) => {
  const chats = Object.entries(global.db.data.chats)
    .filter(([jid, data]) => data.isBanned);

  const users = Object.entries(global.db.data.users)
    .filter(([jid, data]) => data.banned);

  const caption =
    `🚫 *Utenti Bannati:* ${users.length}\n` +
    `${users.length > 0
      ? users.map(([jid]) => `• @${jid.split('@')[0]}`).join('\n')
      : 'Nessun utente bannato'}\n\n` +

    `🔒 *Chat Bloccate:* ${chats.length}\n` +
    `${chats.length > 0
      ? chats.map(([jid]) => `• @${jid.split('@')[0]}`).join('\n')
      : 'Nessuna chat bloccata'}`;

  m.reply(caption, null, { mentions: conn.parseMention(caption) });
};

handler.help = ['banlist'];
handler.command = /^banlist(ned)?|ban(ned)?list|daftarban(ned)?$/i;
handler.mods = true;
handler.tags = ['owner'];

export default handler;