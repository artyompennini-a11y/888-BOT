const afkUsers = new Map();

conn.ev.on('messages.upsert', async (m) => {
    // 1. FILTRO FONDAMENTALE: blocca le notifiche duplicate
    if (m.type !== 'notify') return;

    const msg = m.messages[0];
    
    // Ignora messaggi vuoti, messaggi di stato/storie o messaggi inviati dal bot stesso
    if (!msg || !msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    
    // Estrae il testo del messaggio in base al tipo (testo normale, con formato o risposta)
    const body = 
        msg.message.conversation || 
        msg.message.extendedTextMessage?.text || 
        '';

    const cleanBody = body.trim();

    // 2. DISATTIVAZIONE AFK
    // Se l'utente è AFK e manda un messaggio qualsiasi (diverso da .afk)
    if (afkUsers.has(sender) && cleanBody.toLowerCase() !== '.afk') {
        const startTime = afkUsers.get(sender);
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        
        // Rimuove subito l'utente dalla mappa prima di inviare il messaggio
        afkUsers.delete(sender);

        await conn.sendMessage(from, {
            text: `👋 Non sei più AFK!\n⏱️ Sei stato/a AFK per *${seconds}s*`
        }, { quoted: msg });
        return;
    }

    // 3. ATTIVAZIONE AFK
    if (cleanBody.toLowerCase() === '.afk') {
        // Salva l'orario se non era già AFK
        if (!afkUsers.has(sender)) {
            afkUsers.set(sender, Date.now());
            
            await conn.sendMessage(from, {
                text: '💤 *Modalità AFK attivata per questo gruppo!*\n\n_Non verrai menzionato/a nei tag._'
            }, { quoted: msg });
        }
    }
});