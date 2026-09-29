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

    // Permesso: owner + admin
    const sender = m.sender;
    const isOwner = global.owner?.some(v => sender.includes(v[0]));

    if (!isOwner && !isAdmin) return m.reply('Solo admin e owner possono usare questo comando.');

    for (let user of users) {
        await conn.groupParticipantsUpdate(m.chat, [user], 'promote');
    }

    global.logAdmin?.increment?.(m.chat, m.sender, 'promotes', users.length);
};

handler.command = /^(promote|promuovi|mettiadmin|p)$/i;
handler.group = true;
handler.botAdmin = true;
handler.fail = null;

export default handler;