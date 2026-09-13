import fetch from "node-fetch";

let handler = async (m, { conn, usedPrefix, isOwner }) => {
  const chatData = global.db.data.chats[m.chat] || {};

  const target = m.quoted
    ? m.quoted.sender
    : m.mentionedJid?.[0]
    ? m.mentionedJid[0]
    : m.fromMe
    ? conn.user.jid
    : m.sender;

  const avatarUrl =
    (await conn.profilePictureUrl(target, "image").catch(() => null)) ||
    "https://qu.ax/DQsgr.png";

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

  const users = Object.entries(global.db.data.users).filter(
    ([, data]) => data.muto
  );

  let text =
    `🔇 *Utenti Mutati*\n` +
    `Totale: *${users.length}*\n\n`;

  if (users.length === 0) {
    text += `🟢 Nessun utente mutato nel database.\n`;
  } else {
    users.forEach(([jid], i) => {
      const formatted = isOwner ? `@${jid.split("@")[0]}` : jid;
      text += `${i + 1}. ${formatted}\n`;
    });
  }

  text +=
    `\n⚠️ In caso di problemi usa *${usedPrefix}segnala* per contattare lo staff.`;

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
handler.command = /^listamuti?$/i;
handler.rowner = true;

export default handler;