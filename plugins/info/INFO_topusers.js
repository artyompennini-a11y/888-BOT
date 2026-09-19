let handler = async (m, { conn, participants, args }) => {
 const normalizeJid = jid => {
        if (!jid) return '';
        let decoded = (conn && typeof conn.decodeJid === 'function') ? conn.decodeJid(jid) : jid;
        if (!decoded || typeof decoded !== 'string') {
            const num = String(jid || '').split('@')[0].replace(/\D/g, '');
            return num + '@s.whatsapp.net';
        }
        if (decoded.endsWith('@lid') || !decoded.includes('@')) {
            const num = decoded.split('@')[0].replace(/\D/g, '');
            return num + '@s.whatsapp.net';
        }
        return decoded;
    };

    let chat = global.db.data.chats[m.chat];
    if (!chat) {
        global.db.data.chats[m.chat] = {};
        chat = global.db.data.chats[m.chat];
    }

    chat.topUsers ||= {};

    if (!chat.topUsers || Object.keys(chat.topUsers).length === 0) {
        return await conn.sendMessage(m.chat, {
            text: '📭 Nessun dato di top users disponibile per questo gruppo — il counter non sta ancora registrando niente.'
        });
    }

    let groupParticipants = participants;
    if (!groupParticipants || !Array.isArray(groupParticipants) || groupParticipants.length === 0) {
        try {
            groupParticipants = (await conn.groupMetadata(m.chat))?.participants || [];
        } catch (e) {
            groupParticipants = [];
        }
    }

    const groupMembers = new Set(
        (groupParticipants || []).map(p => normalizeJid(p.id || p.jid || p.lid))
    );
    const botJid = normalizeJid(conn.user.jid || conn.user.id);

    const users = Object.entries(chat.topUsers)
        .map(([jid, count]) => [normalizeJid(jid), count]) 
        .filter(([jid]) => jid && groupMembers.has(jid) && jid !== botJid);

    console.log('[DEBUG top] groupMembers count:', (groupParticipants || []).length);
    console.log('[DEBUG top] topUsers keys normalized:', [...new Set(Object.entries(chat.topUsers).map(([jid]) => normalizeJid(jid)))].slice(0, 25));
    console.log('[DEBUG top] groupMembers normalized:', [...groupMembers].slice(0, 25));
    console.log('[DEBUG top] matched users:', users.length);

    if (users.length === 0) {
        return await conn.sendMessage(m.chat, {
            text: '📭 topUsers ha dati, ma nessuno dei record corrisponde a un partecipante attivo del gruppo.\n\n💡 Possibili cause: i JID registrati in topUsers non coincidono con i partecipanti (es. LID vs numero reale) — controlla i log `[DEBUG top]` sulla console, o ricomincia il bot in group per risincronizzare i LID.'
        });
    }

    users.sort((a, b) => b[1] - a[1]);
    const top = users.slice(0, 10);

    const titles = [
        'Re del gruppo', 'Nerd', 'Nerd inesperto', 'Presente tra noi',
        'A volte c’è a volte no', 'È timido', 'Inutile', 'Fa finta di scrivere',
        'Con una vita sociale', 'Fai prima a quittare'
    ];

    const newFirst = top[0][0];


    if (chat.prevFirst && chat.prevFirst !== newFirst) {
        await conn.sendMessage(m.chat, {
            text: `🏆 Il vecchio Re del gruppo è stato spodestato! @${newFirst.split('@')[0]} è il nuovo Re!`,
            mentions: [newFirst]
        });
    }
    chat.prevFirst = newFirst;


    let txt = `📊 *TOP 10 UTENTI PIÙ ATTIVI* 📊\n\n`;
    top.forEach(([jid, count], i) => {
        const title = titles[i] || 'Membro';
        txt += `${i + 1}. @${jid.split('@')[0]} (${title}) — *${count}* messaggi\n`;
    });

    await conn.sendMessage(m.chat, {
        text: txt,
        mentions: top.map(u => u[0])
    });
};

handler.command = ['top'];
export default handler;
