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
        'name': "🎵 MENU AUDIO 888",
        'jpegThumbnail': await (await fetch("https://qu.ax/JKCXP.jpg")).buffer()
      }
    },
    'participant': "0@s.whatsapp.net"
  };

  let _0x2aa101 = 
`╭━━━〔 🎵 *MENU AUDIO* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Funzione:* Modificatori Vocali ed Effetti
┃━━━━━━━━━━━━━━━━━━
┃ 🔍 *Download & Ricerca:*
┃  ⮕ ${_0x3f73c1}play
┃  ⮕ ${_0x3f73c1}playlist
┃  ⮕ ${_0x3f73c1}audio (testo)
┃ 
┃ ⚡ *Velocità & Struttura:*
┃  ⮕ ${_0x3f73c1}fast
┃  ⮕ ${_0x3f73c1}slow
┃  ⮕ ${_0x3f73c1}reverse
┃  ⮕ ${_0x3f73c1}smooth
┃  ⮕ ${_0x3f73c1}nightcore
┃ 
┃ 🎛️ *Tonalità & Filtri:*
┃  ⮕ ${_0x3f73c1}bass
┃  ⮕ ${_0x3f73c1}deep
┃  ⮕ ${_0x3f73c1}fat
┃  ⮕ ${_0x3f73c1}chipmunk
┃  ⮕ ${_0x3f73c1}chip
┃  ⮕ ${_0x3f73c1}robot
┃ 
┃ 🔊 *Ambiente & Spazio:*
┃  ⮕ ${_0x3f73c1}cur
┃  ⮕ ${_0x3f73c1}echo
┃  ⮕ ${_0x3f73c1}vibrato
┃  ⮕ ${_0x3f73c1}reverb
┃ 
┃ 💥 *Distorsione & Overdrive:*
┃  ⮕ ${_0x3f73c1}blown
┃  ⮕ ${_0x3f73c1}earrape
┃  ⮕ ${_0x3f73c1}distort
╰━━━━━━━━━━━━━━━━━━┈
> 💡 *Istruzioni:* Rispondi a un messaggio 
> vocale o a un file audio inserendo il comando 
> dell'effetto che desideri applicare.`.trim();

  _0x542b94.sendMessage(_0x512ed3.chat, { text: _0x2aa101 }, { quoted: _0x6bd16e });
};

handler.help = ["menu"];
handler.tags = ["menu"];
handler.command = /^(menuaudio)$/i;

export default handler;
