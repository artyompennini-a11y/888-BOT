let handler = async (m, { conn }) => {

    let groupMetadata = await conn.groupMetadata(m.chat);
    let groupName = groupMetadata.subject;
    let groupDescription = groupMetadata.desc || '📜 Nessuna descrizione presente';

    let infoMessage =
`╭━━━〔 ⚖️ *INFO GRUPPO 888* 〕━━━┈
┃ 🟠 *Nome del gruppo:*
┃ ➜ ${groupName}
┃━━━━━━━━━━━━━━━━━━
┃ 🟡 *Descrizione:*
┃ ➜ ${groupDescription}
╰━━━━━━━━━━━━━━━━━━┈`;

    await conn.sendMessage(m.chat, { text: infoMessage }, { quoted: m });
};

handler.command = /^(rules)$/i;
handler.tags = ['admin'];
handler.help = ['𝐫𝐮𝐥𝐞𝐬'];
handler.group = true;
handler.admin = true;

export default handler;