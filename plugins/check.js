// Plugin by Elixir, Punisher & 888 staff
import { createCanvas, loadImage } from 'canvas';

let handler = async (m, { conn, text }) => {
  try {
    console.log(`[check] Avvio scan per utente: ${m.sender}`)

    let who;
    let targetMsg = m;

    if (text) {
      let cleanedText = text.replace(/[@\s+-]/g, '')
      let number = cleanedText
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

    const tagUtente = who.replace(/@.+/, '');
    const userName = await conn.getName(who) || tagUtente;

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

    console.log(`[check] Target: ${who}, Device: ${device}, MsgType: ${msgType}`)

    let loadingMsg = await conn.sendMessage(m.chat, { 
      text: '⚡ `⚡ [𝟴𝟴𝟴 𝗕𝗢𝗧] Estrazione pacchetti dati e analisi hardware...` ⚡' 
    }, { quoted: m });

    let ppUrl;
    try {
      ppUrl = await conn.profilePictureUrl(who, 'image');
    } catch {
      ppUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Portrait_Placeholder.png/240px-Portrait_Placeholder.png'; 
    }

    const canvas = createCanvas(950, 480);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f111a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(0, 0, 15, canvas.height);
    
    let avatar;
    try {
      avatar = await loadImage(ppUrl);
    } catch {
      avatar = null;
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(160, 150, 80, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    if (avatar) {
      ctx.drawImage(avatar, 80, 70, 160, 160);
    } else {
      ctx.fillStyle = '#3f475f';
      ctx.fill();
    }
    ctx.restore();

    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(160, 150, 82, 0, Math.PI * 2, true);
    ctx.stroke();

    ctx.textBaseline = 'top';

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px Arial, Verdana, Helvetica, sans-serif';
    const displayName = userName.length > 22 ? userName.substring(0, 22) + '...' : userName;
    ctx.fillText(displayName, 280, 65);

    ctx.fillStyle = '#8f9cae';
    ctx.font = '20px Arial, Verdana, Helvetica, sans-serif';
    ctx.fillText(`JID: ${who}`, 280, 115);

    ctx.fillStyle = '#3f475f';
    ctx.fillRect(280, 155, 620, 1);

    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 14px Arial, Verdana, Helvetica, sans-serif';
    ctx.fillText('OS HARDWARE RILEVATO', 280, 175);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 26px Arial, Verdana, Helvetica, sans-serif';
    ctx.fillText(device, 280, 200);

    ctx.fillStyle = '#3f475f';
    ctx.fillRect(280, 250, 620, 1);

    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 14px Arial, Verdana, Helvetica, sans-serif';
    ctx.fillText('METADATI PACCHETTO DI RETE', 280, 270);

    ctx.fillStyle = '#8f9cae';
    ctx.font = '18px Arial, Verdana, Helvetica, sans-serif';
    ctx.fillText(`ID Messaggio: ${msgID}`, 280, 295);
    ctx.fillText(`Tipo Payload: ${msgType}`, 280, 325);
    ctx.fillText(`Dimensione Buffer: ${msgLength} bytes`, 280, 355);
    ctx.fillText(`Ora Esatta Ricezione: ${formattedTime}`, 280, 385);

    const buffer = canvas.toBuffer();
    
    console.log(`[check] Report grafico generato per ${tagUtente}`)

    let reportDidascalia = `╭━━━〔 🎰 *SCANNER DEVICE* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Categoria:* Utility & Controllo
┃━━━━━━━━━━━━━━━━━━
┃ 🔍 *Risultati Rilevamento:*
┃ ⮕ *Target:* @${tagUtente}
┃ ⮕ *Hardware:* \`${device}\`
┃ 
┃ ⚙️ *Stato Analisi:*
┃ ⮕ Completato 100%
┃ ⮕ Stringa ID: \`${msgID || 'N/D'}\`
╰━━━━━━━━━━━━━━━━━━┈`.trim();

    await conn.sendMessage(m.chat, { 
      image: buffer, 
      caption: reportDidascalia,
      mentions: [who]
    }, { quoted: loadingMsg });

  } catch (error) {
    console.error(`[check] Errore critico:`, error)
    m.reply('`[!] Errore durante la generazione del report grafico esteso.`');
  }
};

handler.help = ['check <@tag/numero/reply>', 'device'];  
handler.tags = ['owner'];  
handler.command = /^(check|device)$/i; 
handler.owner = true;

export default handler;
