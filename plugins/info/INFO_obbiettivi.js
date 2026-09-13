import { createHash } from 'crypto';
import PhoneNumber from 'awesome-phonenumber';

let balIconBuffer;
async function loadBalIcon() {
  if (!balIconBuffer) {
    try {
      balIconBuffer = await global.fs.promises.readFile('./icone/bal.png');
    } catch {
      balIconBuffer = Buffer.alloc(0);
    }
  }
  return balIconBuffer;
}

const handler = async (m, { conn }) => {
  const mention = m.mentionedJid[0]
    ? m.mentionedJid[0]
    : m.quoted
    ? m.quoted.sender
    : m.sender;

  const who = mention || m.sender;
  const user = global.db.data.users[who] || {};

  const prova = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "OBIETTIVI"
    },
    message: {
      locationMessage: {
        name: "🎯 OBIETTIVI 888",
        jpegThumbnail: await loadBalIcon(),
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: "0@s.whatsapp.net"
  };

  let pic;
  try {
    pic = await conn.profilePictureUrl(who, 'image');
  } catch {
    pic = null;
  }

  const text = `
🎯 *OBIETTIVI UTENTE 888*

• Messaggi inviati: ${user.messaggi > 0 ? '✅' : '❌'}
• Raggiungi 10.000 messaggi: ${user.messaggi > 10000 ? '✅' : '❌'}

• Bestemmie rilevate: ${user.blasphemy > 0 ? '✅' : '❌'}
• Raggiungi 1.000 bestemmie: ${user.blasphemy > 1000 ? '✅' : '❌'}

• Esegui 1.000 comandi: ${user.command > 1000 ? '✅' : '❌'}

━━━━━━━━━━━━━━━━━━━━━━
Monitoraggio progressi attivo.
`.trim();

  conn.sendMessage(
    m.chat,
    {
      text,
      contextInfo: {
        mentionedJid: [who],
        externalAdReply: {
          title: user.name?.trim() || "Sconosciuto",
          sourceUrl: "https://wa.me/" + who.split("@")[0],
          thumbnail: pic
            ? await (await fetch(pic)).buffer()
            : await (await fetch('https://telegra.ph/file/17e7701f8b0a63806e312.png')).buffer()
        }
      }
    },
    { quoted: prova }
  );
};

handler.command = ['obbiettivo', 'obbiettivi'];
export default handler;