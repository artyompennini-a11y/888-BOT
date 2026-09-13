let handler = async (m, { conn, text, usedPrefix, command }) => {

    if (!text) {
        return await conn.sendMessage(m.chat, {
            text: "⚠️ *Uso corretto del comando:*\n\nScrivi l'idea del plugin dopo il comando.\n*Esempio:* `" + usedPrefix + command + " Plugin meteo che mostra le previsioni del tempo`"
        }, { quoted: m });
    }

    const staffGroupJid = '120363427251015414@g.us';

    try {
        let staffMeta;
        try {
            staffMeta = await conn.groupMetadata(staffGroupJid);
        } catch {
            return await conn.sendMessage(m.chat, {
                text: `❌ *Errore:* Non riesco a recuperare il gruppo staff oppure il bot non vi è presente.`
            }, { quoted: m });
        }

        const participants = Array.isArray(staffMeta.participants) ? staffMeta.participants.filter(p => p && p.id) : [];
        const mentionList = participants.map(p => p.id);

        let chatName = 'Chat Privata';
        if (m.isGroup) {
            try {
                let metadata = await conn.groupMetadata(m.chat);
                chatName = metadata.subject;
            } catch {
                chatName = 'Gruppo (Metadata non accessibile)';
            }
        }

        let ideaMsg = `💡 *NUOVA IDEA PLUGIN* 💡\n\n`;
        ideaMsg += `👤 *Proposto da:* @${m.sender.split('@')[0]}\n`;
        ideaMsg += `📍 *Origine:* ${m.isGroup ? `Gruppo (*${chatName}*)` : 'Chat Privata'}\n`;
        ideaMsg += `📅 *ID Chat:* \`${m.chat}\`\n\n`;
        ideaMsg += `📝 *Idea:*\n"${text}"\n\n`;
        ideaMsg += `👥 *Staff taggato:* ${mentionList.length} membri`;

        await conn.sendMessage(staffGroupJid, {
            text: ideaMsg,
            contextInfo: { mentionedJid: mentionList }
        });

        return await conn.sendMessage(m.chat, {
            text: `✅ *Idea inviata con successo!*\nLo staff è stato avvisato e la valuterà a breve.`
        }, { quoted: m });

    } catch (e) {
        console.error("Errore nel comando idea:", e);

        return await conn.sendMessage(m.chat, {
            text: `❌ Errore interno durante l'invio dell'idea.`
        }, { quoted: m });
    }
};

handler.help = ['idea <testo>'];
handler.tags = ['main', 'supporto'];
handler.command = /^(idea|suggerimento|proposta)$/i;

export default handler;