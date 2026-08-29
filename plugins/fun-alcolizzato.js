// Plugin by The Punishe, elixir & 888 staff

let handler = async (m, { conn, command, text }) => {
let target = m.mentionedJid?.[0] 
  || m.quoted?.sender 
  || m.sender

let number = target.split("@")[0]
let width = Math.floor(Math.random() * 101);

let finalPhrase = width >= 30 
    ? "⚠️ *ALLERTA SOGLIA SUPERATA!*" 
    : "✅ *LIVELLO NELLA NORMA!*";

let message = `
🧪 🍹 *TEST ALCOLICO v2.0* 🍹 🧪
══════════════════════════
👤 *Utente:* @${number}
📊 *Livello stimato:* ${width}% 🍷
══════════════════════════
${finalPhrase}
`.trim();

    m.reply(message, null, { mentions: conn.parseMention(message) });
};

handler.command = /^(alcolizzato)$/i;
handler.help = ['alcolizzato @tag'];
handler.tags = ['fun'];

export default handler;
