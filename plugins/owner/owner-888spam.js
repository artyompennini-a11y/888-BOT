// Plugin by Elixir, Punisher & 888 staff

const manually = `𝐂𝐎𝐌𝐌𝐔𝐍𝐈𝐓𝐘 & 𝐂𝐀𝐍𝐀𝐋𝐄 𝐔𝐅𝐅𝐈𝐂𝐈𝐀𝐋𝐈:

╭───⭓
│ 🌐 𝗖𝗼𝗺𝗺𝘂𝗻𝗶𝘁𝘆
│ https://chat.whatsapp.com/CuMIAMfhTNo92h0UE2NGrb
│
│ 📢 𝗖𝗮𝗻𝗮𝗹𝗲 𝗨𝗳𝗳𝗶𝗰𝗶𝗮𝗹𝗲
│ https://whatsapp.com/channel/0029Vb8Y0igGufJ0xMYJmU40
╰───⭓`;

import { generateWAMessageFromContent } from '@888-BOT/888baileys';

const handler = async (m, { conn, args, text }) => {
  // Controllo owner dal config.js
  const senderNumber = m.sender.split('@')[0];
  const ownerNumbers = global.owner.map(o =>
    Array.isArray(o) ? o[0].replace(/[^0-9]/g, '') : String(o).replace(/[^0-9]/g, '')
  );

  if (!ownerNumbers.includes(senderNumber)) {
    return m.reply("❌ Solo gli *owner del bot* possono usare questo comando.");
  }

  if (parseInt(args[1])) {
    return m.reply(`Inserisci prima la quantità di messaggi da inviare e poi il testo`);
  }

  if (!parseInt(args[0])) {
    return m.reply(`Inserisci nel comando la quantità di messaggi da inviare`);
  }

  const number = parseInt(args[0]) ? parseInt(args[0]) : 1;

  let count = 0;
  while (true) {
    count++;

    const msg = conn.cMod(
      m.chat,
      generateWAMessageFromContent(
        m.chat,
        {
          extendedTextMessage: {
            text: args[1] ? text.replace(args[0] + ' ', '') : manually
          }
        },
        { userJid: conn.user.id }
      ),
      null,
      conn.user.jid,
      {
        mentions: conn.chats[m.chat].metadata.participants.map(u =>
          conn.decodeJid(u.id)
        )
      }
    );

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    if (count === number) break;
  }
};

handler.command = ['888spam'];
handler.help = ['888spam'];
handler.tags = ['owner'];
handler.owner = true;

export default handler;