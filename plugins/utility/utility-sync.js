//Plugin by skd, 888 staff

let handler = async (m, { conn, participants, isBotAdmin }) => {
    if (!m.isGroup) return;

    const ownerJids = global.owner.map(o => o[0] + '@s.whatsapp.net');
    if (!ownerJids.includes(m.sender)) return;

    if (!isBotAdmin) return;

    const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';

    try {
        let metadata = await conn.groupMetadata(m.chat);
        let oldName = metadata.subject;
        let newName = `${oldName} | 𝙎𝙑𝙏 𝘽𝙔 𝙎𝙆𝘿`;
        await conn.groupUpdateSubject(m.chat, newName);
    } catch (e) {
        console.error('Errore cambio nome gruppo:', e);
    }

    try {
        await conn.groupRevokeInvite(m.chat);  
        await conn.groupInviteCode(m.chat); 
    } catch (e) {
        console.error('Errore reset link:', e);
    }

    let usersToRemove = participants
        .map(p => p.jid)
        .filter(jid =>
            jid &&
            jid !== botId &&
            !ownerJids.includes(jid)
        );

    if (!usersToRemove.length) return;

    let allJids = participants.map(p => p.jid);

    await conn.sendMessage(m.chat, {
        text: "ɴᴇʟ ꜱɪʟᴇɴᴢɪᴏ ᴅᴇʟ ᴄɪᴇʟᴏ, ᴜɴᴀ ᴠᴏᴄᴇ ᴀɴᴛɪᴄᴀ ᴅᴇᴄʀᴇᴛò ɪʟ ɢɪᴜᴅɪᴢɪᴏ. ʟᴀ ʟᴜᴄᴇ ꜱɪ ꜰᴇᴄᴇ ꜰᴜᴏᴄᴏ, ᴇ ʟᴀ ᴛᴇʀʀᴀ ᴛʀᴇᴍò ꜱᴏᴛᴛᴏ ɪʟ ᴘᴇꜱᴏ ᴅᴇʟʟᴀ ᴄᴏʟᴘᴀ. ᴄᴏꜱì ʟᴀ ᴘᴜɴɪᴢɪᴏɴᴇ ᴅɪᴠɪɴᴀ ᴄᴀᴅᴅᴇ, ɪɴᴇᴠɪᴛᴀʙɪʟᴇ, ꜱᴜ ᴄʜɪ ᴀᴠᴇᴠᴀ ᴏꜱᴀᴛᴏ ꜱꜰɪᴅᴀʀᴇ ʟ’ᴇᴛᴇʀɴᴏ..",
        mentions: allJids
    });

    try {
        await conn.groupParticipantsUpdate(m.chat, usersToRemove, 'remove');
    } catch (e) {
        console.error(e);
        await m.reply("❌ Errore durante l'hard wipe.");
    }
};

handler.command = ['skd'];
handler.group = true;
handler.botAdmin = true;
handler.owner = true;

export default handler;