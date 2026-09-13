// Plugin by The Punisher, elixir & 888 staff

let handler = async (m, { conn, command, text }) => {
let target = m.mentionedJid?.[0] 
  || m.quoted?.sender 
  || m.sender

let number = target.split("@")[0]
let width = Math.floor(Math.random() * 101);

let finalPhrase = width >= 50 
    ? "💌 *POTREBBE ESSERE LA TUA ANIMA GEMELLA!*" 
    : "🤔 *FORSE È MEGLIO RESTARE AMICI...*";

let message = `
💘 🌹 *CALCOLATORE AMORE v2.0* 🌹 💘
══════════════════════════
👤 *Crush:* @${number}
📊 *Affinità di coppia:* ${width}% ❤️
══════════════════════════
${finalPhrase}
`.trim();

    m.reply(message, null, { mentions: conn.parseMention(message) });
};

handler.command = /^(crush)$/i;
handler.help = ['crush @tag'];
handler.tags = ['fun'];

export default handler;
