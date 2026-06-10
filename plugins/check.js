let handler = async (m, { conn }) => {
  if (!m.quoted) return m.reply('`[!] ERRORE: Rispondi a un messaggio per analizzare l\'hardware sorgente.`');

  const msgID = m.quoted.id || m.quoted.key?.id;
  const senderJid = m.quoted.sender || 'sconosciuto';
  const tagUtente = senderJid.split('@')[0];

  let device = 'Sconosciuto 🕵️‍♂️';

  if (!msgID) {
    device = '⚠️ IMPOSSIBILE RILEVARE SORGENTE';
  } else if (/^[a-zA-Z]+-[a-fA-F0-9]+$/.test(msgID)) {
    device = '🤖 BOT / EMULATORE';
  } else if (msgID.startsWith('false_') || msgID.startsWith('true_')) {
    device = '💻 WHATSAPP WEB (Standard)';
  } else if (msgID.startsWith('3EB0')) {
    // Gestione unificata e corretta degli ID Baileys/Web/Bot Terminals
    if (/^[A-Z0-9]+$/.test(msgID)) {
      device = '💻 WEB / BOT TERMINAL';
    } else {
      device = '🤖 ANDROID OS (Low Tier / Mod)';
    }
  } else if (msgID.includes(':')) {
    device = '🖥️ DESKTOP CLIENT (Multi-Device)';
  } else if (/^[A-F0-9]{32}$/i.test(msgID)) {
    device = '📱 ANDROID OS (Ufficiale)';
  } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msgID)) {
    device = '🍏 IOS KERNEL (iPhone)';
  } else if (/^[A-Z0-9]{20,25}$/i.test(msgID)) {
    device = '🍏 IOS KERNEL (iPhone - High Tier)';
  } else {
    device = 'Sconosciuto 🕵️‍♂️';
    console.log(`[ANALISI] Nuovo ID rilevato e non indicizzato: ${msgID}`);
  }

  const messaggio = `╔════════════════════════╗
  ⚡ *𝟴𝟴𝟴 𝗕𝗢𝗧 SCANNER* ⚡
╚════════════════════════╝

🔍 *RISULTATI PERQUISIZIONE:*
• 👤 *TARGET:* @${tagUtente}
• 🛠️ *HARDWARE:* \`${device}\`

⏳ _Tracciamento completato. Payload iniettato._`;

  await conn.sendMessage(m.chat, {
    text: messaggio,
    mentions: [senderJid]
  }, { quoted: m });
};

handler.help = ['check', 'device', 'perquisizione'];  
handler.tags = ['giochi'];  
handler.command = /^(check|device|perquisizione|perqisizione)$/i; 
handler.group = true;
handler.admin = true;
handler.botAdmin = false;

export default handler;
