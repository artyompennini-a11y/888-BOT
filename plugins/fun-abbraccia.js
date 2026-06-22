globalThis.abbracciRank = globalThis.abbracciRank || {};

let handler = async (m, { conn }) => {
  let sender = m.sender;
  let target = null;

  if (m.mentionedJid && m.mentionedJid[0]) {
    target = m.mentionedJid[0];
  } else if (m.quoted && m.quoted.sender) {
    target = m.quoted.sender;
  } else {
    return m.reply("Devi menzionare qualcuno a cui vuoi dare un abbraccio! 🤗🫂");
  }

  

  
  const frasi = [
    `@${sender.split("@")[0]} stringe forte @${target.split("@")[0]}! 🤗💞`,
    `Un abbraccio scalda-cuore da @${sender.split("@")[0]} per @${target.split("@")[0]}! ✨💖`,
    `@${sender.split("@")[0]} corre ad abbracciare @${target.split("@")[0]}! 🫂❤️`,
    `Niente è meglio di un abbraccio tra @${sender.split("@")[0]} e @${target.split("@")[0]}! 🥰❣`
  ];

  const fraseRandom = frasi[Math.floor(Math.random() * frasi.length)];
  
  
  if (!globalThis.abbracciRank[target]) globalThis.abbracciRank[target] = 0;
  globalThis.abbracciRank[target] += 1;

  const testoFinale = `✨ *HUG!* ✨\n\n${fraseRandom}\n\n🏆 Abbracci ricevuti da @${target.split("@")[0]}: *${globalThis.abbracciRank[target]}* 🫂`;

  
  await conn.sendMessage(m.chat, {
    text: testoFinale,
    mentions: [sender, target]
  }, { quoted: m });
};

handler.help = ['abbraccia'];
handler.tags = ['giochi'];
handler.command = /^(abbraccia|hug)$/i;
handler.group = true;

export default handler;
