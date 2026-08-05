const afkUsers = new Map();

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const senderId = msg.author || msg.from;
    const contact = await msg.getContact();
    const pushname = contact.pushname || 'Utente';

    
    if (afkUsers.has(senderId) && msg.body.trim() !== '.afk') {
        const afkData = afkUsers.get(senderId);
        const secondsAfk = Math.floor((Date.now() - afkData.startTime) / 1000);
        
        
 
        await msg.reply(
            `👋 @${pushname} non sei più AFK!\n⏱️ Sei stato/a AFK per *${secondsAfk}s*`
        );
        return;
    }

    
    if (msg.body.trim().toLowerCase() === '.afk') {
        // Salva l'orario di inizio
        afkUsers.set(senderId, {
            startTime: Date.now()
        });

        await msg.reply('💤 *Modalità AFK attivata per questo gruppo!*\n\n_Non verrai menzionato/a nei tag._');
        return;
    }

    // 3. AVVISO SE QUALCUNO MENZIONA UN UTENTE AFK
    if (msg.mentionedIds && msg.mentionedIds.length > 0) {
        for (const mentionedId of msg.mentionedIds) {
            if (afkUsers.has(mentionedId)) {
                await msg.reply(`⚠️ L'utente menzionato è attualmente AFK.`);
                break;
            }
        }
    }
});