let handler = m => m;

handler.before = async function (m, { conn }) {
    if (!m || !m.key) return m;

    try {
        if (!m.sender) {
            m.sender = m.key.participant || m.key.remoteJid || conn.user?.jid || conn.user?.id || '';
        }

        if (!m.sender || typeof m.sender !== 'string') return m;

        if (m.sender.includes(':')) {
            let [user] = m.sender.split(':');
            let server = m.sender.split('@')[1] || 's.whatsapp.net';
            m.sender = `${user}@${server}`;
        }

        let validPushName = m.pushName;
        if (!validPushName || String(validPushName).trim() === '' || String(validPushName).toLowerCase() === 'undefined') {
            validPushName = '';
        }

        if (!validPushName) {
            try {
                let fetchedName = typeof conn.getName === 'function' ? conn.getName(m.sender) : null;
                validPushName = fetchedName || m.name || 'Utente WhatsApp';
            } catch (e) {
                validPushName = 'Utente WhatsApp';
            }
        }

        m.pushName = String(validPushName).trim();

        if (global.db && global.db.data && global.db.data.users) {
            let user = global.db.data.users[m.sender];
            if (user) {
                if (!user.name || String(user.name).trim() === '' || String(user.name).toLowerCase() === 'undefined') {
                    user.name = m.pushName;
                }
            } else {
                global.db.data.users[m.sender] = {
                    name: m.pushName,
                    registered: false
                };
            }
        }

    } catch (error) {
        console.error('[ERRORE PLUGIN USERNAME]:', error);
    }

    return m;
};

export default handler;