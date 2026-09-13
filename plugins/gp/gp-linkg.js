const handler = async (m, { conn }) => {
    try {
        
        const metadata = await conn.groupMetadata(m.chat);
        const groupName = metadata.subject;
        const memberCount = metadata.participants.length; 
        
        
        const inviteCode = await conn.groupInviteCode(m.chat);
        const linkgruppo = 'https://chat.whatsapp.com/' + inviteCode;

       
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(m.chat, 'image');
        } catch {
            ppUrl = null; 
        }

        
        const messageText = `*[🔗] Link Gruppo*\n\n` +
                          `• *Gruppo:* ${groupName}\n` +
                          `• *Membri presenti:* ${memberCount}\n\n` +
                          `🔗 ${linkgruppo}`;

        
        if (ppUrl) {
            await conn.sendMessage(m.chat, {
                image: { url: ppUrl },
                caption: messageText
            }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, {
                text: messageText
            }, { quoted: m });
        }

    } catch (error) {
        console.error('Errore invio messaggio link gruppo:', error);
        await conn.reply(m.chat, '*[✖] Impossibile recuperare i dettagli del gruppo.*', m);
    }
};

handler.help = ['linkg'];
handler.tags = ['gruppo'];
handler.command = /^linkg$/i;
handler.group = true;
handler.botAdmin = true; 

export default handler;
