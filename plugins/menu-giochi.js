import 'os';
import 'util';
import 'human-readable';
import '@realvare/baileys';
import 'fs';
import 'perf_hooks';

let handler = async (m, { conn, usedPrefix: prefix }) => {
  const { welcome, detect } = global.db.data.chats[m.chat] || {};

 
  let target = m.quoted
    ? m.quoted.sender
    : m.mentionedJid && m.mentionedJid[0]
    ? m.mentionedJid[0]
    : m.fromMe
    ? conn.user.jid
    : m.sender;

  
  const profilePicUrl =
    (await conn.profilePictureUrl(target, "image").catch(() => null)) ||
    "./src/avatar_contact.png";

  let profileBuffer;
  try {
    if (profilePicUrl !== "./src/avatar_contact.png") {
      profileBuffer = await (await fetch(profilePicUrl)).buffer();
    } else {
      profileBuffer = await (
        await fetch("https://i.postimg.cc/3JwB9YkX/default-avatar.png")
      ).buffer();
    }
  } catch {
    profileBuffer = await (
      await fetch("https://i.postimg.cc/3JwB9YkX/default-avatar.png")
    ).buffer();
  }

  
  let thumbBuffer;
  try {
    thumbBuffer = await (
      await fetch("https://i.postimg.cc/3JwB9YkX/menu-giochi.jpg")
    ).buffer();
  } catch {
    thumbBuffer = await (
      await fetch("https://i.postimg.cc/3JwB9YkX/menu-giochi.jpg")
    ).buffer();
  }

  
  let fakeLocation = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "Halo",
    },
    message: {
      locationMessage: {
        name: "🎮 MENU GIOCHI 888",
        jpegThumbnail: thumbBuffer,
      },
    },
    participant: "0@s.whatsapp.net",
  };

  
  let menuText = 
`╭━━━〔 🎮 *MENU GIOCHI* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Intrattenimento e Funzioni Community*
┃━━━━━━━━━━━━━━━━━━
┃ ♟️ *GIOCHI DA TAVOLO:*
┃  ⮕ ${prefix}scacchi
┃  ⮕ ${prefix}startblast
┃  ⮕ ${prefix}trivia
┃  ⮕ ${prefix}indovina
┃  ⮕ ${prefix}indovinamedio
┃  ⮕ ${prefix}indovinadifficile
┃  ⮕ ${prefix}toptrivia
┃ 🧩 *FUNNY:*
┃  ⮕ ${prefix}impiccato
┃  ⮕ ${prefix}tris
┃  ⮕ ${prefix}uno
┃  ⮕ ${prefix}bandiera
┃  ⮕ ${prefix}mascotte
┃  ⮕ ${prefix}labirinto
┃  ⮕ ${prefix}bomba
┃  ⮕ ${prefix}scf
┃  ⮕ ${prefix}scramble
┃  ⮕ ${prefix}basket
┃  ⮕ ${prefix}rigore
┃  ⮕ ${prefix}screenshot
┃  ⮕ ${prefix}screenshotgp
┃  ⮕ ${prefix}canta
┃ 
┃ 🔞 *HARD (INTERATTIVI):*
┃  ⮕ ${prefix}lesbica
┃  ⮕ ${prefix}frocio
┃  ⮕ ${prefix}gay
┃  ⮕ ${prefix}puttana
┃  ⮕ ${prefix}porca
┃  ⮕ ${prefix}porco
┃  ⮕ ${prefix}alcolizzato
┃  ⮕ ${prefix}negro
┃  ⮕ ${prefix}sbiro
┃  ⮕ ${prefix}figa
┃  ⮕ ${prefix}pene
┃  ⮕ ${prefix}ditalino
┃  ⮕ ${prefix}sega
┃  ⮕ ${prefix}lecca
┃  ⮕ ${prefix}lecco
┃  ⮕ ${prefix}tette
┃  ⮕ ${prefix}bottiglia
┃  ⮕ ${prefix}obbligo
┃  ⮕ ${prefix}verità
┃  ⮕ ${prefix}mordi
┃  ⮕ ${prefix}insulta
┃ 
┃ ❤️ *LOVE:*
┃  ⮕ ${prefix}adotta
┃  ⮕ ${prefix}famiglia
┃  ⮕ ${prefix}sposa
┃  ⮕ ${prefix}bacia
┃  ⮕ ${prefix}abbraccia
┃  ⮕ ${prefix}crush
┃  ⮕ ${prefix}trovafid
┃  ⮕ ${prefix}odio
┃  ⮕ ${prefix}clan
┃ 
┃ 🔧 *STRUMENTI & UTILITY:*
┃  ⮕ ${prefix}removebg
┃  ⮕ ${prefix}calendario
┃  ⮕ ${prefix}screen
┃  ⮕ ${prefix}emojimix
┃  ⮕ ${prefix}setig
┃  ⮕ ${prefix}rimuoviig
┃  ⮕ ${prefix}statsgiornaliere
┃  ⮕ ${prefix}topbestemmie
┃  ⮕ ${prefix}topricchi
┃  ⮕ ${prefix}traduci
┃  ⮕ ${prefix}nota
┃  ⮕ ${prefix}scarica
┃  ⮕ ${prefix}ricetta
┃  ⮕ ${prefix}quiz
┃  ⮕ ${prefix}quizpatente
┃  ⮕ ${prefix}calcioquiz
┃  ⮕ ${prefix}meteo
┃  ⮕ ${prefix}notizie
┃  ⮕ ${prefix}oroscopo
┃  ⮕ ${prefix}urly
┃  ⮕ ${prefix}spotify
┃  ⮕ ${prefix}twitter
┃  ⮕ ${prefix}reddit
┃  ⮕ ${prefix}pinterest
┃ 
┃ 🎲 *RANDOM:*
┃  ⮕ ${prefix}identita
┃  ⮕ ${prefix}telefono
┃  ⮕ ${prefix}fusione
┃  ⮕ ${prefix}dox
┃  ⮕ ${prefix}zizzania
┃  ⮕ ${prefix}barzelletta
┃  ⮕ ${prefix}saluta
┃  ⮕ ${prefix}segreto
┃  ⮕ ${prefix}bonk
╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici,
> usa *${prefix}segnala*.`.trim();

  conn.sendMessage(m.chat, { text: menuText }, { quoted: fakeLocation });
};

handler.help = ["menu"];
handler.tags = ["menu"];
handler.command = /^(giochi)$/i;

export default handler;
