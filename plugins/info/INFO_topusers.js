let handler = async (m, { conn, participants, args }) => {


    const normalizeJid = jid => {
        if (!jid) return '';
        const num = jid.split('@')[0].replace(/\D/g, '');
        return num + '@s.whatsapp.net';
    };

    let chat = global.db.data.chats[m.chat];
    if (!chat) {
        global.db.data.chats[m.chat] = {};
        chat = global.db.data.chats[m.chat];
    }

    console.log('[DEBUG top] chat.topUsers raw:', chat.topUsers);
    console.log('[DEBUG top] chat.topUsers keys:', Object.keys(chat.topUsers || {}));

    if (!chat.topUsers || Object.keys(chat.topUsers).length === 0) {
        return await conn.sendMessage(m.chat, { 
            text: '📭 [DEBUG A] topUsers è vuoto o non esiste — il counter non sta scrivendo nulla.' 
        });
    }

    console.log('[DEBUG top] participants raw:', JSON.stringify(participants, null, 2));

    const groupMembers = new Set(
        (participants || []).map(p => normalizeJid(p.id || p.jid || p.lid))
    );
    const botJid = normalizeJid(conn.user.jid || conn.user.id);

    console.log('[DEBUG top] groupMembers set:', [...groupMembers]);
    console.log('[DEBUG top] botJid:', botJid);

    const users = Object.entries(chat.topUsers)
        .map(([jid, count]) => [normalizeJid(jid), count]) // Normalizza anche le chiavi di topUsers per il confronto
        .filter(([jid]) => groupMembers.has(jid) && jid !== botJid);

    console.log('[DEBUG top] users dopo filtro:', users);

    if (users.length === 0) {
        return await conn.sendMessage(m.chat, { 
            text: '📭 [DEBUG B] topUsers ha dati, ma il filtro sui partecipanti li ha esclusi tutti.' 
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