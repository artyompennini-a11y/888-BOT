let handler = async (m, { conn }) => {
    const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null;

    // ───────────────────────────────
    // 🔥 NESSUN UTENTE — STILE 888
    // ───────────────────────────────
    if (!who) return m.reply(
`╭━━━〔 ⚠️ *ERRORE* 〕━━━┈
┃ Devi menzionare l’utente
┃ a cui rimuovere il warn link.
╰━━━━━━━━━━━━━━━━━━┈`
    );

    if (!global.db.data.users[who])
        return m.reply(
`╭━━━〔 ❌ *UTENTE NON TROVATO* 〕━━━┈
┃ L’utente non esiste nel database.
╰━━━━━━━━━━━━━━━━━━┈`
        );

    const warnIg = global.db.data.users[who].warnIg || 0;
    const warnTiktok = global.db.data.users[who].warnTiktok || 0;

    // ───────────────────────────────
    // 🔥 NESSUN WARN — STILE 888
    // ───────────────────────────────
    if (warnIg === 0 && warnTiktok === 0) {
        return m.reply(
`╭━━━〔 ℹ️ *NESSUN WARN* 〕━━━┈
┃ @${who.split('@')[0]} non ha warn
┃ da rimuovere.
╰━━━━━━━━━━━━━━━━━━┈`,
            null,
            { mentions: [who] }
        );
    }

    // ───────────────────────────────
    // 🔥 RIMOZIONE WARN — STILE 888
    // ───────────────────────────────
    if (warnIg > 0) global.db.data.users[who].warnIg--;
    if (warnTiktok > 0) global.db.data.users[who].warnTiktok--;

    const newIg = global.db.data.users[who].warnIg || 0;
    const newTt = global.db.data.users[who].warnTiktok || 0;

    await m.reply(
`╭━━━〔 ✅ *WARN RIMOSSO* 〕━━━┈
┃ È stato rimosso 1 warn a
┃ @${who.split('@')[0]}
┃━━━━━━━━━━━━━━━━━━
┃ 📊 *Warn attuali:*
┃ • Instagram: ${newIg} / 3
┃ • TikTok: ${newTt} / 3
╰━━━━━━━━━━━━━━━━━━┈`,
        null,
        { mentions: [who] }
    );
};

handler.command = ['unwarnlink'];
handler.tags = ['admin'];
handler.help = ['unwarnlink @utente'];
handler.admin = true;
handler.botAdmin = true;

export default handler;