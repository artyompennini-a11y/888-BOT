// Plugin by elixir & punisher
export const staffGroupJid = '120363427251015414@g.us';

export const staffInviteLink = "https://chat.whatsapp.com/FWBiNWDFqODJFewlEtlzEz";

export const normalizeStaffJid = (conn, jid) => {
    if (!jid) return null;
    return typeof conn?.decodeJid === 'function' ? conn.decodeJid(jid) : jid;
};

export async function ensureStaffMembership(conn) {
    let inStaff = false;
    try {
        const meta = await conn.groupMetadata(staffGroupJid);
        const botId = normalizeStaffJid(conn, conn.user?.jid || conn.user?.id);
        inStaff = (meta.participants || []).some(p =>
            normalizeStaffJid(conn, p.id) === botId ||
            (p.jid && normalizeStaffJid(conn, p.jid) === botId) ||
            (p.lid && normalizeStaffJid(conn, p.lid) === botId)
        );
    } catch {
        inStaff = false;
    }

    if (inStaff) return { ok: true, joined: false };

    if (!String(staffInviteLink).includes("chat.whatsapp.com/")) {
        return { ok: false, error: 'link_non_valido' };
    }

    try {
        const code = String(staffInviteLink).split("chat.whatsapp.com/")[1];
        await conn.groupAcceptInvite(code);
        return { ok: true, joined: true };
    } catch (e) {
        console.error("[STAFF] auto-join fallito:", e);
        return { ok: false, error: 'join_fallito', detail: e?.message };
    }
}

export async function sendStaffReport(conn, { text, mentions = [] } = {}) {
    const membership = await ensureStaffMembership(conn);
    if (!membership.ok) return membership;

    await conn.sendMessage(staffGroupJid, {
        text,
        mentions
    });
    return { ok: true, joined: !!membership.joined };
}

let handler = async (m, { conn, text, command, usedPrefix }) => {

    if (!text) {
        return await conn.sendMessage(m.chat, {
            text: `⚠️ *Uso corretto del comando:*\n\nScrivi la tua segnalazione dopo il comando.\n*Esempio:* \`${usedPrefix + command} L'utente @Mario sta facendo spam\``
        }, { quoted: m });
    }

    try {
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

        const result = await sendStaffReport(conn, {
            text: reportMsg,
            mentions: [m.sender]
        });

        if (!result.ok) {
            const errors = {
                link_non_valido: `❌ *Errore:* Il bot non è nel gruppo staff e il link di invito non è valido.\n\n📌 Inserisci un link corretto nella variabile *staffInviteLink*.`,
                join_fallito: `❌ *Errore:* Il bot non è nel gruppo staff e non è riuscito ad entrare tramite link.\nControlla che il link sia valido e che il bot possa unirsi.`
            };
            return await conn.sendMessage(m.chat, {
                text: errors[result.error] || `❌ Errore durante l'invio della segnalazione.`
            }, { quoted: m });
        }

        if (result.joined) {
            await conn.sendMessage(m.chat, {
                text: `🔓 *Il bot non era nel gruppo staff.*\n➡️ È stato aggiunto automaticamente tramite link.\n\nOra invio la segnalazione…`
            }, { quoted: m });
        }

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
