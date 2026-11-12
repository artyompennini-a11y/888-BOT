import fs from 'fs'

const GIF_PATH = './icone/sposa.mp4'

function getButtonId(message) {
  const native = message?.interactiveResponseMessage?.nativeFlowResponseMessage
  const paramsJson = native?.paramsJson
  if (typeof paramsJson === 'string' && paramsJson) {
    try {
      const params = JSON.parse(paramsJson)
      return params?.id ?? params?.selectedId ?? params?.selected_id ?? null
    } catch {
      return paramsJson
    }
  }

  return message?.buttonsResponseMessage?.selectedButtonId
    || message?.templateButtonReplyMessage?.selectedId
    || null
}

function collectMarriageResponse(conn, chat, target, validIds, timeoutMs) {
  let timeoutId
  let settled = false
  let finish

  const promise = new Promise(resolve => {
    finish = value => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      conn.ev.off('messages.upsert', listener)
      resolve(value)
    }

    const normalize = jid => {
      if (!jid) return ''
      return typeof conn.decodeJid === 'function' ? conn.decodeJid(jid) : jid
    }

    const listener = ({ messages = [] } = {}) => {
      for (const msg of messages) {
        const replyChat = normalize(msg.key?.remoteJid)
        const replySender = normalize(msg.key?.participant || msg.key?.remoteJid)
        if (replyChat !== normalize(chat) || replySender !== normalize(target)) continue

        const id = getButtonId(msg.message)
        if (validIds.includes(id)) {
          finish(id)
          return
        }
      }
    }

    conn.ev.on('messages.upsert', listener)
    timeoutId = setTimeout(() => finish(null), timeoutMs)
  })

  return {
    promise,
    cancel: () => finish?.(null)
  }
}

let handler = async (m, { conn, command }) => {
  const users = global.db.data.users
  const sender = m.sender
  const target = m.mentionedJid?.[0] || m.quoted?.sender

  if (!users[sender]) users[sender] = {}
  const user = users[sender]

  if (command === 'sposa') {
    if (!target)
      return m.reply(
`❌ *Nessun utente taggato*
Tagga la persona che vuoi sposare.`
      )

    if (target === sender)
      return m.reply(
`❌ *Azione non consentita*
Non puoi sposare te stesso.`
      )

    if (!users[target]) users[target] = {}
    const partner = users[target]

    if (user.sposato && user.coniuge) {
      return conn.sendMessage(m.chat, {
        text:
`💀 *Sei già sposato*
Hai tradito @${user.coniuge.split('@')[0]}!`,
        mentions: [user.coniuge]
      }, { quoted: m })
    }

    if (partner.sposato) {
      return m.reply(
`❌ *Non disponibile*
Questa persona è già sposata.`
      )
    }

    const acceptedId = `accetta_${sender}`
    const rejectedId = `rifiuta_${sender}`
    const response = collectMarriageResponse(conn, m.chat, target, [acceptedId, rejectedId], 60000)

    try {
      await conn.sendMessage(m.chat, {
        text:
`💍 *Richiesta di matrimonio*
━━━━━━━━━━━━━━━━━━
@${target.split('@')[0]}
Hai ricevuto una proposta da:
➜ @${sender.split('@')[0]}

💌 Accetti la proposta?
⏳ Tempo: *60 secondi*`,
      mentions: [sender, target],
      buttons: [
        { buttonId: acceptedId, buttonText: { displayText: '💖 Accetta' }, type: 1 },
        { buttonId: rejectedId, buttonText: { displayText: '💔 Rifiuta' }, type: 1 }
      ],
      headerType: 1
      }, { quoted: m })
    } catch (error) {
      response.cancel()
      throw error
    }

    const collected = await response.promise

    if (!collected) {
      return conn.sendMessage(m.chat, {
        text:
`⏳ *Tempo scaduto*
@${target.split('@')[0]} non ha risposto.
Proposta annullata.`,
        mentions: [target]
      })
    }

    if (collected.startsWith('accetta')) {

      user.sposato = true
      user.coniuge = target
      user.ex = user.ex || []

      partner.sposato = true
      partner.coniuge = sender
      partner.ex = partner.ex || []

      const caption =
`💖 *Matrimonio celebrato*
@${sender.split('@')[0]}
     🤍
@${target.split('@')[0]}
━━━━━━━━━━━━━━━━━━
✨ *Si sono sposati!* ✨
💣 Il matrimonio durerà 5 minuti.`

      if (fs.existsSync(GIF_PATH)) {
        await conn.sendMessage(m.chat, {
          video: fs.readFileSync(GIF_PATH),
          gifPlayback: true,
          caption,
          mentions: [sender, target]
        })
      } else {
        await conn.sendMessage(m.chat, { text: caption, mentions: [sender, target] })
      }

    } else {
      await conn.sendMessage(m.chat, {
        text:
`💔 *Rifiuto matrimonio*
@${target.split('@')[0]} ha rifiutato.`,
        mentions: [target]
      })
    }
  }

  if (command === 'divorzia') {
    if (!user.sposato || !user.coniuge)
      return m.reply(
`❌ *Non sei sposato*
Non puoi divorziare se non sei sposato.`
      )

    const ex = user.coniuge
    if (!users[ex]) users[ex] = {}
    const exUser = users[ex]

    user.ex = user.ex || []
    exUser.ex = exUser.ex || []

    user.ex.push(ex)
    exUser.ex.push(sender)

    user.sposato = false
    user.coniuge = null

    exUser.sposato = false
    exUser.coniuge = null

    await conn.sendMessage(m.chat, {
      text:
`💔 *Divorzio ufficiale*
@${sender.split('@')[0]}
      💔
@${ex.split('@')[0]}
━━━━━━━━━━━━━━━━━━
*La relazione è terminata.*`,
      mentions: [sender, ex]
    })
  }
}

handler.help = ['sposa @tag', 'divorzia']
handler.command = ['sposa', 'divorzia']
handler.tags = ['RPG']
handler.group = true

export default handler