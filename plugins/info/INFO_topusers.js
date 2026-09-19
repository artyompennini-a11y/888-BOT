let handler = async (m, { conn, participants, args }) => {

    const normalizeJid = jid => (jid || '').replace(/\D/g, '') + '@s.whatsapp.net';

    let chat = global.db.data.chats[m.chat];
    if (!chat) {
        global.db.data.chats[m.chat] = {};
        chat = global.db.data.chats[m.chat];
    }

    // DEBUG: quante chiavi ci sono davvero in topUsers per questa chat?
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
            text: `🏆 @${newFirst.split('@')[0]} ha superato @${chat.prevFirst.split('@')[0]} ed è il nuovo primo in classifica!`,
            mentions: [newFirst, chat.prevFirst]
        });
    }

    chat.prevFirst = newFirst;

    let text = `🏆 *TOP 10 UTENTI PIÙ ATTIVI DEL GRUPPO*\n`;
    text += `🎁 Se sei il primo, riscatta il tuo premio con *.premiotop*\n\n`;

    const posEmojis = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

    for (let i = 0; i < top.length; i++) {
        const [jid, count] = top[i];
        const title = titles[i] || 'Membro della chat';
        text += `${posEmojis[i]} @${jid.split('@')[0]} — ${title} • ${count} messaggi\n`;
    }

    await conn.sendMessage(m.chat, {
        text,
        mentions: top.map(u => u[0]),
        buttons: [
            { buttonId: '.topgruppi', buttonText: { displayText: '🌍 Top gruppi' }, type: 1 },
            { buttonId: '.statsgiornaliere', buttonText: { displayText: '📊 Statistiche giornaliere' }, type: 1 }
        ],
        headerType: 1
    });
};

handler.help = ['top10'];
handler.tags = ['group'];
handler.command = ['top', 'top10'];

export default handler;