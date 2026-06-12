import 'os';
import 'util';
import 'human-readable';
import '@realvare/baileys';
import 'fs';
import 'perf_hooks';

let handler = async (_0x512ed3, { conn: _0x542b94, usedPrefix: _0x3f73c1, isOwner }) => {
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
        'name': "🎰 SANZIONI 888",
        'jpegThumbnail': await (await fetch("https://qu.ax/JKCXP.jpg")).buffer()
      }
    },
    'participant': "0@s.whatsapp.net"
  };

  let users = Object.entries(global.db.data.users).filter(user => user[1].muto);

  let _0x2aa101 = 
`╭━━━〔 🎰 *UTENTI MUTATI* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Categoria:* Moderazione & Controllo
┃━━━━━━━━━━━━━━━━━━
┃ 🔇 *Lista Neri:*
┃  ⮕ Totale Mutati: ${users.length}
┃━━━━━━━━━━━━━━━━━━\n`;

  if (users.length === 0) {
    _0x2aa101 += `┃  🟢 Nessun utente mutato nel database.\n`;
  } else {
    users.forEach(([jid], i) => {
      let formatJid = isOwner ? '@' + jid.split('@')[0] : jid;
      _0x2aa101 += `┃  ⮕ ${i + 1}. ${formatJid}\n`;
    });
  }

  _0x2aa101 += 
`╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici, 
> utilizza il comando *${_0x3f73c1}ticket* per 
> segnalarlo subito allo staff.`.trim();

  _0x542b94.sendMessage(_0x512ed3.chat, { 
    text: _0x2aa101, 
    mentions: _0x542b94.parseMention(_0x2aa101) 
  }, { quoted: _0x6bd16e });
};

handler.help = ['listamuti'];
handler.tags = ['owner'];
handler.command = /^listamuti?$/i;
handler.rowner = true;

export default handler;
