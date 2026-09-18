import fetch from 'node-fetch';
import fs from 'fs';

/**
 * Rileva il sistema operativo del mittente a partire dall'ID del messaggio
 * che ha richiesto il comando.
 *
 * L'ID generato da WhatsApp dipende dalla piattaforma dal quale il messaggio
 * è stato inviato (Android, iOS, Web, Desktop). Questa funzione riutilizza
 * ESATTAMENTE la logica di `plugins/utility/check.js` (funzione
 * `analyzeMessageId`), così il rilevamento è coerente con il resto del bot.
 *
 * NOTA: è un euristica statistico, non un 100% affidabile — WhatsApp potrebbe
 * cambiare i formati in futuro. Per .menu si limita a distinguere Android da
 * iOS, lasciando invariato il comportamento per gli altri casi.
 *
 * @param {string} msgId  ID del messaggio (m.id / m.key.id)
 * @returns {'android'|'ios'|'web'|'desktop'|'bot_emulator'|'unknown'}
 */
function detectDeviceOS(msgId) {
  if (!msgId || typeof msgId !== 'string') return 'unknown';
  if (/^[a-zA-Z]+-[a-fA-F0-9]+$/.test(msgId)) return 'bot_emulator';
  if (msgId.startsWith('false_') || msgId.startsWith('true_')) return 'web';
  if (msgId.startsWith('3EB0') && msgId.length > 12) return 'android';
  if (msgId.startsWith('3EB0')) return 'android';
  if (msgId.includes(':')) return 'desktop';
  if (/^[A-F0-9]{32}$/i.test(msgId)) return 'android';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msgId)) return 'ios';
  if (/^[A-Z0-9]{20,25}$/i.test(msgId)) return 'ios';
  return 'unknown';
}

let handler = async (m, { conn, usedPrefix }) => {
  const targetJid = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;

  let imageBuffer;
  try {
    imageBuffer = fs.readFileSync('./media/888.jpeg.jpeg');
  } catch {
    imageBuffer = await (await fetch('https://telegra.ph/file/22b3e3d2a7b9f346e21b3.png')).buffer();
  }

  const botName = global.db.data.nomedelbot || "𝟴𝟴𝟴 BOT";
  const botVersion = global.db.data.version || "*1.2*";

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: 'MENU'
    },
    message: {
      contactMessage: {
        displayName: `Menu`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${targetJid.split('@')[0]}:${targetJid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: "0@s.whatsapp.net"
  };

  const menuText = `
⚡ *${botName}*
*VERSIONE*: ${botVersion}

📂 *Apri il menu dal pulsante sotto.*
`.trim();

  // Righe del menu: la stessa lista viene mostrata in forma diversa a seconda
  // della piattaforma dell'utente che ha richiesto il comando.
  const rows = [
    { id: `${usedPrefix}funzioni`, title: "⚙️ Funzioni", description: "Comandi generali" },
    { id: `${usedPrefix}admin`, title: "👑 Admin", description: "Gestione gruppi" },
    { id: `${usedPrefix}giochi`, title: "🎮 Giochi", description: "Divertimento" },
    { id: `${usedPrefix}rpg`, title: "🎰 RPG", description: "Sistema RPG" },
    { id: `${usedPrefix}menuaudio`, title: "🎵 Audio", description: "Effetti e suoni" },
    { id: `${usedPrefix}owner`, title: "🔐 Owner", description: "Comandi proprietario" }
  ];

  // Rileva se il mittente usa iOS analizzando l'ID del suo messaggio.
  // Android (e ogni altro caso) conserva la tendina a elenco, iOS mostra i
  // pulsanti separati.
  const isIOS = detectDeviceOS(m.id) === 'ios';

  const interactiveButtons = isIOS
    ? rows.map(row => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({ display_text: row.title, id: row.id })
      }))
    : [
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: "Menu 888",
            sections: [
              {
                title: "📁 Menu Completo",
                highlight_label: "888",
                rows
              }
            ]
          })
        }
      ];

  await conn.sendMessage(m.chat, {
    image: imageBuffer,
    caption: menuText,
    footer: "",
    headerType: 4,
    interactiveButtons
  }, { quoted: fake });
};

handler.help = ["menu"];
handler.tags = ['menu'];
handler.command = /^(menu|comandi)$/i;

export default handler;
