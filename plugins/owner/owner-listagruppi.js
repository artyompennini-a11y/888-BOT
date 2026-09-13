import fetch from "node-fetch";

let handler = async (m, { conn, usedPrefix }) => {
  const botName = global.db.data?.nomedelbot || "𝟴𝟴𝟴 𝗕𝗢𝗧";

  const fake = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "888ListaGruppi"
    },
    message: {
      locationMessage: {
        name: "📦 LISTA GRUPPI 888",
        jpegThumbnail: await (await fetch("https://qu.ax/JKCXP.jpg")).buffer()
      }
    },
    participant: "0@s.whatsapp.net"
  };

  const groups = await conn.groupFetchAllParticipating();
  const groupList = Object.values(groups).sort(
    (a, b) => b.participants.length - a.participants.length
  );

  const botJid = conn.decodeJid(conn.user.jid);

  let text =
    `📦 *Lista Gruppi*\n` +
    `Bot: ${botName}\n` +
    `Totale gruppi: *${groupList.length}*\n\n`;

  for (let i = 0; i < groupList.length; i++) {
    const group = groupList[i];
    const jid = group.id;

    let metadata;
    try {
      metadata = await conn.groupMetadata(jid);
    } catch {
      metadata = group;
    }

    const participants = metadata?.participants || group.participants || [];
    const totalParticipants = participants.length;

    const normalizedParticipants = participants.map(u => {
      const id = conn.decodeJid(u.id || u.jid || u.lid || "");
      return { ...u, id };
    });

    const matchIds = (u, target) =>
      [conn.decodeJid(u?.id), u?.jid, u?.lid]
        .filter(Boolean)
        .includes(target);

    const admins = normalizedParticipants.filter(p =>
      ["admin", "superadmin", true].includes(p.admin)
    );

    const botIsOwner =
      metadata?.owner &&
      conn.decodeJid(metadata.owner) === botJid;

    const botIsAdmin =
      botIsOwner ||
      normalizedParticipants.some(
        u => matchIds(u, botJid) && ["admin", "superadmin", true].includes(u.admin)
      );

    const chatData = global.db.data.chats?.[jid] || {};
    let groupMessages = chatData.totalmsg || 0;

    if (!groupMessages && chatData.topUsers) {
      groupMessages = Object.values(chatData.topUsers).reduce(
        (sum, v) => sum + (v || 0),
        0
      );
    }

    if (!groupMessages && chatData.users) {
      groupMessages = Object.values(chatData.users).reduce(
        (sum, u) => sum + (u?.messages || 0),
        0
      );
    }

    if (typeof groupMessages !== "number") groupMessages = "N/D";

    let groupLink = "✗";

    if (botIsAdmin) {
      try {
        const code = await conn.groupInviteCode(jid);
        if (code) groupLink = `https://chat.whatsapp.com/${code}`;
      } catch {}
    }

    if (groupLink === "✗") {
      const nativeCode = metadata?.inviteCode || metadata?.invite_code;
      if (nativeCode) groupLink = `https://chat.whatsapp.com/${nativeCode}`;
    }

    if (groupLink === "✗") {
      const desc = metadata?.desc?.toString() || "";
      const match = desc.match(/https:\/\/chat\.whatsapp\.com\/\S+/);
      if (match) groupLink = match[0];
    }

    text +=
      `📦 *Gruppo ${i + 1}:* ${group.subject}\n` +
      `👥 Membri: ${totalParticipants}\n` +
      `💬 Messaggi: ${groupMessages}\n` +
      `🛡️ Bot Admin: ${botIsAdmin ? `Sì (${admins.length})` : "No"}\n` +
      `🆔 ID: ${jid}\n` +
      `🔗 Link: ${groupLink}\n\n`;
  }

  text +=
    `⚠️ In caso di problemi usa *${usedPrefix}segnala* per contattare lo staff.`;

  await conn.sendMessage(m.chat, { text }, { quoted: fake });
};

handler.command = /^(gruppi)$/i;
handler.owner = true;

export default handler;