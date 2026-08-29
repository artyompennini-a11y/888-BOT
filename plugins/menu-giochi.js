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
        'name': "🎮 MENU GIOCHI 888",
        'jpegThumbnail': await (await fetch("https://qu.ax/JKCXP.jpg")).buffer()
      }
    },
    'participant': "0@s.whatsapp.net"
  };

  let _0x2aa101 = 
`╭━━━〔 🎮 *MENU GIOCHI* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Intrattenimento e Funzioni Community*
┃━━━━━━━━━━━━━━━━━━
┃ ♟️ *GIOCHI DA TAVOLO:*
┃  ⮕ ${_0x3f73c1}scacchi
┃  ⮕ ${_0x3f73c1}startblast
┃  ⮕ ${_0x3f73c1}trivia
┃  ⮕ ${_0x3f73c1}indovina
┃  ⮕ ${_0x3f73c1}indovinamedio
┃  ⮕ ${_0x3f73c1}indovinadifficile
┃  ⮕ ${_0x3f73c1}toptrivia
┃ 🧩 *FUNNY:*
┃  ⮕ ${_0x3f73c1}impiccato
┃  ⮕ ${_0x3f73c1}tris
┃  ⮕ ${_0x3f73c1}uno
┃  ⮕ ${_0x3f73c1}bandiera
┃  ⮕ ${_0x3f73c1}mascotte
┃  ⮕ ${_0x3f73c1}labirinto
┃  ⮕ ${_0x3f73c1}bomba
┃  ⮕ ${_0x3f73c1}scf
┃  ⮕ ${_0x3f73c1}scramble
┃  ⮕ ${_0x3f73c1}basket
┃  ⮕ ${_0x3f73c1}rigore
┃  ⮕ ${_0x3f73c1}screenshot
┃  ⮕ ${_0x3f73c1}screenshotgp
┃  ⮕ ${_0x3f73c1}canta
┃ 
┃ 🔞 *HARD (INTERATTIVI):*
┃  ⮕ ${_0x3f73c1}lesbica
┃  ⮕ ${_0x3f73c1}frocio
┃  ⮕ ${_0x3f73c1}gay
┃  ⮕ ${_0x3f73c1}puttana
┃  ⮕ ${_0x3f73c1}porca
┃  ⮕ ${_0x3f73c1}porco
┃  ⮕ ${_0x3f73c1}alcolizzato
┃  ⮕ ${_0x3f73c1}negro
┃  ⮕ ${_0x3f73c1}sbiro
┃  ⮕ ${_0x3f73c1}figa
┃  ⮕ ${_0x3f73c1}pene
┃  ⮕ ${_0x3f73c1}ditalino
┃  ⮕ ${_0x3f73c1}sega
┃  ⮕ ${_0x3f73c1}lecca
┃  ⮕ ${_0x3f73c1}lecco
┃  ⮕ ${_0x3f73c1}tette
┃  ⮕ ${_0x3f73c1}bottiglia
┃  ⮕ ${_0x3f73c1}obbligo
┃  ⮕ ${_0x3f73c1}verità
┃  ⮕ ${_0x3f73c1}mordi
┃  ⮕ ${_0x3f73c1}insulta
┃ 
┃ ❤️ *LOVE:*
┃  ⮕ ${_0x3f73c1}adotta
┃  ⮕ ${_0x3f73c1}famiglia
┃  ⮕ ${_0x3f73c1}sposa
┃  ⮕ ${_0x3f73c1}bacia
┃  ⮕ ${_0x3f73c1}abbraccia
┃  ⮕ ${_0x3f73c1}crush
┃  ⮕ ${_0x3f73c1}trovafid
┃  ⮕ ${_0x3f73c1}odio
┃  ⮕ ${_0x3f73c1}clan
┃ 
┃ 🔧 *STRUMENTI & UTILITY:*
┃  ⮕ ${_0x3f73c1}removebg
┃  ⮕ ${_0x3f73c1}calendario
┃  ⮕ ${_0x3f73c1}screen
┃  ⮕ ${_0x3f73c1}emojimix
┃  ⮕ ${_0x3f73c1}setig
┃  ⮕ ${_0x3f73c1}rimuoviig
┃  ⮕ ${_0x3f73c1}statsgiornaliere
┃  ⮕ ${_0x3f73c1}topbestemmie
┃  ⮕ ${_0x3f73c1}topricchi
┃  ⮕ ${_0x3f73c1}traduci
┃  ⮕ ${_0x3f73c1}nota
┃  ⮕ ${_0x3f73c1}scarica
┃  ⮕ ${_0x3f73c1}ricetta
┃  ⮕ ${_0x3f73c1}quiz
┃  ⮕ ${_0x3f73c1}quizpatente
┃  ⮕ ${_0x3f73c1}calcioquiz
┃  ⮕ ${_0x3f73c1}meteo
┃  ⮕ ${_0x3f73c1}notizie
┃  ⮕ ${_0x3f73c1}oroscopo
┃  ⮕ ${_0x3f73c1}urly
┃  ⮕ ${_0x3f73c1}spotify
┃  ⮕ ${_0x3f73c1}twitter
┃  ⮕ ${_0x3f73c1}reddit
┃  ⮕ ${_0x3f73c1}pinterest
┃ 
┃ 🎲 *RANDOM:*
┃  ⮕ ${_0x3f73c1}identita
┃  ⮕ ${_0x3f73c1}telefono
┃  ⮕ ${_0x3f73c1}specchio
┃  ⮕ ${_0x3f73c1}fusione
┃  ⮕ ${_0x3f73c1}dox
┃  ⮕ ${_0x3f73c1}zizzania
┃  ⮕ ${_0x3f73c1}barzelletta
┃  ⮕ ${_0x3f73c1}saluta
┃  ⮕ ${_0x3f73c1}segreto
┃  ⮕ ${_0x3f73c1}bonk
╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici, 
> utilizza il comando *${_0x3f73c1}segnala* per 
> segnalarlo subito allo staff.`.trim();

  _0x542b94.sendMessage(_0x512ed3.chat, { text: _0x2aa101 }, { quoted: _0x6bd16e });
};

handler.help = ["menu"];
handler.tags = ["menu"];
handler.command = /^(giochi)$/i;

export default handler;
