import 'os';
import 'util';
import 'human-readable';
import '@realvare/baileys';
import 'fs';
import 'perf_hooks';

const BOLD_MAP = {
  a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',
  n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
  A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',
  N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
  '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'🗝','6':'🗟','7':'🗠','8':'🗡','9':'🗢'
};

const bold = str => str.split('').map(c => BOLD_MAP[c] || c).join('');

let handler = async (_0x512ed3, { conn: _0x542b94, usedPrefix: _0x3f73c1, text }) => {
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
        'name': "🎰 SISTEMA 888",
        'jpegThumbnail': await (await fetch("https://qu.ax/JKCXP.jpg")).buffer()
      }
    },
    'participant': "0@s.whatsapp.net"
  };

  const plugins = global.plugins || {};
  const entries = Object.entries(plugins);

  if (!entries.length) return _0x542b94.sendMessage(_0x512ed3.chat, { text: '❌ Nessun plugin caricato.' }, { quoted: _0x6bd16e });

  const filter = text?.trim().toLowerCase();
  const attivi = [];
  const disabilitati = [];

  for (const [name, p] of entries) {
    const short = name.replace(/^.*[\\/]/, '').replace('.js', '');
    if (filter && !short.toLowerCase().includes(filter)) continue;
    if (p.disabled) disabilitati.push(short);
    else attivi.push(short);
  }

  attivi.sort();
  disabilitati.sort();

  let _0x2aa101 = 
`╭━━━〔 🎰 *GESTIONE PLUGINS* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Categoria:* Sviluppatore & Sistema
┃━━━━━━━━━━━━━━━━━━
┃ 📊 *Riepilogo File:*
┃  ⮕ Totale: ${entries.length}
┃  ⮕ Attivi: ${attivi.length}
┃  ⮕ Disabilitati: ${disabilitati.length}
┃━━━━━━━━━━━━━━━━━━\n`;

  if (attivi.length) {
    _0x2aa101 += `┃ ✅ *Moduli Attivi:*\n`;
    _0x2aa101 += attivi.map(n => `┃  ⮕ ${bold(n)}`).join('\n') + '\n┃\n';
  }

  if (disabilitati.length) {
    _0x2aa101 += `┃ 🚫 *Moduli Disabilitati:*\n`;
    _0x2aa101 += disabilitati.map(n => `┃  ⮕ ${bold(n)}`).join('\n') + '\n┃\n';
  }

  _0x2aa101 += 
`╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici, 
> utilizza il comando *${_0x3f73c1}ticket* per 
> segnalarlo subito allo staff.`.trim();

  _0x542b94.sendMessage(_0x512ed3.chat, { text: _0x2aa101 }, { quoted: _0x6bd16e });
};

handler.command = /^listpl$/i;
handler.rowner = true;

export default handler;
