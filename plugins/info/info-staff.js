// Plugin by Elixir & 888 staff
import fetch from 'node-fetch';
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

const formattaMembro = (membro) => {
  const emoji = membro.emoji || '👤';
  const righe = [`${emoji} *${membro.nome}*`, `_${membro.ruolo}_`];
  if (membro.bio) righe.push(`\n${membro.bio}`);
  if (membro.instagram) righe.push(`\n📷 https://instagram.com/${String(membro.instagram).replace(/^@/, '').replace(/^https?:\/\/.*instagram\.com\//i, '').replace(/^www\./i, '')}`);
  if (membro.telegram) righe.push(`\n📞 https://t.me/${String(membro.telegram).replace(/^@/, '')}`);
  return righe.join('\n');
};

const inviaTelegram = async (conn, chat, staffData, quoted) => {
  const membri = staffData.filter(m => m.telegram && String(m.telegram).trim());
  if (membri.length === 0) {
    return conn.sendMessage(chat, { text: '❌ Nessun contatto Telegram disponibile.' }, { quoted });
  }
  const testo = `📞 *TELEGRAM STAFF*\n\n${membri.map(m => `👤 *${m.nome}* (${m.ruolo})\n📞 https://t.me/${String(m.telegram).replace(/^@/, '')}`).join('\n\n')}`;
  return conn.sendMessage(chat, { text: testo }, { quoted });
};

const inviaInstagram = async (conn, chat, staffData, quoted) => {
  const membri = staffData.filter(m => m.instagram && String(m.instagram).trim());
  if (membri.length === 0) {
    return conn.sendMessage(chat, { text: '❌ Nessun contatto Instagram disponibile.' }, { quoted });
  }
  const testo = `📷 *INSTAGRAM STAFF*\n\n${membri.map(m => `👤 *${m.nome}* (${m.ruolo})\n📷 https://instagram.com/${String(m.instagram).replace(/^@/, '').replace(/^https?:\/\/.*instagram\.com\//i, '').replace(/^www\./i, '')}`).join('\n\n')}`;
  return conn.sendMessage(chat, { text: testo }, { quoted });
};

const inviaStaff = async (conn, chat, staffData, quoted) => {
  if (!staffData || staffData.length === 0) {
    return conn.sendMessage(chat, { text: '❌ Nessun membro dello staff trovato.' }, { quoted });
  }
  const testo = `⚡ *TEAM 888*\n\n${staffData.map(formattaMembro).join('\n\n━━━━━━━━━━━━━━━━━━\n\n')}`;
  return conn.sendMessage(chat, { text: testo }, { quoted });
};
let handler = async (m, { conn, usedPrefix, args, text }) => {
  const staffData = loadStaff();
  
  // Invia contenuto se il comando Ã¨ giÃ  stato attivato (da pulsante o da testo)
  const lowerText = String(text || '').toLowerCase();
  
  if (lowerText.includes('tg') || lowerText.includes('telegram')) {
    return inviaTelegram(conn, m.chat, staffData, m);
  }
  if (lowerText.includes('ig') || lowerText.includes('instagram')) {
    return inviaInstagram(conn, m.chat, staffData, m);
  }
  if (lowerText.includes('lista') || lowerText.includes('team') || lowerText === 'staff') {
    return inviaStaff(conn, m.chat, staffData, m);
  }

  // Mostra la tendina
  let imageBuffer;
  try {
    imageBuffer = fs.readFileSync('./media/888.jpeg.jpeg');
  } catch {
    imageBuffer = await (await fetch('https://telegra.ph/file/22b3e3d2a7b9f346e21b3.png')).buffer();
  }

  const botName = global.db?.data?.nomedelbot || global.nomebot || "🤖 888 BOT";
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

📂 *Apri il menu dal pulsante sotto e scegli cosa vedere.*
`.trim();

  const contattiTelegram = staffData.filter(m => m.telegram).length;
  const contattiInstagram = staffData.filter(m => m.instagram).length;

  const buttonParamsJson = JSON.stringify({
    title: "Staff 888",
    sections: [
      {
        title: "📁 Contatti Staff",
        highlight_label: "888",
        rows: [
          { id: `${usedPrefix}staff tg`, title: "📞 Telegram", description: contattiTelegram > 0 ? `${contattiTelegram} contatti disponibili` : "Nessun contatto disponibile" },
          { id: `${usedPrefix}staff ig`, title: "📷 Instagram", description: contattiInstagram > 0 ? `${contattiInstagram} profili disponibili` : "Nessun profilo disponibile" },
          { id: `${usedPrefix}staff lista`, title: "👥 Tutto lo staff", description: staffData.length > 0 ? `${staffData.length} membri del team` : "Nessun membro trovato" }
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

  m.react('📌');
}

handler.help = ['staff', 'team'];
handler.tags = ['main'];
handler.command = ['staff', 'team'];

export default handler
