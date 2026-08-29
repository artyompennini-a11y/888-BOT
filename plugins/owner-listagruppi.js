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
        'name': "🎰 LISTA GRUPPI 888",
        'jpegThumbnail': await (await fetch("https://qu.ax/JKCXP.jpg")).buffer()
      }
    },
    'participant': "0@s.whatsapp.net"
  };

  const botName = global.db.data?.nomedelbot || "𝟴𝟴𝟴 𝗕𝗢𝗧";
  const groups = await _0x542b94.groupFetchAllParticipating();
  const groupList = Object.values(groups);
  groupList.sort((a, b) => b.participants.length - a.participants.length);

  const normalizedBot = _0x542b94.decodeJid(_0x542b94.user.jid);

  let _0x2aa101 = 
`╭━━━〔 🎰 *LISTA GRUPPI* 〕━━━┈
┃ *Bot:* ${botName}
┃ *Categoria:* Amministrazione & Controllo
┃━━━━━━━━━━━━━━━━━━
┃ 📊 *Riepilogo:*
┃  ⮕ Totale Gruppi: ${groupList.length}
┃━━━━━━━━━━━━━━━━━━\n`;

  for (let i = 0; i < groupList.length; i++) {
    const group = groupList[i];
    const jid = group.id;

    let metadata;
    try { metadata = await _0x542b94.groupMetadata(jid); } catch { metadata = group; }

    const participants = metadata?.participants || group.participants || [];
    const totalParticipants = participants.length;

    const normalizedParticipants = participants.map(u => {
      const id = _0x542b94.decodeJid(u.id || u.jid || u.lid || '');
      const jid = _0x542b94.decodeJid(u.jid || u.id || u.lid || '');
      return { ...u, id, jid };
    });

    const matchIds = (u, target) => [
      _0x542b94.decodeJid(u?.id),
      u?.jid ? _0x542b94.decodeJid(u.jid) : null,
      u?.lid ? _0x542b94.decodeJid(u.lid) : null
    ].filter(Boolean).includes(target);

    const admins = normalizedParticipants.filter(p => ['admin', 'superadmin', true].includes(p.admin));
    const adminCount = admins.length;

    const isOwner = metadata?.owner ? _0x542b94.decodeJid(metadata.owner) === normalizedBot : false;
    const isOwnerLid = metadata?.ownerLid ? _0x542b94.decodeJid(metadata.ownerLid) === normalizedBot : false;
    const botIsAdmin = isOwner || isOwnerLid || normalizedParticipants.some(u => matchIds(u, normalizedBot) && ['admin', 'superadmin', true].includes(u.admin));

    const chatData = global.db.data.chats?.[jid] || {};
    let groupMessages = chatData.totalmsg || 0;
    if (!groupMessages && chatData.topUsers) {
      groupMessages = Object.values(chatData.topUsers).reduce((sum, value) => sum + (value || 0), 0);
    }
    if (!groupMessages && chatData.users) {
      groupMessages = Object.values(chatData.users).reduce((sum, user) => sum + ((user?.messages || 0)), 0);
    }
    groupMessages = typeof groupMessages === 'number' ? groupMessages : 'N/D';

    let groupLink = '✗';
    if (botIsAdmin) {
      try {
        const code = await _0x542b94.groupInviteCode(jid);
        if (code) groupLink = `https://chat.whatsapp.com/${code}`;
      } catch {}
    }
    if (groupLink === '✗') {
      const nativeCode = metadata?.inviteCode || metadata?.invite_code;
      if (nativeCode) groupLink = `https://chat.whatsapp.com/${nativeCode}`;
    }
    if (groupLink === '✗') {
      const desc = metadata?.desc?.toString() || '';
      const match = desc.match(/https:\/\/chat\.whatsapp\.com\/\S+/);
      if (match) groupLink = match[0];
    }

    _0x2aa101 += `┃ 📦 *Gruppo ${i + 1}:* ${group.subject}\n`;
    _0x2aa101 += `┃  ⮕ 👥 Membri: ${totalParticipants}\n`;
    _0x2aa101 += `┃  ⮕ 💬 Messaggi: ${groupMessages}\n`;
    _0x2aa101 += `┃  ⮕ 🛡️ Bot Admin: ${botIsAdmin ? `Sì ✅ (${adminCount})` : 'No ❌'}\n`;
    _0x2aa101 += `┃  ⮕ 🆔 ID: \`${jid}\`\n`;
    _0x2aa101 += `┃  ⮕ 🔗 Link: ${groupLink}\n`;
    if (i < groupList.length - 1) {
      _0x2aa101 += `┃\n`;
    }
  }

  _0x2aa101 += 
`╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici, 
> utilizza il comando *${_0x3f73c1}segnala* per 
> segnalarlo subito allo staff.`.trim();

  _0x542b94.sendMessage(_0x512ed3.chat, { text: _0x2aa101 }, { quoted: _0x6bd16e });
};

handler.command = /^(gruppi)$/i;
handler.owner = true;

export default handler;
