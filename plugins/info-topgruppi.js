//Plugin by Elixir, Punisher & 888 staff
let handler = async (m, { conn }) => {
  let botGroups = await conn.groupFetchAllParticipating().catch(() => ({}))
  let activeGroups = new Set(Object.keys(botGroups))

  let chats = global.db.data.chats || {};

  let groups = Object.entries(chats)
    .filter(([jid]) => jid.endsWith('@g.us') && activeGroups.has(jid))
    .map(([jid, data]) => {
      let total = data.totalmsg || 0;
      if (!total && data.topUsers) {
        total = Object.values(data.topUsers).reduce((sum, value) => sum + (value || 0), 0);
      }
      if (!total && data.users) {
        total = Object.values(data.users).reduce((sum, user) => sum + ((user?.messages || 0)), 0);
      }
      return { jid, total };
    });

  groups.sort((a, b) => b.total - a.total);
  let top10 = groups.slice(0, 10);
  const medals = ['🥇', '🥈', '🥉'];

  let text = `╭━━━〔 🏆 *TOP 10 GRUPPI* 〕━━━┈\n┃ 📊 *Classifica Attività Gruppi:*\n┃\n`;

  if (top10.length === 0) {
    text += `┃  ❌ Nessun gruppo trovato\n`;
  } else {
    for (let i = 0; i < top10.length; i++) {
      let g = top10[i];
      let name = botGroups[g.jid]?.subject || "Gruppo sconosciuto";

      if (name === "Gruppo sconosciuto") continue;

      let icon = medals[i] || '🔹';
      text += `┃  ${icon} *${i + 1}°* ${name}\n┃  ⮕ 💬 ${g.total} messaggi\n┃\n`;
    }
  }

  text += `╰━━━━━━━━━━━━━━━━━━┈\n> 🇮🇹 *𝟴𝟴𝟴 𝗕𝗢T* 🇮🇹`.trim();

  await conn.sendMessage(m.chat, { text }, { quoted: m });
};

handler.command = /^topgruppi$/i;
handler.tags = ['info'];
handler.help = ['topgruppi'];

export default handler;
