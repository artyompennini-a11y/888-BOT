// Plugin by Elixir & 888 staff
import fetch from 'node-fetch';
import fs from 'fs';
import path, { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let handler = async (m, { conn, usedPrefix }) => {
  const staffData = JSON.parse(fs.readFileSync(join(__dirname, '../../data/staff.json'), 'utf8'));

  let imageBuffer;
  try {
    imageBuffer = fs.readFileSync('./media/888.jpeg.jpeg');
  } catch {
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

📂 *Seleziona un membro dello staff dal menu.*
`.trim();

  // Costruisce le sezioni del menu a tendina
  const sections = [];

  // OWNER
  const owners = staffData.filter(m =>
    m.ruolo && m.ruolo.toLowerCase().includes('owner')
  );

  if (owners.length > 0) {
    sections.push({
      title: "👑 Owner",
      highlight_label: "Owner",
      rows: owners.map(o => ({
        id: o.telefono ? `${o.telefono}` : `staff-${o.nome}`,
        title: `👑 ${o.nome}`,
        description: `${o.ruolo}${o.telefono ? ' • Tocca per contattare' : ''}`
      }))
    });
  }

  // CO-OWNER
  const coOwners = staffData.filter(m =>
    m.ruolo && m.ruolo.toLowerCase().includes('co-owner')
  );

  if (coOwners.length > 0) {
    sections.push({
      title: "🔱 Co-Owner",
      highlight_label: "Co-Owner",
      rows: coOwners.map(co => ({
        id: co.telefono ? `${co.telefono}` : `staff-${co.nome}`,
        title: `🔱 ${co.nome}`,
        description: `${co.ruolo}${co.telefono ? ' • Tocca per contattare' : ''}`
      }))
    });
  }

  // MANAGER
  const managers = staffData.filter(m =>
    m.ruolo && m.ruolo.toLowerCase().includes('manager')
  );

  if (managers.length > 0) {
    sections.push({
      title: "🛡️ Manager",
      highlight_label: "Manager",
      rows: managers.map(mgr => ({
        id: mgr.telefono ? `${mgr.telefono}` : `staff-${mgr.nome}`,
        title: `🛡️ ${mgr.nome}`,
        description: `${mgr.ruolo}${mgr.telefono ? ' • Tocca per contattare' : ''}`
      }))
    });
  }

  // ALTRI MEMBRI DELLO STAFF
  const altri = staffData.filter(m =>
    m.ruolo &&
    !m.ruolo.toLowerCase().includes('owner') &&
    !m.ruolo.toLowerCase().includes('co-owner') &&
    !m.ruolo.toLowerCase().includes('manager')
  );

  if (altri.length > 0) {
    sections.push({
      title: "🌟 Membri Staff",
      highlight_label: "Staff",
      rows: altri.map(a => ({
        id: a.telefono ? `${a.telefono}` : `staff-${a.nome}`,
        title: `🌟 ${a.nome}`,
        description: `${a.ruolo}${a.telefono ? ' • Tocca per contattare' : ''}`
      }))
    });
  }

  const buttonParamsJson = JSON.stringify({
    title: "Staff 888",
    sections: sections
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

