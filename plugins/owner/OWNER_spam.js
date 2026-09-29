// Plugin by Elixir, Punisher & 888 staff

const manually = `𝐆𝐑𝐔𝐏𝐏𝐈 𝐔𝐅𝐅𝐈𝐂𝐈𝐀𝐋𝐈:

╭───⭓
│ 🗨️ 𝗚𝗿𝘂𝗽𝗽𝗼 𝟭
│ https://chat.whatsapp.com/F7kkULKYEeJAsydfNlx1WM
│
│ 🗨️ 𝗚𝗿𝘂𝗽𝗽𝗼 𝟮
│ https://chat.whatsapp.com/JI8PRoc18Fv1lpT94XJgd8
│
│ 🗨️ 𝗚𝗿𝘂𝗽𝗽𝗼 𝟯
│ https://chat.whatsapp.com/Di0hjfZz2KLBRCpl9d2Ef2
│
│ 🗨️ 𝗚𝗿𝘂𝗽𝗽𝗼 𝟰
│ https://chat.whatsapp.com/JWzYW1dt4fO2NnTSSzUmsW
│
│ 🗨️ 𝗚𝗿𝘂𝗽𝗽𝗼 𝟱
│ https://chat.whatsapp.com/LOo9DVb3uNn7AVKkOfv22k
╰───⭓`;

import { generateWAMessageFromContent } from '@888-BOT/888baileys'

const handler = async (m, { conn, args, text }) => {
  if (parseInt(args[1])) return m.reply(`Inserisci prima la quantità di messaggi da inviare e poi il testo`)
  if (!parseInt(args[0])) return m.reply(`Inserisci nel comando la quantità di messaggi da inviare`)
  var number = parseInt(args[0]) ? parseInt(args[0]) : 1

  var count = 0
  while (true) {
    count++
    const msg = conn.cMod(
      m.chat,
      generateWAMessageFromContent(
        m.chat,
        { ['extendedTextMessage']: { text: args[1] ? text.replace(args[0] + ' ', '') : manually } },
        { userJid: conn.user.id }
      ),
      null,
      conn.user.jid,
      { mentions: conn.chats[m.chat].metadata.participants.map(u => conn.decodeJid(u.id)) }
    )

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    if (count === parseInt(args[0])) break
  }
}

handler.command = ['spam']
handler.help = ['𝐬𝐩𝐚𝐦']
handler.tags = ['owner']
handler.owner = true

export default handler