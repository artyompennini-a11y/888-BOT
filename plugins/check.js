// Plugin by Elixir, Punisher & 888 staff
let handler = async (m, { conn, text }) => {
  try {
    console.log(`[check] Avvio scan per utente: ${m.sender}`);

    let who;
    let targetMsg = m;

    if (text) {
      let cleanedText = text.replace(/[@\s+-]/g, '');
      let number = cleanedText;
      if (!isNaN(number) && number.length >= 7 && number.length <= 15) {
        who = number + '@s.whatsapp.net';
        targetMsg = null;
      } else if (m.mentionedJid && m.mentionedJid[0]) {
        who = m.mentionedJid[0];
      }
    } else if (m.quoted) {
      who = m.quoted.sender;
      targetMsg = m.quoted;
    } else {
      who = m.sender;
    }

    if (!who) who = m.sender;

    const tagUtente = who.replace(/@.+/, '');
    const userName = (await conn.getName(who)) || tagUtente;

    let device = 'Sconosciuto 🕵️‍♂️';
    let msgID = 'N/D';
    let msgType = 'N/D';
    let msgLength = 0;
    let formattedTime = 'N/D';

    if (targetMsg) {
      const rawMsg = targetMsg.vM || targetMsg;
      msgID = targetMsg.id || rawMsg.key?.id || 'N/D';

      if (msgID !== 'N/D') {
        if (/^[a-zA-Z]+-[a-fA-F0-9]+$/.test(msgID)) {
          device = '🤖 BOT_EMULATOR';
        } else if (msgID.startsWith('false_') || msgID.startsWith('true_')) {
          device = '💻 WHATSAPP_WEB';
        } else if (msgID.startsWith('3EB0') && msgID.length > 12) {
          device = '💻 WEB/BOT_TERMINAL';
        } else if (msgID.startsWith('3EB0')) {
          device = '🤖 ANDROID_OS (Low Tier)';
        } else if (msgID.includes(':')) {
          device = '🖥️ DESKTOP_CLIENT';
        } else if (/^[A-F0-9]{32}$/i.test(msgID)) {
          device = '📱 ANDROID_OS';
        } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msgID)) {
          device = '🍏 IOS_KERNEL (iPhone)';
        } else if (/^[A-Z0-9]{20,25}$/i.test(msgID)) {
          device = '🍏 IOS_KERNEL (iPhone - High Tier)';
        }
      }

      msgType = 'Testo 📝';
      if (rawMsg.imageMessage) msgType = 'Immagine 🖼️';
      else if (rawMsg.videoMessage) msgType = 'Video 🎥';
      else if (rawMsg.audioMessage) msgType = 'Audio/Nota Vocale 🎵';
      else if (rawMsg.documentMessage) msgType = 'Documento/File 📄';
      else if (rawMsg.stickerMessage) msgType = 'Sticker 🎨';
      else if (rawMsg.contactMessage || rawMsg.contactsArrayMessage) msgType = 'Contatto VCard 📇';
      else if (rawMsg.locationMessage) msgType = 'Posizione GPS 📍';
      else if (rawMsg.pollCreationMessage || rawMsg.pollCreationMessageV2) msgType = 'Sondaggio 📊';
      else if (rawMsg.reactionMessage) msgType = 'Reazione Emoji ❤️';

      msgLength = targetMsg.text?.length || targetMsg.caption?.length || JSON.stringify(rawMsg).length || 0;

      const timestamp = targetMsg.timestamp || rawMsg.messageTimestamp;
      if (timestamp) {
        const date = new Date(timestamp * 1000);
        formattedTime = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    }

    let reportDidascalia = `╭━━━〔 🎰 *SCANNER DEVICE* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Categoria:* Utility & Controllo
┃━━━━━━━━━━━━━━━━━━
┃ 👤 *Info Utente:*
┃ ⮕ *Nome:* ${userName}
┃ ⮕ *Target:* @${tagUtente}
┃ 
┃ 💻 *OS Hardware Rilevato:*
┃ ⮕ *Dispositivo:* \`${device}\`
┃ 
┃ 📦 *Metadati Pacchetto:*
┃ ⮕ *ID Messaggio:* \`${msgID}\`
┃ ⮕ *Tipo Payload:* ${msgType}
┃ ⮕ *Dimensione Buffer:* ${msgLength} bytes
┃ ⮕ *Ora Ricezione:* ${formattedTime}
┃ 
┃ ⚙️ *Stato Analisi:*
┃ ⮕ Completato 100%
╰━━━━━━━━━━━━━━━━━━┈`.trim();

    await conn.sendMessage(m.chat, { 
      text: reportDidascalia,
      mentions: [who]
    }, { quoted: m });

  } catch (error) {
    console.error(`[check] Errore critico:`, error);
    m.reply('`[!] Errore durante l\'estrazione dei dati.`');
  }
};

handler.help = ['check', 'device'];  
handler.tags = ['tools'];  
handler.command = /^(check|device)$/i; 
handler.owner = false;

export default handler;