// by Elixir, Punisher & 888 staff
import fetch from 'node-fetch'

const apis = {
  sra: 'https://api.some-random-api.com/canvas/'
}

const effetti = {
  wasted: { api: 'sra', path: 'overlay/wasted' },
  bisex: { api: 'sra', path: 'misc/bisexual' },
  comunista: { api: 'sra', path: 'overlay/comrade' },
  simpcard: { api: 'sra', path: 'misc/simpcard' }
}

const S = v => String(v || '')

let handler = async (m, { conn, usedPrefix, command }) => {
  const effect = S(command).toLowerCase()
  const config = effetti[effect]

  if (!config) {
    return m.reply('*𝐄𝐟𝐟𝐞𝐭𝐭𝐨 𝐧𝐨𝐧 𝐭𝐫𝐨𝐯𝐚𝐭𝐨 𝐨 𝐧𝐨𝐧 𝐬𝐮𝐩𝐩𝐨𝐫𝐭𝐚𝐭𝐨.*')
  }

  const who = m.quoted?.sender || m.mentionedJid?.[0] || m.sender

  if (!who) {
    return m.reply(`*𝐓𝐚𝐠𝐠𝐚 𝐪𝐮𝐚𝐥𝐜𝐮𝐧𝐨 𝐨 𝐫𝐢𝐬𝐩𝐨𝐧𝐝𝐢 𝐚 𝐮𝐧 𝐦𝐞𝐬𝐬𝐚𝐠𝐠𝐢𝐨.*

*𝐄𝐬𝐞𝐦𝐩𝐢𝐨:* ${usedPrefix + effect} @user`)
  }

  try {
    const pp = await conn.profilePictureUrl(who, 'image').catch(() => null)

    if (!pp) {
      const notification = who === m.sender
        ? '*𝐍𝐨𝐧 𝐡𝐚𝐢 𝐮𝐧𝐚 𝐟𝐨𝐭𝐨 𝐩𝐫𝐨𝐟𝐢𝐥𝐨.*'
        : `*@${who.split('@')[0]} 𝐧𝐨𝐧 𝐡𝐚 𝐮𝐧𝐚 𝐟𝐨𝐭𝐨 𝐩𝐫𝐨𝐟𝐢𝐥𝐨.*`

      return m.reply(notification, null, { mentions: [who] })
    }

    const url = new URL(config.path, apis[config.api])
    url.searchParams.set('avatar', pp)

    const res = await fetch(url.toString())

    if (!res.ok) {
      throw new Error(`API ${res.status}`)
    }

    const buffer = Buffer.from(await res.arrayBuffer())

    if (!buffer || buffer.length < 100) {
      throw new Error('Buffer non valido')
    }

    await conn.sendMessage(
      m.chat,
      {
        image: buffer,
        caption: `*╭━━━━━━━🖼️━━━━━━━╮*
*✦ 𝐄𝐅𝐅𝐄𝐓𝐓𝐎 𝐀𝐏𝐏𝐋𝐈𝐂𝐀𝐓𝐎 ✦*
*╰━━━━━━━🖼️━━━━━━━╯*

*🎨 𝐄𝐟𝐟𝐞𝐭𝐭𝐨:* *${effect}*`,
        mentions: [who]
      },
      { quoted: m }
    )

  } catch (e) {
    console.error('Errore effettiimmagine:', e)
    m.reply('*𝐄𝐫𝐫𝐨𝐫𝐞 𝐝𝐮𝐫𝐚𝐧𝐭𝐞 𝐥’𝐚𝐩𝐩𝐥𝐢𝐜𝐚𝐳𝐢𝐨𝐧𝐞 𝐝𝐞𝐥𝐥’𝐞𝐟𝐟𝐞𝐭𝐭𝐨.*')
  }
}

handler.help = ['wasted', 'bisex', 'comunista', 'simpcard']
handler.tags = ['giochi']
handler.command = /^(wasted|bisex|comunista|simpcard)$/i

export default handler
