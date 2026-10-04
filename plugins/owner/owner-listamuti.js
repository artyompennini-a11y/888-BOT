import fetch from "node-fetch";

let handler = async (m, { conn, usedPrefix }) => {
  let users = [];

  for (const [jid, data] of Object.entries(global.db.data.users)) {
    if (
      data.muto ||
      data.muted ||
      data.mute ||
      data.isMuted ||
      (data.settings && data.settings.muto)
    ) {
      users.push(jid);
    }
  }

  const chat = global.db.data.chats[m.chat] || {};
  if (chat.mutedUsers) users.push(...Object.keys(chat.mutedUsers));
  if (chat.muto) users.push(...Object.keys(chat.muto));

  users = [...new Set(users)];

  const fake = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "888ListMuti"
    },
    message: {
      locationMessage: {
        name: "🔇 UTENTI MUTATI",
        jpegThumbnail: await (await fetch("https://qu.ax/JKCXP.jpg")).buffer()
      }
    },
    participant: "0@s.whatsapp.net"
  };

  let text = `🔇 *Utenti Mutati*\nTotale: *${users.length}*\n\n`;

  if (users.length === 0) {
    text += `🟢 Nessun utente risulta mutato.\n`;
  } else {
    users.forEach((jid, i) => {
      text += `${i + 1}. @${jid.split("@")[0]}\n`;
    });
  }

  text += `\n⚠️ Usa *${usedPrefix}segnala* per contattare lo staff.`;

  await conn.sendMessage(
    m.chat,
    {
      text,
      mentions: conn.parseMention(text)
    },
    { quoted: fake }
  );
};

handler.help = ["listamuti"];
handler.tags = ["owner"];
handler.command = /^listamuti$/i;
handler.rowner = true;

export default handler;