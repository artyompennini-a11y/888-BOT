//Plugin by Elixir, Punisher & 888 staff

let handler = async (m, { conn, command, text }) => {
let target = m.mentionedJid?.[0] 
  || m.quoted?.sender 
  || m.sender

let number = target.split("@")[0]
    let message = `
📏⚡ *CALCOLIAMO I TUOI CENTIMETRI* ⚡📏
══════════════════════════
🧑 *Soggetto:* @${number}
📐 *Lunghezza stimata:* *${Math.floor(Math.random() * 101)}* cm
🤏 *Valutazione:* ${Math.floor(Math.random() * 101) >= 15 ? 'Una bella misura! 😎' : 'Mi dispiace... 💀'}
══════════════════════════
> 𝟴𝟴𝟴 𝗕𝗢𝗧
`.trim();

    m.reply(message, null, { mentions: conn.parseMention(message) });
};

handler.help = ['𝐩𝐞𝐧𝐞 @𝐭𝐚𝐠'];
handler.tags = ['fun'];
handler.command = /^(pene)$/i;

export default handler;

