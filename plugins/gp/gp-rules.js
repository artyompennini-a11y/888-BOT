let handler = async (m, { conn }) => {
  const groupMetadata = await conn.groupMetadata(m.chat);
  const groupName = groupMetadata.subject;
  const groupDescription = groupMetadata.desc || '📜 Nessuna descrizione presente';

  const text =
    `⚖️ *Info Gruppo 888*\n` +
    `🟠 Nome: ${groupName}\n` +
    `🟡 Descrizione:\n${groupDescription}`;

  await conn.sendMessage(
    m.chat,
    { text },
    { quoted: m }
  );
};

handler.command = /^(rules)$/i;
handler.tags = ['admin'];
handler.help = ['rules'];
handler.group = true;
handler.admin = true;

export default handler;