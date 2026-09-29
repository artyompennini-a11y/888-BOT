let handler = async (m, { conn, text, isAdmin }) => {
    let users = [];

    if (m.mentionedJid.length) {
        users = m.mentionedJid;
    } else if (m.quoted) {
        users.push(m.quoted.sender);
    } else if (text) {
        let numbers = text.split(/\s+/).filter(v => v.length > 0);
        for (let number of numbers) {
            if (isNaN(number)) {
                if (number.includes('@')) {
                    users.push(number.split`@`[1] + '@s.whatsapp.net');
                }
            } else {
                users.push(number + '@s.whatsapp.net');
            }
        }
    }

    if (users.length === 0) return;

    
    const sender = m.sender;
    const isOwner = global.owner?.some(v => sender.includes(v[0]));

    if (!isOwner && !isAdmin) {
        return m.reply('Solo admin e owner possono usare questo comando.');
    }

    for (let user of users) {
        await conn.groupParticipantsUpdate(m.chat, [user], 'demote');
    }

    global.logAdmin?.increment?.(m.chat, m.sender, 'demotes', users.length);
};

handler.help = ['*593xxx*', '*@usuario*', '*responder chat*'].map(v => 'demote ' + v);
handler.tags = ['group'];
handler.command = /^(demote|retrocedi|togliadmin|r)$/i;
handler.group = true;
handler.botAdmin = true;
handler.fail = null;

export default handler;