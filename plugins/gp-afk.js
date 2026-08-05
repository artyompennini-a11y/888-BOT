const afkUsers = new Map();

conn.ev.on('messages.upsert', async (m) => {
    
    if (m.type !== 'notify') return;

    const msg = m.messages[0];
    
    
    if (!msg || !msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    
    
    const body = 
        msg.message.conversation || 
        msg.message.extendedTextMessage?.text || 
        '';

    const cleanBody = body.trim();

    
    if (afkUsers.has(sender) && cleanBody.toLowerCase() !== '.afk') {
        const startTime = afkUsers.get(sender);
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        
        
        afkUsers.delete(sender);

        await conn.sendMessage(from, {
            text: `👋 Non sei più AFK!\n⏱️ Sei stato/a AFK per *${seconds}s*`
        }, { quoted: msg });
        return;
    }

    
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