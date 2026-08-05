const afkUsers = new Map();

// Inserisci questo dentro l'evento conn.ev.on('messages.upsert', ...)
conn.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    // 1. Disattiva AFK se l'utente manda un qualsiasi messaggio diverso da .afk
    if (afkUsers.has(sender) && body.trim() !== '.afk') {
        const startTime = afkUsers.get(sender);
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        afkUsers.delete(sender);

        await conn.sendMessage(from, {
            text: `👋 non sei più AFK!\n⏱️ Sei stato/a AFK per *${seconds}s*`
        }, { quoted: msg });
        return;
    }

    // 2. Attiva AFK col comando .afk
    if (body.trim().toLowerCase() === '.afk') {
        afkUsers.set(sender, Date.now());
        await conn.sendMessage(from, {
            text: '💤 *Modalità AFK attivata per questo gruppo!*\n\n_Non verrai menzionato/a nei tag._'
        }, { quoted: msg });
    }
});