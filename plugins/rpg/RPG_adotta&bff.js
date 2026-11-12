const getButtonId = message => {
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

const normalizeJid = (conn, jid) => {
  if (!jid) return ''
  return typeof conn.decodeJid === 'function' ? conn.decodeJid(jid) : jid
}

const waitButton = (conn, chatId, target, time = 60000) => {
  let timeoutId
  let settled = false
  let finish

  const promise = new Promise(resolve => {
    const normalizedChat = normalizeJid(conn, chatId)
    const normalizedTarget = normalizeJid(conn, target)

    const listener = ({ messages = [] } = {}) => {
      for (const msg of messages) {
        const chat = normalizeJid(conn, msg.key?.remoteJid)
        const from = normalizeJid(conn, msg.key?.participant || msg.key?.remoteJid)
        if (chat !== normalizedChat || from !== normalizedTarget) continue

        const buttonId = getButtonId(msg.message)
        if (buttonId === 'yes' || buttonId === 'no') {
          finish(buttonId)
          return
        }
      }
    }

    finish = value => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      conn.ev.off('messages.upsert', listener)
      resolve(value)
    }

    conn.ev.on('messages.upsert', listener)
    timeoutId = setTimeout(() => finish(null), time)
  })

  return {
    promise,
    cancel: () => finish?.(null)
  }
}

// ───────────────────────────────
// 👶 ADOZIONE — 888
// ───────────────────────────────
const adottaHandler = async (m, { conn }) => {
  const users = global.db.data.users
  const mention = m.mentionedJid[0] || m.quoted?.sender

  if (!mention)
    return conn.reply(m.chat, `
❌ *Nessun utente taggato*
Tagga la persona che vuoi adottare.
`.trim())

  if (mention === m.sender)
    return conn.reply(m.chat, `
❌ *Azione non consentita*
Non puoi adottare te stesso.
`.trim())

  if (!users[m.sender]) users[m.sender] = {}
  if (!users[mention]) users[mention] = {}

  const adopter = users[m.sender]
  adopter.adottati = adopter.adottati || []

  if (adopter.adottati.includes(mention))
    return conn.reply(m.chat, `
⚠️ *Adozione non valida*
Hai già adottato questa persona.
`.trim())

  const response = waitButton(conn, m.chat, mention)
  try {
    await conn.sendMessage(m.chat, {
      text: `
👶 *Richiesta di adozione*
@${m.sender.split('@')[0]} vuole adottarti.

Scegli un'opzione:
`.trim(),
    mentions: [mention, m.sender],
    buttons: [
      { buttonId: 'yes', buttonText: { displayText: '✅ Accetta' }, type: 1 },
      { buttonId: 'no',  buttonText: { displayText: '❌ Rifiuta' }, type: 1 }
    ],
    headerType: 1
    }, { quoted: m })
  } catch (error) {
    response.cancel()
    throw error
  }

  const res = await response.promise

  if (!res)
    return conn.reply(m.chat, `
⏳ *Tempo scaduto*
Nessuna risposta ricevuta.
`.trim())

  if (res === 'yes') {
    adopter.adottati.push(mention)
    return conn.sendMessage(m.chat, {
      text: `
👶 *Adozione completata*
@${mention.split('@')[0]} ora è figlio adottivo di @${m.sender.split('@')[0]}.
`.trim(),
      mentions: [mention, m.sender]
    })
  }

  return conn.sendMessage(m.chat, {
    text: `
❌ *Adozione rifiutata*
@${mention.split('@')[0]} ha rifiutato.
`.trim(),
    mentions: [mention]
  })
}

// ───────────────────────────────
// 🤝 MIGLIORE AMICO — 888
// ───────────────────────────────
const miglioreamicoHandler = async (m, { conn }) => {
  const users = global.db.data.users
  const mention = m.mentionedJid[0] || m.quoted?.sender

  if (!mention)
    return conn.reply(m.chat, `
❌ *Nessun utente taggato*
Tagga la persona che vuoi aggiungere come BFF.
`.trim())

  if (mention === m.sender)
    return conn.reply(m.chat, `
❌ *Azione non consentita*
Non puoi essere migliore amico di te stesso.
`.trim())

  if (!users[m.sender]) users[m.sender] = {}
  if (!users[mention]) users[mention] = {}

  const requester = users[m.sender]
  const target = users[mention]

  if (requester.miglioreamico === mention)
    return conn.reply(m.chat, `
⚠️ *Già migliori amici*
Siete già BFF.
`.trim())

  const response = waitButton(conn, m.chat, mention)
  try {
    await conn.sendMessage(m.chat, {
      text: `
🤝 *Richiesta migliore amico*
@${m.sender.split('@')[0]} vuole diventare il tuo BFF.

Scegli un'opzione:
`.trim(),
    mentions: [mention, m.sender],
    buttons: [
      { buttonId: 'yes', buttonText: { displayText: '✅ Accetta' }, type: 1 },
      { buttonId: 'no',  buttonText: { displayText: '❌ Rifiuta' }, type: 1 }
    ],
    headerType: 1
    }, { quoted: m })
  } catch (error) {
    response.cancel()
    throw error
  }

  const res = await response.promise

  if (!res)
    return conn.reply(m.chat, `
⏳ *Tempo scaduto*
Nessuna risposta ricevuta.
`.trim())

  if (res === 'yes') {
    requester.miglioreamico = mention
    target.miglioreamico = m.sender

    return conn.sendMessage(m.chat, {
      text: `
🤝 *Nuovi migliori amici*
@${m.sender.split('@')[0]} e @${mention.split('@')[0]} ora sono BFF.
`.trim(),
      mentions: [mention, m.sender]
    })
  }

  return conn.sendMessage(m.chat, {
    text: `
❌ *Richiesta BFF rifiutata*
@${mention.split('@')[0]} ha rifiutato.
`.trim(),
    mentions: [mention]
  })
}

// ───────────────────────────────
// ❌ RIMOZIONE FIGLIO — 888
// ───────────────────────────────
const togliAdottaHandler = async (m, { conn }) => {
  const users = global.db.data.users
  const mention = m.mentionedJid[0] || m.quoted?.sender

  if (!mention)
    return conn.reply(m.chat, `
❌ *Nessun utente taggato*
Tagga il figlio da rimuovere.
`.trim())

  const adopter = users[m.sender]
  adopter.adottati = adopter.adottati || []

  if (!adopter.adottati.includes(mention))
    return conn.reply(m.chat, `
❌ *Non è tuo figlio*
Non risulta adottato da te.
`.trim())

  adopter.adottati = adopter.adottati.filter(u => u !== mention)

  return conn.sendMessage(m.chat, {
    text: `
❌ *Adozione revocata*
@${mention.split('@')[0]} non è più tuo figlio.
`.trim(),
    mentions: [mention]
  })
}

// ───────────────────────────────
// 💔 RIMOZIONE MIGLIORE AMICO — 888
// ───────────────────────────────
const togliMiglioreamicoHandler = async (m, { conn }) => {
  const users = global.db.data.users
  const requester = users[m.sender]

  if (!requester.miglioreamico)
    return conn.reply(m.chat, `
❌ *Nessun BFF*
Non hai un migliore amico.
`.trim())

  const ex = requester.miglioreamico

  requester.miglioreamico = null
  if (users[ex]) users[ex].miglioreamico = null

  return conn.sendMessage(m.chat, {
    text: `
💔 *Amicizia terminata*
@${ex.split('@')[0]} non è più il tuo migliore amico.
`.trim(),
    mentions: [ex]
  })
}

// ───────────────────────────────
// 🔥 HANDLER PRINCIPALE — 888
// ───────────────────────────────
let handler = async (m, { conn, command }) => {
  if (command === 'adotta') return adottaHandler(m, { conn })
  if (command === 'miglioreamico') return miglioreamicoHandler(m, { conn })
  if (command === 'togliadotta') return togliAdottaHandler(m, { conn })
  if (command === 'toglimiglioreamico') return togliMiglioreamicoHandler(m, { conn })
}

handler.command = ['adotta', 'miglioreamico', 'togliadotta', 'toglimiglioreamico']
handler.tags = ['RPG']
handler.help = ['adotta @user', 'miglioreamico @user']
handler.group = true

export default handler