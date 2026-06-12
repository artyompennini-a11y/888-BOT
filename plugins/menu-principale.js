import fetch from 'node-fetch';

let handler = async (m, { conn, usedPrefix }) => {
  const senderName = await conn.getName(m.sender);
  const targetJid = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;

  let profilePicBuffer;
  try {
    const url = await conn.profilePictureUrl(targetJid, 'image');
    profilePicBuffer = await (await fetch(url)).buffer();
  } catch {
    profilePicBuffer = await (await fetch('https://telegra.ph/file/22b3e3d2a7b9f346e21b3.png')).buffer();
  }

  const botName = global.db.data.nomedelbot || "𝟴𝟴𝟴 𝗕𝗢𝗧";
  const botVersion = global.db.data.version || "10.0.0";

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: ' 𝟴𝟴𝟴 𝗕𝗢𝗧 MENU'
    },
    message: {
      contactMessage: {
        displayName: `⚡️ Menu Principale`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${targetJid.split('@')[0]}:${targetJid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: '0@s.whatsapp.net'
  }

  const commandList = `
╭━━━〔 ⚡️ *MENU PRINCIPALE* 〕━━━┈
┃ *Bot:* ${botName}
┃ *Versione:* ${botVersion}
┃━━━━━━━━━━━━━━━━━━
┃ ⮕ ${usedPrefix}staff
┃ ⮕ ${usedPrefix}funzioni
┃ ⮕ ${usedPrefix}admin
┃ ⮕ ${usedPrefix}giochi
┃ ⮕ ${usedPrefix}rpg
┃ ⮕ ${usedPrefix}audio
┃ ⮕ ${usedPrefix}owner
╰━━━━━━━━━━━━━━━━━━┈`.trim();

  const buttons = [
    { buttonId: `${usedPrefix}funzioni`, buttonText: { displayText: "⚙️ FUNZIONI" }, type: 1 },
    { buttonId: `${usedPrefix}admin`, buttonText: { displayText: "👑 ADMIN" }, type: 1 },
    { buttonId: `${usedPrefix}giochi`, buttonText: { displayText: "🎮 GIOCHI" }, type: 1 },
    { buttonId: `${usedPrefix}rpg`, buttonText: { displayText: "🎰 RPG" }, type: 1 },
    { buttonId: `${usedPrefix}menuaudio`, buttonText: { displayText: "🎵 AUDIO" }, type: 1 },
    { buttonId: `${usedPrefix}owner`, buttonText: { displayText: "🔐 OWNER" }, type: 1 }
  ];

  await conn.sendMessage(m.chat, {
    text: commandList,
    footer: `💡 Schiaccia il bottone del menu desiderato o digita il relativo comando.`,
    buttons: buttons,
    headerType: 4,
    mentions: [targetJid]
  }, { quoted: fake });
};

handler.help = ["menu"];
handler.tags = ['menu'];
handler.command = /^(menu|comandi)$/i;

export default handler;
