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
      await fetch("https://i.postimg.cc/3JwB9YkX/menu-owner.jpg")
    ).buffer();
  } catch {
    thumbBuffer = await (
      await fetch("https://i.postimg.cc/3JwB9YkX/menu-owner.jpg")
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
        name: "🔐 MENU OWNER 888",
        jpegThumbnail: thumbBuffer,
      },
    },
    participant: "0@s.whatsapp.net",
  };

  
  let menuText = 
`╭━━━〔 🔐 *MENU OWNER* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Livello:* Sviluppatore / Creatore Core
┃━━━━━━━━━━━━━━━━━━
┃ ⚙️ *Gestione Bot & Credenziali:*
┃  ⮕ ${prefix}impostanome
┃  ⮕ ${prefix}resettanome
┃  ⮕ ${prefix}addowner
┃  ⮕ ${prefix}delowner
┃  ⮕ ${prefix}addperms
┃  ⮕ ${prefix}setppbot
┃  ⮕ ${prefix}prefisso
┃  ⮕ ${prefix}resettaprefisso
┃ 
┃ 🛡️ *Sicurezza & Protezione:*
┃  ⮕ ${prefix}antinuke
┃  ⮕ ${prefix}banchat
┃  ⮕ ${prefix}banuser (@)
┃  ⮕ ${prefix}unbanuser (@)
┃  ⮕ ${prefix}block (@)
┃  ⮕ ${prefix}unblock (@)
┃  ⮕ ${prefix}banlist
┃  ⮕ ${prefix}listamuti
┃  ⮕ ${prefix}delprem
┃ 
┃ 💻 *Gestione Sviluppo & Plugin:*
┃  ⮕ ${prefix}getfile
┃  ⮕ ${prefix}saveplugin
┃  ⮕ ${prefix}getplugin
┃  ⮕ ${prefix}editplugin
┃  ⮕ ${prefix}listpl
┃  ⮕ ${prefix}disablepl
┃  ⮕ ${prefix}enablepl
┃  ⮕ ${prefix}dp (plugin)
┃  ⮕ ${prefix}codifica
┃  ⮕ ${prefix}offusca
┃ 
┃ 🚪 *Controllo Gruppi & Spostamenti:*
┃  ⮕ ${prefix}hidetagall
┃  ⮕ ${prefix}ispeziona <link gruppo>
┃  ⮕ ${prefix}join (link gruppo)
┃  ⮕ ${prefix}gruppi
┃  ⮕ ${prefix}adminall
┃  ⮕ ${prefix}out
┃  ⮕ ${prefix}outall
┃ 
┃ 🔧 *Modifiche Database & Logica:*
┃  ⮕ ${prefix}azzera (@)
┃  ⮕ ${prefix}aggiungi (n° messaggi)
┃  ⮕ ${prefix}rimuovi (n° messaggi)
┃  ⮕ ${prefix}addrank (n° livelli) (@user)
┃  ⮕ ${prefix}delrank (n° livelli) (@user)
┃  ⮕ ${prefix}lock
┃ 
┃ 📊 *Diagnostica & Server:*
┃  ⮕ ${prefix}diagnosi
┃  ⮕ ${prefix}sistema
┃  ⮕ ${prefix}dio
╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici,
> usa *${prefix}segnala*.`.trim();

  conn.sendMessage(m.chat, { text: menuText }, { quoted: fakeLocation });
};

handler.help = ["menu"];
handler.tags = ["menu"];
handler.command = /^(owner)$/i;
handler.rowner = true;

export default handler;
