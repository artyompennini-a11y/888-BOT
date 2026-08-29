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

        
        const messageText = `*[🔗] \`Link Gruppo:\`*\n\n` +
                          `• *Gruppo:* *${groupName}*\n` +
                          `• *Membri presenti:* *${memberCount}*`;

        
        const interactiveButtons = [{
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
                display_text: '📎 Copia Link',
                copy_code: linkgruppo
            })
        }];

        
        if (ppUrl) {
            
            await conn.sendMessage(m.chat, {
                image: { url: ppUrl },
                caption: messageText,
                interactiveButtons
            }, { quoted: m });
        } else {

            await conn.sendMessage(m.chat, {
                text: messageText,
                interactiveButtons
            }, { quoted: m });
        }

    } catch (error) {
        console.error('Errore invio messaggio link completo:', error);
       
        await conn.reply(m.chat, '*[✖] Impossibile recuperare i dettagli completi del gruppo.*', m);
    }
};

handler.help = ['link'];
handler.tags = ['gruppo'];
handler.command = /^link$/i;
handler.group = true;
handler.botAdmin = true; 

export default handler;
