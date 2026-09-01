//Plugin by Elixir, Punisher & 888 staff
import 'os';
import 'util';
import 'human-readable';
import '@realvare/baileys';
import 'fs';
import 'perf_hooks';

let handler = async (m, { conn, usedPrefix }) => {
  const { welcome, detect } = global.db.data.chats[m.chat];
  let target = m.quoted ? m.quoted.sender 
    : m.mentionedJid && m.mentionedJid[0] 
    ? m.mentionedJid[0] 
    : m.fromMe 
    ? conn.user.jid 
    : m.sender;

  const pfp = (await conn.profilePictureUrl(target, "image").catch(_ => null)) || "./src/avatar_contact.png";

  // FOTO PROFILO + FALLBACK
  let avatar;
  try {
    avatar = await (await fetch(pfp)).buffer();
  } catch {
    avatar = await (await fetch("https://i.postimg.cc/3JwB9YkX/default-avatar.png")).buffer();
  }

  // THUMBNAIL MENU RPG + FALLBACK
  let thumbnail;
  try {
    thumbnail = await (await fetch("https://qu.ax/JKCXP.jpg")).buffer();
  } catch {
    thumbnail = await (await fetch("https://i.postimg.cc/3JwB9YkX/menu-rpg.jpg")).buffer();
  }

  let fakeQuoted = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "Halo"
    },
    message: {
      locationMessage: {
        name: "🎰 MENU RPG 888",
        jpegThumbnail: thumbnail
      }
    },
    participant: "0@s.whatsapp.net"
  };

  let menu = 
`╭━━━〔 🎰 *MENU RPG* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Categoria:* Minigiochi & Economia
┃━━━━━━━━━━━━━━━━━━
┃ 🪙 *Giochi e Fortuna:*
┃  ⮕ ${usedPrefix}sorte
┃  ⮕ ${usedPrefix}slot
┃  ⮕ ${usedPrefix}roulette
┃  ⮕ ${usedPrefix}ruota
┃  ⮕ ${usedPrefix}casino
┃ 
┃ 💰 *Economia & Banca:*
┃  ⮕ ${usedPrefix}portafoglio
┃  ⮕ ${usedPrefix}paghetta
┃  ⮕ ${usedPrefix}deposita
┃  ⮕ ${usedPrefix}preleva
┃  ⮕ ${usedPrefix}bonifico
┃  ⮕ ${usedPrefix}iban
┃ 
┃ ⚔️ *Azioni & Crimini:*
┃  ⮕ ${usedPrefix}ruba
┃  ⮕ ${usedPrefix}rapina
┃  ⮕ ${usedPrefix}spara
┃  ⮕ ${usedPrefix}duello
┃  ⮕ ${usedPrefix}colpo
┃ 
┃ 💼 *Lavoro & Commercio:*
┃  ⮕ ${usedPrefix}lavora
┃  ⮕ ${usedPrefix}prostituta
┃  ⮕ ${usedPrefix}compra
┃  ⮕ ${usedPrefix}vendi
┃  ⮕ ${usedPrefix}magazzino
┃  ⮕ ${usedPrefix}negozio
┃  ⮕ ${usedPrefix}asta
┃  ⮕ ${usedPrefix}posizione
┃ 
┃ 🏆 *Classifiche & Quiz:*
┃  ⮕ ${usedPrefix}calcioscommesse
┃  ⮕ ${usedPrefix}premiotop
┃  ⮕ ${usedPrefix}quiz
┃  ⮕ ${usedPrefix}rank (@user)
┃  ⮕ ${usedPrefix}topranks
╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici, 
> utilizza il comando *${usedPrefix}segnala*.`.trim();

  conn.sendMessage(m.chat, { text: menu }, { quoted: fakeQuoted });
};

handler.help = ["menu"];
handler.tags = ["menu"];
handler.command = /^(rpg)$/i;

export default handler;

