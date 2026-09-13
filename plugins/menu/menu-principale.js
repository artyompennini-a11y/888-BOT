import fetch from 'node-fetch';
import fs from 'fs';

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

  const buttonParamsJson = JSON.stringify({
    title: "Menu 888",
    sections: [
      {
        title: "📁 Menu Completo",
        highlight_label: "888",
        rows: [
          { id: `${usedPrefix}funzioni`, title: "⚙️ Funzioni", description: "Comandi generali" },
          { id: `${usedPrefix}admin`, title: "👑 Admin", description: "Gestione gruppi" },
          { id: `${usedPrefix}giochi`, title: "🎮 Giochi", description: "Divertimento" },
          { id: `${usedPrefix}rpg`, title: "🎰 RPG", description: "Sistema RPG" },
          { id: `${usedPrefix}menuaudio`, title: "🎵 Audio", description: "Effetti e suoni" },
          { id: `${usedPrefix}owner`, title: "🔐 Owner", description: "Comandi proprietario" }
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
};

handler.help = ["menu"];
handler.tags = ['menu'];
handler.command = /^(menu|comandi)$/i;

export default handler;