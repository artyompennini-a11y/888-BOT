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

  // FOTO PROFILO — SEMPRE SAFE
  let profileBuffer;
  try {
    const url = await conn.profilePictureUrl(target, "image");
    profileBuffer = await (await fetch(url)).buffer();
  } catch {
    // fallback sicuro senza file locali
    profileBuffer = Buffer.from([]);
  }

  // THUMBNAIL — SEMPRE SAFE (NO FILE, NO FETCH)
  let thumbBuffer = Buffer.from([]);

  // FAKE LOCATION
  let fakeLocation = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "Halo",
    },
    message: {
      locationMessage: {
        name: "👑 MENU ADMIN 888",
        jpegThumbnail: thumbBuffer,
      },
    },
    participant: "0@s.whatsapp.net",
  };

  // TESTO MENU
  let menuText = 
`╭━━━〔 👑 *MENU ADMIN* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Livello:* Privilegi Amministratore
┃━━━━━━━━━━━━━━━━━━
┃ 👥 *Gestione Utenti:*
┃  ⮕ ${prefix}promuovi / p
┃  ⮕ ${prefix}retrocedi / r
┃  ⮕ ${prefix}kick / puffo / sparisci
┃  ⮕ ${prefix}inattivi
┃  ⮕ ${prefix}invita
┃  ⮕ ${prefix}richieste
┃ 
┃ ⚙️ *Impostazioni Gruppo:*
┃  ⮕ ${prefix}aperto / apri
┃  ⮕ ${prefix}chiuso / chiudi
┃  ⮕ ${prefix}closetime (minuti)
┃  ⮕ ${prefix}setwelcome
┃  ⮕ ${prefix}setbye
┃  ⮕ ${prefix}reimposta
┃  ⮕ ${prefix}nome
┃  ⮕ ${prefix}bio
┃ 
┃ 🛡️ *Controllo & Moderazione:*
┃  ⮕ ${prefix}warn / unwarn
┃  ⮕ ${prefix}unwarnlink
┃  ⮕ ${prefix}muta (@)
┃  ⮕ ${prefix}smuta (@)
┃  ⮕ ${prefix}freezegp
┃  ⮕ ${prefix}addparole
┃  ⮕ ${prefix}listaparole
┃  ⮕ ${prefix}delparole
┃ 
┃ 📢 *Menzioni & Tag:*
┃  ⮕ ${prefix}hidetag / tag
┃  ⮕ ${prefix}tagall
┃  ⮕ ${prefix}admins
┃ 
┃ 🔧 *Strumenti & Utility:*
┃  ⮕ ${prefix}pin
┃  ⮕ ${prefix}unpin
┃  ⮕ ${prefix}clear
┃  ⮕ ${prefix}del
┃  ⮕ ${prefix}s
┃  ⮕ ${prefix}wm
┃  ⮕ ${prefix}pfp @tag
┃ 
┃ 📊 *Info & Sistema:*
┃  ⮕ ${prefix}infogruppo
┃  ⮕ ${prefix}staff
┃  ⮕ ${prefix}ping
┃  ⮕ ${prefix}link / linkqr
┃  ⮕ ${prefix}rules
┃  ⮕ ${prefix}statsgiornaliere
┃  ⮕ ${prefix}riassunto
┃  ⮕ ${prefix}logadmin
┃  ⮕ ${prefix}segnala
┃ 
┃ 🃏 *Fun & Mod:*
┃  ⮕ ${prefix}addmod @user
┃  ⮕ ${prefix}delmod @user
┃  ⮕ ${prefix}mods
┃  ⮕ ${prefix}arresta
┃  ⮕ ${prefix}giuria
┃  ⮕ ${prefix}simula
┃  ⮕ ${prefix}nuke
┃  ⮕ ${prefix}ds
╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici,
> usa *${prefix}segnala*.`.trim();

  conn.sendMessage(m.chat, { text: menuText }, { quoted: fakeLocation });
};

handler.help = ["menu"];
handler.tags = ["menu"];
handler.command = /^(admin)$/i;

export default handler;

