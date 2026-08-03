//Plugin by Elixir, Punisher & 888 staff
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
        'name': "🎰 MENU RPG 888",
        'jpegThumbnail': await (await fetch("https://qu.ax/JKCXP.jpg")).buffer()
      }
    },
    'participant': "0@s.whatsapp.net"
  };

  let _0x2aa101 = 
`╭━━━〔 🎰 *MENU RPG* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Categoria:* Minigiochi & Economia
┃━━━━━━━━━━━━━━━━━━
┃ 🪙 *Giochi e Fortuna:*
┃  ⮕ ${_0x3f73c1}sorte
┃  ⮕ ${_0x3f73c1}slot
┃  ⮕ ${_0x3f73c1}roulette
┃  ⮕ ${_0x3f73c1}ruota
┃  ⮕ ${_0x3f73c1}casino
┃ 
┃ 💰 *Economia & Banca:*
┃  ⮕ ${_0x3f73c1}portafoglio
┃  ⮕ ${_0x3f73c1}paghetta
┃  ⮕ ${_0x3f73c1}deposita
┃  ⮕ ${_0x3f73c1}preleva
┃  ⮕ ${_0x3f73c1}bonifico
┃  ⮕ ${_0x3f73c1}iban
┃ 
┃ ⚔️ *Azioni & Crimini:*
┃  ⮕ ${_0x3f73c1}ruba
┃  ⮕ ${_0x3f73c1}rapina
┃  ⮕ ${_0x3f73c1}spara
┃  ⮕ ${_0x3f73c1}duello
┃  ⮕ ${_0x3f73c1}colpo
┃  ⮕ ${_0x3f73c1}avventura
┃ 
┃  💼 *Lavoro & Commercio:*
┃  ⮕ ${_0x3f73c1}lavora
┃  ⮕ ${_0x3f73c1}prostituta
┃  ⮕ ${_0x3f73c1}compra
┃  ⮕ ${_0x3f73c1}vendi
┃  ⮕ ${_0x3f73c1}magazzino
┃ 
┃ 🏆 *Classifiche & Quiz:*
┃  ⮕ ${_0x3f73c1}calcioscommesse
┃  ⮕ ${_0x3f73c1}premiotop
┃  ⮕ ${_0x3f73c1}quiz
┃  ⮕ ${_0x3f73c1}rank
╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici, 
> utilizza il comando *${_0x3f73c1}segnala* per 
> segnalarlo subito allo staff.`.trim();

  _0x542b94.sendMessage(_0x512ed3.chat, { text: _0x2aa101 }, { quoted: _0x6bd16e });
};

handler.help = ["menu"];
handler.tags = ["menu"];
handler.command = /^(rpg)$/i;

export default handler;
