import 'os';
import 'util';
import 'human-readable';
import '@realvare/baileys';
import 'fs';
import 'perf_hooks';

let handler = async (m, { conn, usedPrefix: prefix }) => {
  const { welcome, detect } = global.db.data.chats[m.chat] || {};

  // TARGET UTENTE
  let target = m.quoted
    ? m.quoted.sender
    : m.mentionedJid && m.mentionedJid[0]
    ? m.mentionedJid[0]
    : m.fromMe
    ? conn.user.jid
    : m.sender;

  // FOTO PROFILO + FALLBACK
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

  // THUMBNAIL MENU AUDIO + FALLBACK
  let thumbBuffer;
  try {
    thumbBuffer = await (
      await fetch("https://i.postimg.cc/3JwB9YkX/menu-audio.jpg")
    ).buffer();
  } catch {
    thumbBuffer = await (
      await fetch("https://i.postimg.cc/3JwB9YkX/menu-audio.jpg")
    ).buffer();
  }

  // FAKE LOCATION
  let fakeLocation = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "Halo",
    },
    message: {
      locationMessage: {
        name: "🎵 MENU AUDIO 888",
        jpegThumbnail: thumbBuffer,
      },
    },
    participant: "0@s.whatsapp.net",
  };

  // TESTO MENU
  let menuText = 
`╭━━━〔 🎵 *MENU AUDIO* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Funzione:* Modificatori Vocali ed Effetti
┃━━━━━━━━━━━━━━━━━━
┃ 🔍 *Download & Ricerca:*
┃  ⮕ ${prefix}play
┃  ⮕ ${prefix}playlist
┃  ⮕ ${prefix}audio (testo)
┃ 
┃ ⚡ *Velocità & Struttura:*
┃  ⮕ ${prefix}fast
┃  ⮕ ${prefix}slow
┃  ⮕ ${prefix}reverse
┃  ⮕ ${prefix}smooth
┃  ⮕ ${prefix}nightcore
┃ 
┃ 🎛️ *Tonalità & Filtri:*
┃  ⮕ ${prefix}bass
┃  ⮕ ${prefix}deep
┃  ⮕ ${prefix}fat
┃  ⮕ ${prefix}chipmunk
┃  ⮕ ${prefix}chip
┃  ⮕ ${prefix}robot
┃ 
┃ 🔊 *Ambiente & Spazio:*
┃  ⮕ ${prefix}cur
┃  ⮕ ${prefix}echo
┃  ⮕ ${prefix}vibrato
┃  ⮕ ${prefix}reverb
┃ 
┃ 💥 *Distorsione & Overdrive:*
┃  ⮕ ${prefix}blown
┃  ⮕ ${prefix}earrape
┃  ⮕ ${prefix}distort
╰━━━━━━━━━━━━━━━━━━┈
> 💡 *Istruzioni:* Rispondi a un messaggio 
> vocale o a un file audio inserendo il comando 
> dell'effetto che desideri applicare.`.trim();

  conn.sendMessage(m.chat, { text: menuText }, { quoted: fakeLocation });
};

handler.help = ["menu"];
handler.tags = ["menu"];
handler.command = /^(menuaudio)$/i;

export default handler;

