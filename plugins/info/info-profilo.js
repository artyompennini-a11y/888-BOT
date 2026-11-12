import fetch from 'node-fetch';

let handler = async (m, { conn }) => {
  const users = global.db.data.users;

  const who = m.quoted
    ? m.quoted.sender
    : m.mentionedJid && m.mentionedJid[0]
    ? m.mentionedJid[0]
    : m.sender;

  if (!users[who]) {
    users[who] = { messaggi: 0, warn: 0, nomeinsta: '', blasphemy: 0, bank: 0 };
  }

  const u = users[who];
  const tag = '@' + who.split('@')[0];
  const nome = u.name || await conn.getName(who) || tag;

  const profilePic = await conn.profilePictureUrl(who, 'image').catch(() => null);
  const ppBuffer = profilePic
    ? await (await fetch(profilePic)).buffer()
    : await (await fetch('https://telegra.ph/file/8ca14ef9fa43e99d1d196.jpg')).buffer();

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: '888InfoUser'
    },
    message: {
      locationMessage: {
        name: `Info di ${nome}`,
        jpegThumbnail: ppBuffer.toString('base64'),
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Info;;;\nFN:Info\nEND:VCARD'
      }
    },
    participant: '0@s.whatsapp.net'
  };

  const insta = u.nomeinsta ? `@${u.nomeinsta}` : 'Non impostato';
  const warnEmoji = u.warn === 0 ? '👌' : u.warn === 1 ? '⚠️' : '‼️';
  const curse = u.blasphemy || 0;

  const regInfo = u.registered
    ? `• Nome: ${u.nome}\n• Età: ${u.eta}\n• Città: ${u.citta}`
    : `❌ Non registrato`;

  const text =
    `👤 *Info Utente*\n` +
    `Utente: ${tag}\n\n` +
    `📝 *Registrazione*\n${regInfo}\n\n` +
    `📊 *Statistiche*\n` +
    `• Messaggi: ${u.messaggi || 0}\n` +
    `• Conto: ${u.bank || 0} 888COIN\n` +
    `• Warn: ${u.warn || 0}/3 ${warnEmoji}\n` +
    `• Segnalazioni: ${curse}\n\n` +
    `🤳 *Social*\n` +
    `• Instagram: ${insta}`;

  await conn.sendMessage(
    m.chat,
    {
      text,
      mentions: [who],
      buttons: [
        {
          buttonId: '.statsgiornaliere',
          buttonText: { displayText: '📊 𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐡𝐞' },
          type: 1
        }
      ]
    },
    { quoted: fake }
  );
};

handler.command = ['profilo', 'bal'];
handler.tags = ['info'];
handler.help = ['profilo'];

export default handler;