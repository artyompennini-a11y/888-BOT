const handler = async (m, {conn, isOwner}) => {
  const chats = Object.entries(global.db.data.chats).filter((chat) => chat[1].isBanned);
  const users = Object.entries(global.db.data.users).filter((user) => user[1].banned);

  const caption = 
`╭━━━〔 🚫 *LISTA BLOCCATI 888* 〕━━━┈
┃ 👤 *Utenti bannati:* ${users.length}
┃━━━━━━━━━━━━━━━━━━
${users.length > 0 
  ? users.map(([jid]) => `┃ • @${jid.split('@')[0]}`).join('\n')
  : '┃ Nessun utente bannato'}
╰━━━━━━━━━━━━━━━━━━┈

╭━━━〔 🔒 *CHAT BLOCCATE* 〕━━━┈
┃ 💬 *Totale:* ${chats.length}
┃━━━━━━━━━━━━━━━━━━
${chats.length > 0
  ? chats.map(([jid]) => `┃ • @${jid.split('@')[0]}`).join('\n')
  : '┃ Nessuna chat bloccata'}
╰━━━━━━━━━━━━━━━━━━┈`;

  m.reply(caption, null, {mentions: conn.parseMention(caption)});
};

handler.help = ['𝐛𝐚𝐧𝐥𝐢𝐬𝐭'];
handler.command = /^banlist(ned)?|ban(ned)?list|daftarban(ned)?$/i;
handler.mods = true;
handler.tags = ['owner'];

export default handler;