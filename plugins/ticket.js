let handler = async (m, { conn, text, command, usedPrefix }) => {

    if (!text) {
        return await conn.sendMessage(m.chat, { 
            text: `⚠️ *Uso corretto del comando:*\n\nScrivi la tua segnalazione dopo il comando.\n*Esempio:* \`${usedPrefix + command} L'utente @Mario sta facendo spam\``
        }, { quoted: m });
    }

  
    const staffGroupJid = '120363427251015414@g.us';


    const staffInviteLink = "https://chat.whatsapp.com/FWBiNWDFqODJFewlEtlzEz";

    try {
        const normalizeJid = (jid) => {
            if (!jid) return null;
            return typeof conn.decodeJid === 'function' ? conn.decodeJid(jid) : jid;
        };

        let inStaff = false;
        try {
            let meta = await conn.groupMetadata(staffGroupJid);
            const botId = normalizeJid(conn.user?.jid || conn.user?.id);
            inStaff = (meta.participants || []).some(p =>
                normalizeJid(p.id) === botId ||
                (p.jid && normalizeJid(p.jid) === botId) ||
                (p.lid && normalizeJid(p.lid) === botId)
            );
        } catch {
            inStaff = false;
        }

        if (!inStaff) {
            if (!staffInviteLink.includes("chat.whatsapp.com/")) {
                return await conn.sendMessage(m.chat, {
                    text: `❌ *Errore:* Il bot non è nel gruppo staff e il link di invito non è valido.\n\n📌 Inserisci un link corretto nella variabile *staffInviteLink*.`
                }, { quoted: m });
            }

            try {
                let code = staffInviteLink.split("chat.whatsapp.com/")[1];
                await conn.groupAcceptInvite(code);

                await conn.sendMessage(m.chat, {
                    text: `🔓 *Il bot non era nel gruppo staff.*\n➡️ È stato aggiunto automaticamente tramite link.\n\nOra invio la segnalazione…`
                }, { quoted: m });

            } catch (err) {
                console.error("Errore auto-join:", err);
                return await conn.sendMessage(m.chat, {
                    text: `❌ *Errore:* Il bot non è nel gruppo staff e non è riuscito ad entrare tramite link.\nControlla che il link sia valido e che il bot possa unirsi.`
                }, { quoted: m });
            }
        }

        let chatName = 'Chat Privata';
        if (m.isGroup) {
            try {
                let metadata = await conn.groupMetadata(m.chat);
                chatName = metadata.subject;
            } catch {
                chatName = 'Gruppo (Metadata non accessibile)';
            }
        }

        let reportMsg = `🚨 *NUOVA SEGNALAZIONE / REPORT* 🚨\n\n`;
        reportMsg += `👤 *Utente:* @${m.sender.split('@')[0]}\n`;
        reportMsg += `📍 *Origine:* ${m.isGroup ? `Gruppo (*${chatName}*)` : 'Chat Privata'}\n`;
        reportMsg += `📅 *ID Chat:* \`${m.chat}\`\n\n`;
        reportMsg += `📝 *Messaggio:* \n"${text}"`;

        await conn.sendMessage(staffGroupJid, {
            text: reportMsg,
            mentions: [m.sender]
        });


        return await conn.sendMessage(m.chat, {
            text: `✅ *Segnalazione inviata con successo!*\nLo staff la prenderà in carico a breve.`
        }, { quoted: m });

    } catch (e) {
        console.error("Errore nel comando segnala:", e);

        return await conn.sendMessage(m.chat, {
            text: `❌ Errore interno durante l'invio della segnalazione.`
        }, { quoted: m });
    }
};

handler.help = ['segnala <testo>', 'report <testo>'];
handler.tags = ['main', 'supporto'];
handler.command = /^(segnala|report|reporta)$/i;

export default handler;