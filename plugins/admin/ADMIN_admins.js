const handler = async (m, { conn, participants, groupMetadata, args }) => {
  const groupAdmins = participants.filter(p => p.admin);
  const mentionList = groupAdmins.map(p => p.id);

  const owner =
    groupMetadata.owner ||
    groupAdmins.find(p => p.admin === 'superadmin')?.id ||
    `${m.chat.split('-')[0]}@s.whatsapp.net`;

  const message = args.join(' ') || 'Nessun messaggio fornito';

  const listAdmin = groupAdmins
    .map(v => `• @${v.id.split('@')[0]}`)
    .join('\n');

  const text = `
⚠️ *RICHIAMO ADMIN 888*
Segnalazione staff del gruppo

📝 *Messaggio*
${message}

👑 *Amministratori*
${listAdmin}

━━━━━━━━━━━━━━━━━━━━━━
Tutti gli admin sono stati menzionati.
`.trim();

  await conn.sendMessage(
    m.chat,
    {
      text,
      contextInfo: {
        mentionedJid: [...mentionList, owner],
        externalAdReply: {
          title: groupMetadata.subject,
          body: "🛎️ Sveglia in corso per lo staff del gruppo",
          thumbnailUrl:
            (await conn.profilePictureUrl(m.chat, 'image').catch(_ => null)) ||
            'https://telegra.ph/file/0f336691459a936a75f1b.jpg',
          mediaType: 1,
          renderLargerThumbnail: false
        }
      }
    },
    { quoted: m }
  );
};

handler.command = ['admins', '@admins', 'dmins'];
handler.tags = ['admin'];
handler.help = ['admins <messaggio>'];
handler.group = true;
handler.mods = true;

export default handler;