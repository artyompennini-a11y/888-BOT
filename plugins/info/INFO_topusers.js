let handler = async (m, { conn, participants, args }) => {

    // Inizializza la chat nel database se non esiste
    let chat = global.db.data.chats[m.chat];
    if (!chat) {
        global.db.data.chats[m.chat] = {};
        chat = global.db.data.chats[m.chat];
    }

    if (!chat.topUsers || Object.keys(chat.topUsers).length === 0) {
        return await conn.sendMessage(m.chat, { 
            text: '📭 Nessun messaggio registrato in questo gruppo.' 
        });
    }

    // Filtra i membri presenti nel gruppo ed esclude il bot
    const groupMembers = new Set(participants?.map(p => p.id) || []);
    const botJid = conn.user.jid || conn.user.id;

    const users = Object.entries(chat.topUsers)
        .filter(([jid]) => groupMembers.has(jid) && jid !== botJid);

    if (users.length === 0) {
        return await conn.sendMessage(m.chat, { 
            text: '📭 Nessun messaggio registrato in questo gruppo.' 
        });
    }

    // Ordina gli utenti dal più attivo al meno attivo
    users.sort((a, b) => b[1] - a[1]);
    const top = users.slice(0, 10);

    const titles = [
        'Re del gruppo',
        'Nerd',
        'Nerd inesperto',
        'Presente tra noi',
        'A volte c’è a volte no',
        'È timido',
        'Inutile',
        'Fa finta di scrivere',
        'Con una vita sociale',
        'Fai prima a quittare'
    ];

    const newFirst = top[0][0];

    // Notifica cambio primo posto
    if (chat.prevFirst && chat.prevFirst !== newFirst) {
        await conn.sendMessage(m.chat, {
            text: `🏆 @${newFirst.split('@')[0]} ha superato @${chat.prevFirst.split('@')[0]} ed è il nuovo primo in classifica!`,
            mentions: [newFirst, chat.prevFirst]
        });
    }

    chat.prevFirst = newFirst;

    // Messaggio classifica
    let text = `🏆 *TOP 10 UTENTI PIÙ ATTIVI DEL GRUPPO*\n`;
    text += `🎁 Se sei il primo, riscatta il tuo premio con *.premiotop*\n\n`;

    const posEmojis = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

    for (let i = 0; i < top.length; i++) {
        const [jid, count] = top[i];
        const title = titles[i] || 'Membro della chat';
        text += `${posEmojis[i]} @${jid.split('@')[0]} — ${title} • ${count} messaggi\n`;
    }

    // Invio messaggio con bottoni premium
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