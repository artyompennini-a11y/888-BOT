// Plugin by Elixir & 888 staff
import fs from 'fs';
import path, { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadStaff = () => {
  try {
    return JSON.parse(fs.readFileSync(join(__dirname, '../../data/staff.json'), 'utf8'));
  } catch {
    return [];
  }
};

const inviaTelegram = async (conn, chat, staffData, quoted) => {
  const membri = staffData.filter(m => m.telegram);
  if (membri.length === 0) {
    return conn.sendMessage(chat, { text: '❌ Nessun contatto Telegram disponibile.' }, { quoted });
  }
  const testo = `✈️ *TELEGRAM STAFF*\n\n${membri.map(m => `👤 *${m.nome}* (${m.ruolo})\n✈️ https://t.me/${String(m.telegram).replace(/^@/, '')}`).join('\n\n')}`;
  return conn.sendMessage(chat, { text: testo }, { quoted });
};

const inviaInstagram = async (conn, chat, staffData, quoted) => {
  const membri = staffData.filter(m => m.instagram);
  if (membri.length === 0) {
    return conn.sendMessage(chat, { text: '❌ Nessun contatto Instagram disponibile.' }, { quoted });
  }
  const testo = `📸 *INSTAGRAM STAFF*\n\n${membri.map(m => `👤 *${m.nome}* (${m.ruolo})\n📸 https://instagram.com/${String(m.instagram).replace(/^@/, '')}`).join('\n\n')}`;
  return conn.sendMessage(chat, { text: testo }, { quoted });
};

const inviaListaContatti = async (conn, chat, staffData, quoted) => {
  if (!staffData || staffData.length === 0) {
    return conn.sendMessage(chat, { text: '❌ Nessun membro dello staff trovato.' }, { quoted });
  }
  const contatti = staffData.filter(m => m.telefono).map(m => [
    String(m.telefono).replace(/\D/g, ''),
    `${m.nome} • ${m.ruolo}`
  ]);
  if (contatti.length === 0) {
    return conn.sendMessage(chat, { text: '❌ Nessun contatto WhatsApp disponibile.' }, { quoted });
  }
  await conn.sendContact(chat, contatti, quoted);
};

let handler = async (m, { conn, usedPrefix, text, isOwner, isAdmin }) => {
  if (m.isGroup && !isOwner && !isAdmin) {
    return m.reply('❌ Questo comando può essere usato solo da un amministratore del gruppo.');
  }

  const staffData = loadStaff();
  
  const lowerText = String(text || '').toLowerCase();
  
  if (lowerText.includes('tg') || lowerText.includes('telegram')) {
    return inviaTelegram(conn, m.chat, staffData, m);
  }
  if (lowerText.includes('ig') || lowerText.includes('instagram')) {
    return inviaInstagram(conn, m.chat, staffData, m);
  }
  if (lowerText.includes('lista') || lowerText.includes('team') || lowerText === 'staff') {
    return inviaListaContatti(conn, m.chat, staffData, m);
  }

  let imageBuffer;
  try {
    imageBuffer = fs.readFileSync('./media/888.jpeg.jpeg');
  } catch {
    const fetch = (await import('node-fetch')).default;
    imageBuffer = await (await fetch('https://telegra.ph/file/22b3e3d2a7b9f346e21b3.png')).buffer();
  }

  const botName = global.db?.data?.nomedelbot || global.nomebot || "𝟴𝟴𝟴 𝗕𝗢𝗧";
  const botVersion = global.versione || global.db?.data?.version || "1.1";

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: 'STAFF'
    },
    message: {
      contactMessage: {
        displayName: `Staff`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: "0@s.whatsapp.net"
  };

  const menuText = `
⚡ *TEAM ${botName.toUpperCase()}*
*VERSIONE*: ${botVersion}

📂 *Usa i pulsanti sotto per vedere i contatti dello staff.*\n`.trim();

  const contattiTelegram = staffData.filter(m => m.telegram).length;
  const contattiInstagram = staffData.filter(m => m.instagram).length;

  const buttonParamsJson = JSON.stringify({
    title: "Staff 888",
    sections: [
      {
        title: "📁 Contatti Staff",
        highlight_label: "888",
        rows: [
          { id: `${usedPrefix}staff tg`, title: "✈️ Telegram", description: contattiTelegram > 0 ? `${contattiTelegram} contatti` : "Nessuno" },
          { id: `${usedPrefix}staff ig`, title: "📸 Instagram", description: contattiInstagram > 0 ? `${contattiInstagram} profili` : "Nessuno" },
          { id: `${usedPrefix}staff lista`, title: "👥 WhatsApp", description: staffData.length > 0 ? `${staffData.filter(m => m.telefono).length} contatti` : "Nessuno" }
        ]
      }
    ]
  });

  await conn.sendMessage(m.chat, {
    image: imageBuffer,
    caption: menuText,
    footer: "",
    headerType: 4,
    interactiveButtons: [
      {
        name: "single_select",
        buttonParamsJson
      }
    ]
  }, { quoted: fake });

  m.react('👑');
}

handler.help = ['staff', 'team'];
handler.tags = ['main'];
handler.command = ['staff', 'team'];

export default handler
