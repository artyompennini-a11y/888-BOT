//Plugin fatto da Axtral_WiZaRd
import fs from 'fs';

const getOwnerNumbers = (conn, value) => {
  const candidates = [value];
  if (typeof conn.decodeJid === 'function') candidates.push(conn.decodeJid(value));
  return new Set(candidates
    .map(candidate => String(candidate ?? '').replace(/\D/g, ''))
    .filter(Boolean));
};

const isSameOwner = (conn, owner, target) => {
  const ownerValue = Array.isArray(owner) ? owner[0] : owner;
  const targetNumbers = getOwnerNumbers(conn, target);
  return [...getOwnerNumbers(conn, ownerValue)].some(number => targetNumbers.has(number));
};

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
      ? (text.includes('@') ? text.trim().split(/\s+/)[0] : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
        : false;

  if (!numeroJid) {
    return conn.reply(m.chat, esempio, m, {
      mentions: [m.sender]
    });
  }

  let cleanNum = numeroJid.replace(/[^0-9]/g, '');

  switch (command) {
    case 'addowner': {
      if (global.owner.some(owner => isSameOwner(conn, owner, numeroJid))) {
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
      const index = global.owner.findIndex(owner => isSameOwner(conn, owner, numeroJid));
      if (index !== -1) {
        global.owner.splice(index, 1);

        let rawOwners = [];
        if (fs.existsSync('./owner.json')) {
          try { rawOwners = JSON.parse(fs.readFileSync('./owner.json', 'utf-8')); } catch (e) {}
        }
        rawOwners = rawOwners.filter(owner => !isSameOwner(conn, owner, numeroJid));
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