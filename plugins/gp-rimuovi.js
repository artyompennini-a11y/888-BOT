var handler = async (m, { conn, participants }) => {
    try {
        
        let user = m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)

        if (!user) {
            return m.reply('*Chi vuoi rimuovere? Menziona qualcuno o rispondi a un suo messaggio.*')
        }

        
        const groupInfo = await conn.groupMetadata(m.chat)
        const groupAdmins = participants.filter(p => p.admin).map(p => p.id)
        
       
        const ownerGroup = groupInfo.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
        const ownerBot = global.owner[0] && global.owner[0][0] ? global.owner[0][0] + '@s.whatsapp.net' : ''
        const isTargetAdmin = groupAdmins.includes(user)

        
        
       
        if (user === conn.user.jid) {
            return conn.reply(m.chat, '『 🤨 』 `Non posso rimuovermi da solo`', m);
        }

       
        if (user === ownerGroup) {
            return conn.reply(m.chat, '『 🍥 』 `Non posso rimuovere il proprietario del gruppo`', m);
        }

        
        if (user === ownerBot) {
            return conn.reply(m.chat, '『 ⁉️ 』 `A chi vuoi togliere????`', m);
        }

      
        if (isTargetAdmin) {
            return conn.reply(m.chat, '『 🤒 』 `Non posso rimuovere un altro admin. Devi prima togliergli i privilegi.`', m);
        }

        
        await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
        
       
        await conn.sendMessage(m.chat, { 
            sticker: { url: './media/sticker/bann.webp' } 
        }, { quoted: m });

    } catch (e) {
        console.error(e)
        return m.reply(`${global.errore || 'Errore durante l\'esecuzione del comando.'}`)
    }
}

handler.help = ['rimuovi']
handler.tags = ['gruppo']
handler.command = /^(kick|rimuovi|paki|ban|abdul)$/i 
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
