import fetch from 'node-fetch';

export async function before(m, { conn, participants }) {
  if (!m.isGroup) return;

  let chat = global.db.data.chats[m.chat];
  if (!chat) return;

  let groupMetadata = await conn.groupMetadata(m.chat) || (conn.chats[m.chat] || {}).metadata;
  let participants_new = m.messageStubParameters || [];

  // Recupero dell'immagine del gruppo con fallback di sicurezza
  let groupPic;
  try {
    groupPic = await conn.profilePictureUrl(m.chat, 'image');
  } catch {
    groupPic = 'https://telegra.ph/file/8ca14ef9fa43e99d1d196.jpg';
  }

  let groupPicBuffer;
  try {
    groupPicBuffer = await (await fetch(groupPic)).buffer();
  } catch {
    groupPicBuffer = await (await fetch('https://telegra.ph/file/8ca14ef9fa43e99d1d196.jpg')).buffer();
  }

  for (let user of participants_new) {
    // Cleanup: rimozione dei dati dell'utente dal tracciamento del gruppo
    if (m.messageStubType === 28) {
      if (chat.topBlasphemy && chat.topBlasphemy[user]) {
        delete chat.topBlasphemy[user];
      }
      if (chat.topUsers && chat.topUsers[user]) {
        delete chat.topUsers[user];
      }
      if (chat.whitelist && chat.whitelist.includes(user)) {
        chat.whitelist = chat.whitelist.filter(u => u !== user);
      }
    }

    let profilePic;
    try {
      profilePic = await conn.profilePictureUrl(user, 'image');
    } catch {
      profilePic = 'https://telegra.ph/file/8ca14ef9fa43e99d1d196.jpg';
    }

    let ppBuffer;
    try {
      ppBuffer = await (await fetch(profilePic)).buffer();
    } catch {
      ppBuffer = await (await fetch('https://telegra.ph/file/8ca14ef9fa43e99d1d196.jpg')).buffer();
    }

    if (m.messageStubType === 28) {
      let byeText = chat.sBye || `@${user.split('@')[0]} 𝐡𝐚 𝐥𝐚𝐬𝐜𝐢𝐚𝐭𝐨 𝐢𝐥 𝐠𝐫𝐮𝐩𝐩𝐨`;

      byeText = byeText
        .replace(/@user/g, `@${user.split('@')[0]}`)
        .replace(/@group/g, groupMetadata.subject)
        .replace(/@count/g, groupMetadata.participants.length);

      byeText += `\n\n👥 𝐌𝐞𝐦𝐛𝐫𝐢 𝐫𝐢𝐦𝐚𝐧𝐞𝐧𝐭𝐢: ${groupMetadata.participants.length}`;

      const fakeBye = {
        key: {
          participants: '0@s.whatsapp.net',
          fromMe: false,
          id: '333Bye'
        },
        message: {
          locationMessage: {
            name: '𝐀𝐝𝐝𝐢𝐨 👋',
            jpegThumbnail: ppBuffer.toString('base64'),
            vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Bye;;;\nFN:Bye\nEND:VCARD'
          }
        },
        participant: '0@s.whatsapp.net'
      };

      // Invio dell'immagine del gruppo con il testo dell'addio nella didascalia
      await conn.sendMessage(m.chat, {
        image: groupPicBuffer,
        caption: byeText,
        mentions: [user]
      }, { quoted: fakeBye });
    }
  }
}
