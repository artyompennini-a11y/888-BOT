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
  const nome = u.name || conn.getName?.(who) || tag;

  const profilePic = await conn.profilePictureUrl(who, 'image').catch(() => null);
  const ppBuffer = profilePic 
    ? await (await fetch(profilePic)).buffer() 
    : await (await fetch('https://telegra.ph/file/8ca14ef9fa43e99d1d196.jpg')).buffer();

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: '333Info'
    },
    message: {
      locationMessage: {
        name: `Info di ${nome}`,
        jpegThumbnail: ppBuffer.toString('base64'),
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Info;;;\nFN:Info\nEND:VCARD'
      }
    },
    participant: '0@s.whatsapp.net'
  }

  const insta = u.nomeinsta 
    ? `@${u.nomeinsta}` 
    : 'Non impostato';

  const warnEmoji = u.warn === 0 ? '👌' : u.warn === 1 ? '⚠️' : '‼️';
  const curse = u.blasphemy || 0;

  const regInfo = u.registered
    ? `┃  • _Nome:_ ${u.nome}\n┃  • _Età:_ ${u.eta}\n┃  • _Città:_ ${u.citta}`
    : `┃  • _Stato:_ ❌ Non registrato`;

  const messageText = `╭━━━〔 📌 *INFO UTENTE* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* Database Sincronizzato
┃━━━━━━━━━━━━━━━━━━
┃ 👤 *Utente:* ${tag}
┃ 
┃ 📝 *REGISTRAZIONE:*
${regInfo}
┃ 
┃ 📊 *STATISTICHE & ATTIVITÀ:*
┃  • _Messaggi inviati:_ ${u.messaggi || 0}
┃  • _Conto in Banca:_ ${u.bank || 0}€
┃  • _Infrazioni (Warn):_ [ ${u.warn || 0} / 3 ] ${warnEmoji}
┃  • _Segnalazioni:_ ${curse}
┃ 
┃ 🤳🏻 *SOCIAL:*
┃  • _Instagram:_ ${insta}
╰━━━━━━━━━━━━━━━━━━┈`.trim();

  await conn.sendMessage(m.chat, {
    text: messageText,
    mentions: [who],
    buttons: [
      { buttonId: '.statsgiornaliere', buttonText: { displayText: '📊 Statistiche Giornaliere' }, type: 1 }
    ]
  }, { quoted: fake });
};

handler.command = ['info', 'bal'];
handler.tags = ['info'];
handler.help = ['infouser'];

export default handler;
