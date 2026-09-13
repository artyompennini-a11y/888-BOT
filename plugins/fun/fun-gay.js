// Plugin by The Punishe, elixir & 888 staff

let handler = async (m, { conn, command, text }) => {
let target = m.mentionedJid?.[0] 
  || m.quoted?.sender 
  || m.sender

let number = target.split("@")[0]
let width = Math.floor(Math.random() * 101);

let finalPhrase = width >= 30 
    ? "⚠️ *RILEVAMENTO CONFERMATO!*" 
    : "🛡️ *LIVELLI SOTTO LA SOGLIA CRITICA!*";

let message = `
🧠 ⚙️ *SYSTEM SCANNER v2.0* ⚙️ 🧠
══════════════════════════
👤 *Utente:* @${number}
📊 *Analisi:* ${width}% Gay 🏳️‍🌈
══════════════════════════
${finalPhrase}
`.trim();

    m.reply(message, null, { mentions: conn.parseMention(message) });
};

handler.command = /^(gay)$/i;
handler.help = ['gay @tag'];
handler.tags = ['fun'];

export default handler;
