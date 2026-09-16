//Plugin fatto da Axtral_WiZaRd
import fs from 'fs';

const handler = async (m, { conn, text, args, usedPrefix, command }) => {

  const esempio = 
    '𝐄𝐬𝐞𝐦𝐩𝐢𝐨:\n' +
    `✧‌⃟ᗒ ${usedPrefix + command} @${m.sender.split('@')[0]}` +
    ` <𝐫𝐢𝐩𝐫𝐞𝐧𝐝𝐢 𝐦𝐞𝐬𝐬𝐚𝐠𝐠𝐢>` +
    `\n✧‌⃟ᗒ ${usedPrefix + command} ${m.sender.split('@')[0]}` +
    `\n✧‌⃟ᗒ ${usedPrefix + command} <numero>`; 

  let numeroJid = m.mentionedJid?.[0]
    ? m.mentionedJid[0]
    : m.quoted
      ? m.quoted.sender
      : text
        ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        : false;

  if (!numeroJid) {
    return conn.reply(m.chat, esempio, m, {
      mentions: [m.sender]
    });
  }

  let cleanNum = numeroJid.replace(/[^0-9]/g, '');

  switch (command) {
    case 'addowner': {
      if (global.owner.some(o => o[0] === numeroJid)) {
        return conn.reply(m.chat, '⚠️ Questo numero è già nella lista degli owner!', m);
      }

      global.owner.push([numeroJid, 'Owner', true]);

      let rawOwners = [];
      if (fs.existsSync('./owner.json')) {
        try { rawOwners = JSON.parse(fs.readFileSync('./owner.json', 'utf-8')); } catch (e) {}
      }
      rawOwners.push([cleanNum, 'Owner', true]);
      fs.writeFileSync('./owner.json', JSON.stringify(rawOwners, null, 2));

      let fakeMsg = {
        key: {
          participants: '0@s.whatsapp.net',
          fromMe: false,
          id: 'Halo'
        },
        message: {
          extendedTextMessage: {
            text: '𝑪𝒐𝒎𝒂𝒏𝒅𝒐 𝒆𝒔𝒆𝒈𝒖𝒊𝒕𝒐 ✓',
            vcard: `BEGIN:VCARD
VERSION:3.0
N:;Unlimited;;;
FN:Unlimited
ORG:Unlimited
TITLE:
item1.TEL;waid=15395490858:+1 (539) 549-0858
item1.X-ABLabel:Unlimited
X-WA-BIZ-DESCRIPTION:ofc
X-WA-BIZ-NAME:Unlimited
END:VCARD`
          }
        },
        participant: '0@s.whatsapp.net'
      };

      await conn.reply(
        m.chat,
        '𝐐𝐮𝐞𝐬𝐭𝐨 𝐧𝐮𝐦𝐞𝐫𝐨 𝐞̀ 𝐬𝐭𝐚𝐭𝐨 𝐚𝐠𝐠𝐢𝐮𝐧𝐭𝐨 𝐚𝐥𝐥𝐚 𝐥𝐢𝐬𝐭𝐚 𝐝𝐞𝐠𝐥𝐢 𝐨𝐰𝐧𝐞𝐫',
        fakeMsg
      );
      break;
    }

    case 'delowner': {
      const index = global.owner.findIndex(o => o[0] === numeroJid);
      if (index !== -1) {
        global.owner.splice(index, 1);

        let rawOwners = [];
        if (fs.existsSync('./owner.json')) {
          try { rawOwners = JSON.parse(fs.readFileSync('./owner.json', 'utf-8')); } catch (e) {}
        }
        rawOwners = rawOwners.filter(o => o[0].replace(/[^0-9]/g, '') !== cleanNum);
        fs.writeFileSync('./owner.json', JSON.stringify(rawOwners, null, 2));

        let fakeMsg = {
          key: {
            participants: '0@s.whatsapp.net',
            fromMe: false,
            id: 'Halo'
          },
          message: {
            extendedTextMessage: {
              text: '𝑪𝒐𝒎𝒂𝒏𝒅𝒐 𝒆𝒔𝒆𝒈𝒖𝒊𝒕𝒐 ✓',
              vcard: `BEGIN:VCARD
VERSION:3.0
N:;Unlimited;;;
FN:Unlimited
ORG:Unlimited
TITLE:
item1.TEL;waid=15395490858:+1 (539) 549-0858
item1.X-ABLabel:Unlimited
X-WA-BIZ-DESCRIPTION:ofc
X-WA-BIZ-NAME:Unlimited
END:VCARD`
            }
          },
          participant: '0@s.whatsapp.net'
        };

        await conn.reply(
          m.chat,
          '𝐐𝐮𝐞𝐬𝐭𝐨 𝐧𝐮𝐦𝐞𝐫𝐨 𝐞̀ 𝐬𝐭𝐚𝐭𝐨 𝐫𝐢𝐦𝐨𝐬𝐬𝐨 𝐝𝐚𝐥𝐥𝐚 𝐥𝐢𝐬𝐭𝐚 𝐝𝐞𝐠𝐥𝐢 𝐨𝐰𝐧𝐞𝐫',
          fakeMsg
        );
      }
      break;
    }
  }
};

handler.command = /^(addowner|delowner)$/i;
handler.rowner = true;

export default handler;
