import fetch from 'node-fetch';
import fs from 'fs';

const fallbackImage = () => {
  try {
    return fs.readFileSync('icone/888.jpg');
  } catch {
    return Buffer.alloc(0);
  }
};

const downloadImage = async (url) => {
  try {
    if (!url) return fallbackImage();
    const response = await fetch(url, { timeout: 8000 });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.buffer();
  } catch {
    return fallbackImage();
  }
};

export async function before(m, { conn, participants }) {
  if (!m.isGroup) return;

  let chat = global.db.data.chats[m.chat];
  if (!chat.welcome) return;

  let groupMetadata = await conn.groupMetadata(m.chat) || (conn.chats[m.chat] || {}).metadata;
  let participants_new = m.messageStubParameters;

  
  let groupPic = null;
  try {
    groupPic = await conn.profilePictureUrl(m.chat, 'image');
  } catch {
    groupPic = null;
  }

  const groupPicBuffer = await downloadImage(groupPic);

  for (let user of participants_new) {
    let profilePic = null;
    try {
      profilePic = await conn.profilePictureUrl(user, 'image');
    } catch {
      profilePic = null;
    }

    const ppBuffer = await downloadImage(profilePic);

    if (m.messageStubType === 27) {
      let welcomeText = chat.sWelcome || `@${user.split('@')[0]} 𝐞̀ 𝐞𝐧𝐭𝐫𝐚𝐭𝐨 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨`;

      welcomeText = welcomeText
        .replace(/@user/g, `@${user.split('@')[0]}`)
        .replace(/@group/g, groupMetadata.subject)
        .replace(/@count/g, groupMetadata.participants.length)
        .replace(/@desc/g, groupMetadata.desc?.toString() || 'Nessuna descrizione');

      welcomeText += `\n\n👥 𝐌𝐞𝐦𝐛𝐫𝐢 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨: ${groupMetadata.participants.length}`;

      const fakeWelcome = {
        key: {
          participants: '0@s.whatsapp.net',
          fromMe: false,
          id: '888Welcome'
        },
        message: {
          locationMessage: {
            name: '𝐁𝐞𝐧𝐯𝐞𝐧𝐮𝐭𝐨 👋',
            jpegThumbnail: ppBuffer.toString('base64'),
            vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Welcome;;;\nFN:Welcome\nEND:VCARD'
          }
        },
        participant: '0@s.whatsapp.net'
      }

      // Invio dell'immagine del gruppo come allegato principale insieme al testo
      await conn.sendMessage(m.chat, {
        image: groupPicBuffer,
        caption: welcomeText,
        mentions: [user]
      }, { quoted: fakeWelcome });
    }
  }
}
