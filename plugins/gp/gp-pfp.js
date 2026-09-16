//Plugin by Elixir

let handler = async (m, { conn, text }) => {
    let who = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;

  
    if (text) {
       
        let cleanText = text.replace(/@/g, '').trim();

      
        if (/^\d{6,}$/.test(cleanText)) {
        
            who = cleanText + '@s.whatsapp.net';
        } else if (/^[0-9]{1,4}@?/.test(cleanText)) {
          
            if (cleanText.includes('@')) {
                who = cleanText;
            } else {
                who = cleanText + '@s.whatsapp.net';
            }
        }
    }

    if (!who) {
        await conn.sendMessage(m.chat, {
            text: `⚠️ Specifica un utente con @menzione o un numero di telefono.`
        }, { quoted: m });
        return;
    }

    if (who === conn.user.jid) {
        await conn.sendMessage(m.chat, {
            text: `🚫 Impossibile ottenere la foto profilo del bot.`
        }, { quoted: m });
        return;
    }

    try {
        let profilePicture = await conn.profilePictureUrl(who, 'image');
        await conn.sendMessage(m.chat, {
            image: { url: profilePicture },
            caption: `📸`
        }, { quoted: m, mentions: [who] });
    } catch (e) {
        await conn.sendMessage(m.chat, {
            text: `@${who.split('@')[0]} 𝐧𝐨𝐧 𝐡𝐚 𝐮𝐧𝐚 𝐟𝐨𝐭𝐨 𝐩𝐫𝐨𝐟𝐢𝐥𝐨 🚫`,
            mentions: [who]
        }, { quoted: m });
    }
};

handler.command = /^(pic)$/i;
handler.tags = ['admin'];
handler.help = ['𝐩𝐢𝐜'];
handler.group = true;
handler.admin = true;
export default handler;
