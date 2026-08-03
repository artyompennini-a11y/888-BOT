let handler = async (m, { conn, text, command, usedPrefix }) => {
    // 1. Controllo se è stato fornito un testo
    if (!text) {
        return await conn.sendMessage(m.chat, { 
            text: `⚠️ *Uso corretto del comando:*\n\nScrivi la tua segnalazione dopo il comando.\n*Esempio:* \`${usedPrefix + command} L'utente @Mario sta facendo spam\` o un bug che hai trovato.` 
        }, { quoted: m });
    }

    // 2. Inserisci qui l'ID della chat o del gruppo dello STAFF (es. 12036301234567890@g.us)
    // Se lasci vuoto o usi m.chat, invierà le informazioni relative alla chat corrente.
    const staffGroupJid = 'INSERISCI_QUI_JID_GRUPPO_STAFF@g.us'; 

    try {
        let chatName = 'Chat Privata';
        
        // Se usati in un gruppo, raccoglie in sicurezza le informazioni evitando l'errore 403 Forbidden
        if (m.isGroup) {
            try {
                let metadata = await conn.groupMetadata(m.chat);
                chatName = metadata.subject;
            } catch (err) {
                chatName = 'Gruppo (Metadata non accessibile)';
            }
        }

        // 3. Formattazione del messaggio di segnalazione per lo Staff
        let reportMsg = `🚨 *NUOVA SEGNALAZIONE / REPORT* 🚨\n\n`;
        reportMsg += `👤 *Utente:* @${m.sender.split('@')[0]}\n`;
        reportMsg += `📍 *Origine:* ${m.isGroup ? `Gruppo (*${chatName}*)` : 'Chat Privata'}\n`;
        reportMsg += `📅 *ID Chat:* \`${m.chat}\`\n\n`;
        reportMsg += `📝 *Messaggio:* \n"${text}"`;

        // 4. Invio della segnalazione allo staff (o nella chat corrente se non configurato)
        let destination = staffGroupJid.includes('@g.us') ? staffGroupJid : m.chat;

        await conn.sendMessage(destination, {
            text: reportMsg,
            mentions: [m.sender]
        });

        // 5. Conferma all'utente
        return await conn.sendMessage(m.chat, {
            text: `✅ *Segnalazione inviata con successo!*\nUn membro dello staff la prenderà in carico il prima possibile.`
        }, { quoted: m });

    } catch (e) {
        console.error("Errore nel comando segnala:", e);
        
        // Gestione specifica dell'errore Forbidden (403)
        if (e?.data === 403 || e?.message?.includes('forbidden')) {
            return await conn.sendMessage(m.chat, {
                text: `❌ *Errore:* Impossibile inviare la segnalazione. Il bot non ha i permessi necessari o non fa parte della chat di destinazione.`
            }, { quoted: m });
        }

        return await conn.sendMessage(m.chat, {
            text: `❌ Si è verificato un errore durante l'invio della segnalazione. Riprova più tardi.`
        }, { quoted: m });
    }
};

handler.help = ['segnala <testo>', 'report <testo>'];
handler.tags = ['main', 'supporto'];
handler.command = /^(segnala|report|reporta)$/i;

export default handler;