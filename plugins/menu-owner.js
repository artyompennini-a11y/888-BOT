import 'os';
import 'util';
import 'human-readable';
import '@realvare/baileys';
import 'fs';
import 'perf_hooks';

let handler = async (_0x512ed3, { conn: _0x542b94, usedPrefix: _0x3f73c1 }) => {
  const { welcome: _0x16d809, detect: _0x4c3a9f } = global.db.data.chats[_0x512ed3.chat];
  let _0x5bfb0b = _0x512ed3.quoted ? _0x512ed3.quoted.sender : _0x512ed3.mentionedJid && _0x512ed3.mentionedJid[0] ? _0x512ed3.mentionedJid[0] : _0x512ed3.fromMe ? _0x542b94.user.jid : _0x512ed3.sender;
  const _0x197a8a = (await _0x542b94.profilePictureUrl(_0x5bfb0b, "image").catch(_0x2cb040 => null)) || "./src/avatar_contact.png";

  let _0x53e6f1;
  if (_0x197a8a !== "./src/avatar_contact.png") {
    _0x53e6f1 = await (await fetch(_0x197a8a)).buffer();
  } else {
    _0x53e6f1 = await (await fetch("https://qu.ax/DQsgr.png")).buffer();
  }

  let _0x6bd16e = {
    'key': {
      'participants': "0@s.whatsapp.net",
      'fromMe': false,
      'id': "Halo"
    },
    'message': {
      'locationMessage': {
        'name': "🔐 MENU OWNER 888",
        'jpegThumbnail': await (await fetch("https://qu.ax/JKCXP.jpg")).buffer()
      }
    },
    'participant': "0@s.whatsapp.net"
  };

  let _0x2aa101 = 
`╭━━━〔 🔐 *MENU OWNER* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Livello:* Sviluppatore / Creatore Core
┃━━━━━━━━━━━━━━━━━━
┃ ⚙️ *Gestione Bot & Credenziali:*
┃  ⮕ ${_0x3f73c1}impostanome
┃  ⮕ ${_0x3f73c1}resettanome
┃  ⮕ ${_0x3f73c1}addowner
┃  ⮕ ${_0x3f73c1}delowner
┃  ⮕ ${_0x3f73c1}addperms
┃  ⮕ ${_0x3f73c1}setppbot
┃  ⮕ ${_0x3f73c1}prefisso
┃  ⮕ ${_0x3f73c1}resettaprefisso
┃ 
┃ 🛡️ *Controllo Utenti & Chat:*
┃  ⮕ ${_0x3f73c1}banchat
┃  ⮕ ${_0x3f73c1}banuser (@)
┃  ⮕ ${_0x3f73c1}unbanuser (@)
┃  ⮕ ${_0x3f73c1}block (@)
┃  ⮕ ${_0x3f73c1}unblock (@)
┃  ⮕ ${_0x3f73c1}banlist
┃  ⮕ ${_0x3f73c1}listamuti
┃  ⮕ ${_0x3f73c1}delprem
┃ 
┃ 💻 *Gestione Sviluppo & Plugin:*
┃  ⮕ ${_0x3f73c1}getfile
┃  ⮕ ${_0x3f73c1}saveplugin
┃  ⮕ ${_0x3f73c1}getplugin
┃  ⮕ ${_0x3f73c1}editplugin
┃  ⮕ ${_0x3f73c1}listpl
┃  ⮕ ${_0x3f73c1}disablepl
┃  ⮕ ${_0x3f73c1}enablepl
┃  ⮕ ${_0x3f73c1}dp (plugin)
┃  ⮕ ${_0x3f73c1}codifica
┃  ⮕ ${_0x3f73c1}offusca
┃ 
┃ 🚪 *Controllo Gruppi & Spostamenti:*
┃  ⮕ ${_0x3f73c1}hidetagall
┃  ⮕ ${_0x3f73c1}ispeziona <link gruppo>
┃  ⮕ ${_0x3f73c1}join (link gruppo)
┃  ⮕ ${_0x3f73c1}gruppi
┃  ⮕ ${_0x3f73c1}adminall
┃  ⮕ ${_0x3f73c1}out
┃  ⮕ ${_0x3f73c1}outall
┃ 
┃ 🔧 *Modifiche Database & Logica:*
┃  ⮕ ${_0x3f73c1}azzera (@)
┃  ⮕ ${_0x3f73c1}aggiungi (n° messaggi)
┃  ⮕ ${_0x3f73c1}rimuovi (n° messaggi)
┃  ⮕ ${_0x3f73c1}lock
┃ 
┃ 📊 *Diagnostica & Server:*
┃  ⮕ ${_0x3f73c1}diagnosi
┃  ⮕ ${_0x3f73c1}sistema
┃  ⮕ ${_0x3f73c1}dio
╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici, 
> utilizza il comando *${_0x3f73c1}ticket* per 
> segnalarlo subito allo staff.`.trim();

  _0x542b94.sendMessage(_0x512ed3.chat, { text: _0x2aa101 }, { quoted: _0x6bd16e });
};

handler.help = ["menu"];
handler.tags = ["menu"];
handler.command = /^(owner)$/i;
handler.rowner = true;

export default handler;
