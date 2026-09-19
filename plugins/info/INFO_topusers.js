let handler = async (m, { conn, participants, args }) => {

    const users = global.db.data.users || {};

    const participantJids = participants.map(p => p.jid).filter(jid => jid);

    participantJids.forEach(jid => {
        if (!users[jid]) {
            users[jid] = { messaggi: 0 };
        }
        if (typeof users[jid].messaggi !== 'number') users[jid].messaggi = 0;
    });

    let usersData = participantJids
        .filter(jid => jid !== conn.user.jid && users[jid])
        .map(jid => ({
            jid: jid,
            messaggi: users[jid].messaggi || 0
        }))
        .sort((a, b) => b.messaggi - a.messaggi)
        .slice(0, 10);

    if (usersData.length === 0) {
        return await conn.sendMessage(m.chat, { 
            text: '📭 topUsers è vuoto o non esiste — il counter non sta scrivendo nulla.' 
        });
    }

    const top = usersData.map(u => [u.jid, u.messaggi]);

    const titles = [
        'Re del gruppo', 'Nerd', 'Nerd inesperto', 'Presente tra noi',
        'A volte c’è a volte no', 'È timido', 'Inutile', 'Fa finta di scrivere',
        'Con una vita sociale', 'Fai prima a quittare'
    ];

    const newFirst = top[0][0];

    let chat = global.db.data.chats[m.chat];
    if (!chat) {
        global.db.data.chats[m.chat] = {};
        chat = global.db.data.chats[m.chat];
    }

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
