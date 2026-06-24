let handler = async (m, { conn, usedPrefix, command }) => {
  if (!m.isGroup) return m.reply('⚠️ Questo comando funziona solo nei gruppi.');

  let who = m.mentionedJid?.[0] || (m.quoted?.sender);
  if (!who) return m.reply(`🔥 *FLAME*\n\nUsa: ${usedPrefix + command} @utente`);

  const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
  if (who === botNumber) return m.reply('😏 Non puoi flammare me.');

  const victimName = '@' + who.split('@')[0];
  const attackerName = '@' + m.sender.split('@')[0];

  const startMsg = `🔥 *FLAME WAR STARTED* 🔥

👊 Attaccante: ${attackerName}
🎯 Vittima: ${victimName}

⏱️ Durata: 3 minuti`;

  await conn.sendMessage(m.chat, { 
    text: startMsg, 
    mentions: [m.sender, who] 
  }, { quoted: m });

  let flameCount = 0;
  let battleActive = true;

  const flames = [
    `${victimName}, scrivi così lento che i tuoi messaggi arrivano via piccione viaggiatore?`,
    `${victimName}, hai il carisma di un router spento.`,
    `${victimName}, la tua sfiga ha il 5G full signal.`,
    `${victimName}, se la stupidità fosse energia saresti una centrale nucleare.`,
    `${victimName}, il circo ha chiamato: gli manchi solo tu.`,
    `${victimName}, il tuo senso dell'umorismo è morto prima di te.`,
    `${victimName}, anche un sasso conversa meglio di te.`,
    `${victimName}, la tua dignità è in saldo permanente.`,
    `${victimName}, hai più bug tu di Windows Vista.`,
    `${victimName}, sei come una notifica: inutile e fastidioso.`
  ];

  const generateFlame = () => flames[Math.floor(Math.random() * flames.length)];

  const battleHandler = async (chatUpdate) => {
    if (!battleActive) return;
    const msg = chatUpdate.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.participant || msg.key.remoteJid;

    if (sender === who && msg.key.remoteJid === m.chat) {
      flameCount++;
      await new Promise(r => setTimeout(r, 800));
      await conn.sendMessage(m.chat, { 
        text: generateFlame(), 
        mentions: [who] 
      }, { quoted: msg });
    }
  };

  conn.ev.on('messages.upsert', battleHandler);

  setTimeout(() => {
    if (battleActive) conn.sendMessage(m.chat, { 
      text: generateFlame(), 
      mentions: [who] 
    });
  }, 1500);

  setTimeout(async () => {
    if (!battleActive) return;
    battleActive = false;
    conn.ev.off('messages.upsert', battleHandler);

    const endMsg = `⏱️ *FLAME WAR TERMINATA*

🥊 Vittoria del Bot per KO tecnico!
📊 Insulti totali: ${flameCount + 1}

${victimName} hai resistito bene... o no? 👀`;

    await conn.sendMessage(m.chat, { 
      text: endMsg, 
      mentions: [who] 
    });
  }, 180000);
};

handler.help = ['flame'];
handler.tags = ['giochi'];
handler.command = /^(flame)$/i;
handler.group = true;

export default handler;
