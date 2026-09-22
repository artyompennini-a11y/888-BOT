// Plugin by Elixir
const tag = (jid = '') => '@' + String(jid).split('@')[0].split(':')[0]

function buildContextMsg(title) {
  return {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: 'CTX'
    },
    message: {
      locationMessage: {
        name: title
      }
    },
    participant: '0@s.whatsapp.net'
  }
}

function resolveTarget(m, text = '', botJid = '') {
  const ctx = m.message?.extendedTextMessage?.contextInfo || {}

  const numero = String(text || '').replace(/[^\d]/g, '')
  if (numero.length >= 5) return `${numero}@s.whatsapp.net`

  if (String(text || '').endsWith('@s.whatsapp.net') || String(text || '').endsWith('@c.us')) {
    return String(text).trim()
  }

  if (Array.isArray(m.mentionedJid) && m.mentionedJid.length) return m.mentionedJid[0]
  if (Array.isArray(ctx.mentionedJid) && ctx.mentionedJid.length) return ctx.mentionedJid[0]

  const quotedSender = m.quoted?.sender || m.quoted?.participant || ctx.participant
  if (quotedSender && quotedSender !== botJid) return quotedSender

  return null
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const chat = m.chat || m.key?.remoteJid
  if (!chat) return

  const sender = String(
    m.sender ||
    m.key?.participant ||
    m.participant ||
    (m.key?.fromMe ? conn?.user?.id : '')
  )

  const botJid = conn.user?.jid || conn.user?.id || ''
  const target = resolveTarget(m, text, botJid)
  const q = buildContextMsg('*🔥 𝐋𝐈𝐌𝐎𝐍𝐀 𝐀𝐏𝐏𝐀𝐒𝐒𝐎𝐍𝐀𝐓𝐎*')

  if (!target) {
    return conn.sendMessage(chat, {
      text: `*⚠️ 𝐃𝐞𝐯𝐢 𝐦𝐞𝐧𝐳𝐢𝐨𝐧𝐚𝐫𝐞 𝐪𝐮𝐚𝐥𝐜𝐮𝐧𝐨 𝐨 𝐫𝐢𝐬𝐩𝐨𝐧𝐝𝐞𝐫𝐞 𝐚 𝐮𝐧 𝐦𝐞𝐬𝐬𝐚𝐠𝐠𝐢𝐨 𝐩𝐞𝐫 𝐟𝐢𝐧𝐝𝐞 𝐥𝐚 𝐩𝐚𝐬𝐬𝐢𝐨𝐧𝐞 𝐜𝐨𝐧 𝐥𝐚 𝐥𝐢𝐦𝐨𝐧𝐚 𝐚𝐩𝐩𝐚𝐬𝐬𝐨𝐧𝐚𝐭𝐨 🍋🔥*\n\n*𝐄𝐬𝐞𝐦𝐩𝐢𝐨:*\n*${usedPrefix}${command} @utente*`,
      contextInfo: global.rcanal?.contextInfo || {}
    }, { quoted: q })
  }

  if (target === sender) {
    return conn.sendMessage(chat, {
      text: `*🔥🍋 ${tag(sender)} 𝐬𝐞 𝐢𝐦𝐦𝐨𝐥𝐚 𝐜𝐨𝐧 𝐬𝐞 𝐬𝐭𝐞𝐬𝐬𝐨 𝐟𝐢𝐧𝐝𝐞 𝐬𝐮 𝐬𝐭𝐞𝐬𝐬𝐨 🥵❤️‍🔥*`,
      contextInfo: {
        ...(global.rcanal?.contextInfo || {}),
        mentionedJid: [sender]
      },
      mentions: [sender]
    }, { quoted: q })
  }

  const senderNumero = String(sender).split('@')[0].split(':')[0]

  await conn.sendMessage(chat, {
    text: `*🍋🔥 ${tag(sender)} 𝐬𝐞 𝐢𝐦𝐦𝐨𝐥𝐚 𝐜𝐨𝐧 ${tag(target)} 𝐟𝐢𝐧𝐝𝐞 𝐥𝐚 𝐩𝐚𝐬𝐬𝐢𝐨𝐧𝐞 𝐜𝐨𝐫𝐬𝐢𝐯𝐚 𝐬𝐮 𝐬𝐭𝐞𝐬𝐬𝐨 𝐬𝐮 𝐥𝐚 𝐥𝐢𝐦𝐨𝐧𝐚 𝐚𝐩𝐩𝐚𝐬𝐬𝐨𝐧𝐚𝐭𝐨 🥵❤️‍🔥*`,
    contextInfo: {
      ...(global.rcanal?.contextInfo || {}),
      mentionedJid: [sender, target]
    },
    mentions: [sender, target],
    buttons: [
      {
        buttonId: `${usedPrefix}${command} ${senderNumero}`,
        buttonText: { displayText: '🔥 Ricambia la passione con la limona appassionata' },
        type: 1
      }
    ],
    headerType: 1
  }, { quoted: q })
}

handler.help = ['limona @user 🔥🍋']
handler.tags = ['fun']
handler.command = ['limona', 'limon_appassionato', 'limona_appassionata', 'limona_appassionato']
handler.group = true

export default handler
