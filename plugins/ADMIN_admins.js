const handler = async (m, { conn, participants, groupMetadata, args }) => {
    const groupAdmins = participants.filter(p => p.admin);
    const mentionList = groupAdmins.map(p => p.id);
    const owner = groupMetadata.owner || 
        groupAdmins.find(p => p.admin === 'superadmin')?.id || 
        `${m.chat.split('-')[0]}@s.whatsapp.net`;

    let pesan = args.join(' ');
    let message = pesan ? pesan : 'Nessun messaggio fornito';

    const listAdmin = groupAdmins
        .map((v, i) => `┃  • @${v.id.split('@')[0]}`)
        .join('\n');

    let text = `╭━━━〔 ⚠️ *RICHIAMO ADMIN* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* Segnalazione Staff
┃━━━━━━━━━━━━━━━━━━
┃ 📝 *MESSAGGIO:*
┃ ⮕ _${message}_
┃ 
┃ 👑 *LISTA AMMINISTRATORI:*
${listAdmin}
┃━━━━━━━━━━━━━━━━━━
┃ _Tutti gli amministratori sono stati_
┃ _menzionati e sollecitati a rispondere._
╰━━━━━━━━━━━━━━━━━━┈`.trim();

    await conn.sendMessage(m.chat, {
        text: text,
        contextInfo: {
            mentionedJid: [...mentionList, owner],
            externalAdReply: {
                title: groupMetadata.subject,
                body: "🛎️ Sveglia in corso per lo staff del gruppo",
                thumbnailUrl: await conn.profilePictureUrl(m.chat, 'image').catch(_ => null) || 'https://telegra.ph/file/0f336691459a936a75f1b.jpg',
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m });
};

handler.command = ['admins', '@admins', 'dmins'];
handler.tags = ['admin'];
handler.help = ['admins <messaggio>'];
handler.group = true;
handler.mods = true;

export default handler;
