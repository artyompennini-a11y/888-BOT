import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const ICONE_DIR = path.join(process.cwd(), 'icone')
const GIF_NAME = 'famiglia' 

const findGif = () => {
  for (const ext of ['mp4', 'gif']) {
    const p = path.join(ICONE_DIR, `${GIF_NAME}.${ext}`)
    if (fs.existsSync(p)) return p
  }
  return null
}

const handler = async (m, { conn }) => {
  const users = global.db.data.users
  const mention = m.mentionedJid?.[0] || m.quoted?.sender
  const who = mention || m.sender

  if (!users[who]) {
    users[who] = {
      sposato: false,
      coniuge: null,
      ex: [],
      adottati: [],
      miglioreamico: null
    }
  }

  const user = users[who]
  const tag = '@' + who.split('@')[0]
  const tagOf = (j) => '@' + j.split('@')[0]

  let adottatoDa = null
  for (const jid in users) {
    if (users[jid].adottati?.includes(who)) {
      adottatoDa = jid
      break
    }
  }

  const exList = (user.ex || []).map(tagOf)
  const adopList = (user.adottati || []).map(tagOf)

  let pic
  try {
    pic = await conn.profilePictureUrl(who, 'image')
  } catch {
    pic = 'https://telegra.ph/file/17e7701f8b0a63806e312.png'
  }

  const ppBuffer = await (await fetch(pic)).buffer()

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: '888Famiglia'
    },
    message: {
      locationMessage: {
        name: `『 𝐅𝐀𝐌𝐈𝐆𝐋𝐈𝐀 』 ${tag}`,
        jpegThumbnail: ppBuffer.toString('base64'),
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Famiglia;;;\nFN:Famiglia\nEND:VCARD'
      }
    },
    participant: '0@s.whatsapp.net'
  }

  const testo =
`👨‍👩‍👧 *𝐅𝐀𝐌𝐈𝐆𝐋𝐈𝐀 𝟖𝟖𝟖*

👤 *Utente:* ${tag}

💍 *𝐌𝐀𝐓𝐑𝐈𝐌𝐎𝐍𝐈𝐎*
• *Sposato:* ${user.sposato ? 'Sì' : 'No'}
• *Coniuge:* ${user.coniuge ? tagOf(user.coniuge) : 'Nessuno'}
• *Ex:* ${exList.length ? exList.join(', ') : 'Nessuno'}

👪 *𝐅𝐀𝐌𝐈𝐆𝐋𝐈𝐀*
• *Adottato da:* ${adottatoDa ? tagOf(adottatoDa) : 'Nessuno'}
• *Figli:* ${adopList.length ? adopList.join(', ') : 'Nessuno'}

⭐ *𝐀𝐌𝐈𝐂𝐈𝐙𝐈𝐀*
• *Migliore amico:* ${user.miglioreamico ? tagOf(user.miglioreamico) : 'Nessuno'}`

  const mentions = [
    who,
    user.coniuge,
    user.miglioreamico,
    adottatoDa,
    ...(user.ex || []),
    ...(user.adottati || [])
  ].filter(Boolean)

  const gifPath = findGif()

  if (gifPath) {
    try {
      await conn.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(gifPath),
          gifPlayback: true,
          caption: testo,
          mentions
        },
        { quoted: fake }
      )
      return
    } catch {}
  }

  await conn.sendMessage(m.chat, { text: testo, mentions }, { quoted: fake })
}

handler.help = ['famiglia']
handler.tags = ['fun']
handler.command = ['famiglia']

export default handler