//Plugin by Elixir & 888 staff
import fetch from 'node-fetch';

let handler = async (m, { conn, args }) => {
    try {
        if (!args[0]) {
            return conn.reply(m.chat, `Uso: .checkscam <url>\n\nEsempio: .checkscam https://example.com`, m);
        }

        let sito = args[0].replace(/https?:\/\//, "").replace("www.", "").split("/")[0];

        let googleResponse = await fetch(`https://transparencyreport.google.com/safe-browsing/search?url=${sito}`);
        let isScam = googleResponse.status !== 200;

        let messaggio = `⧉ *888 BOT - Verifica Sicurezza*\n\n`;
        messaggio += `🌐 *Dominio:* ${sito}\n\n`;
        messaggio += isScam ? "⚠️ *RISCHIO SCAM!* 🚫" : "✅ *Sito Sicuro!*";
        messaggio += `\n\n📌 *Verifica anche su:* scamadviser.com`;

        await conn.sendMessage(m.chat, { text: messaggio }, { quoted: m });

    } catch (err) {
        console.error(err);
        await conn.reply(m.chat, "⛔ *Errore nel controllo del sito. Riprova più tardi.*", m);
    }
};

handler.command = /^(checkscam|scamcheck)$/i;
handler.admin = true;

export default handler;
