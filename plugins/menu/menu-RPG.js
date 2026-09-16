//Plugin by Elixir, Punisher & 888 staff
import fetch from 'node-fetch';

let handler = async (m, { conn, usedPrefix }) => {
  const target = m.quoted?.sender 
    || m.mentionedJid?.[0] 
    || (m.fromMe ? conn.user.jid : m.sender);

  const pfp = (await conn.profilePictureUrl(target, "image").catch(_ => null)) 
    || "https://i.postimg.cc/3JwB9YkX/default-avatar.png";

  let avatar;
  try {
    avatar = await (await fetch(pfp)).buffer();
  } catch {
    avatar = await (await fetch("https://i.postimg.cc/3JwB9YkX/default-avatar.png")).buffer();
  }

  let thumbnail;
  try {
    thumbnail = await (await fetch("https://qu.ax/JKCXP.jpg")).buffer();
  } catch {
    thumbnail = await (await fetch("https://i.postimg.cc/3JwB9YkX/menu-rpg.jpg")).buffer();
  }

  const fakeQuoted = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "MENU_RPG"
    },
    message: {
      locationMessage: {
        name: "🎰 MENU RPG 888",
        jpegThumbnail: thumbnail
      }
    },
    participant: "0@s.whatsapp.net"
  };

  const menu = `
🎰 *MENU RPG 888*
Categoria: Minigiochi & Economia

🪙 *Giochi e Fortuna*
• ${usedPrefix}sorte
• ${usedPrefix}slot
• ${usedPrefix}roulette
• ${usedPrefix}ruota
• ${usedPrefix}casino

💰 *Economia & Banca*
• ${usedPrefix}portafoglio
• ${usedPrefix}paghetta
• ${usedPrefix}deposita
• ${usedPrefix}preleva
• ${usedPrefix}bonifico
• ${usedPrefix}iban

⚔️ *Azioni & Crimini*
• ${usedPrefix}ruba
• ${usedPrefix}rapina
• ${usedPrefix}duello
• ${usedPrefix}colpo

💼 *Lavoro & Commercio*
• ${usedPrefix}lavora
• ${usedPrefix}prostituta
• ${usedPrefix}compra
• ${usedPrefix}vendi
• ${usedPrefix}magazzino
• ${usedPrefix}negozio
• ${usedPrefix}asta
• ${usedPrefix}profilo

🏆 *Classifiche & Quiz*
• ${usedPrefix}calcioscommesse
• ${usedPrefix}premiotop
• ${usedPrefix}quiz
• ${usedPrefix}rank (@user)
• ${usedPrefix}topranks

━━━━━━━━━━━━━━━━━━━━━━
⚠️ In caso di bug usa: *${usedPrefix}segnala*
`.trim();

  conn.sendMessage(m.chat, { text: menu }, { quoted: fakeQuoted });
};

handler.help = ["rpg"];
handler.tags = ["menu"];
handler.command = /^(rpg)$/i;

export default handler;