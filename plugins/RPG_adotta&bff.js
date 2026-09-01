import fetch from 'node-fetch'

const waitButton = (conn, chatId, target, time = 60000) => {
  return new Promise(resolve => {
    const handler = async ({ messages }) => {
      const msg = messages[0]
      if (!msg?.message) return

      const from = msg.key.participant || msg.key.remoteJid
      if (from !== target) return

      const btn = msg.message?.buttonsResponseMessage?.selectedButtonId

      if (btn === 'yes' || btn === 'no') {
        conn.ev.off('messages.upsert', handler)
        resolve(btn)
      }
    }

    conn.ev.on('messages.upsert', handler)

    setTimeout(() => {
      conn.ev.off('messages.upsert', handler)
      resolve(null)
    }, time)
  })
}

// ─────────────────────────────────────────────
// 🔥 ADOZIONE — STILE 888
// ─────────────────────────────────────────────
const adottaHandler = async (m, { conn }) => {
  const users = global.db.data.users
  const mention = m.mentionedJid[0] || m.quoted?.sender

  if (!mention)
    return conn.reply(m.chat,
`╭━━━〔 ❌ *NESSUN UTENTE TAGGATO* 〕━━━┈
┃ Tagga la persona che vuoi adottare.
╰━━━━━━━━━━━━━━━━━━┈`)

  if (mention === m.sender)
    return conn.reply(m.chat,
`╭━━━〔 ❌ *AZIONE NON CONSENTITA* 〕━━━┈
┃ Non puoi adottare te stesso.
╰━━━━━━━━━━━━━━━━━━┈`)

  if (!users[m.sender]) users[m.sender] = {}
  if (!users[mention]) users[mention] = {}

  const adopter = users[m.sender]
  adopter.adottati = adopter.adottati || []

  if (adopter.adottati.includes(mention)) {
    return conn.reply(m.chat,
`╭━━━〔 ⚠️ *ADOZIONE NON VALIDA* 〕━━━┈
┃ Hai già adottato questa persona.
╰━━━━━━━━━━━━━━━━━━┈`)
  }

  await conn.sendMessage(m.chat, {
    text:
`╭━━━〔 👶 *RICHIESTA ADOZIONE* 〕━━━┈
┃ @${m.sender.split('@')[0]} vuole adottarti.
┃━━━━━━━━━━━━━━━━━━
┃ Premi un bottone per scegliere.
╰━━━━━━━━━━━━━━━━━━┈`,
    mentions: [mention, m.sender],
    buttons: [
      { buttonId: 'yes', buttonText: { displayText: '✅ Accetta' }, type: 1 },
      { buttonId: 'no', buttonText: { displayText: '❌ Rifiuta' }, type: 1 }
    ],
    headerType: 1
  }, { quoted: m })

  const res = await waitButton(conn, m.chat, mention)

  if (!res)
    return conn.reply(m.chat,
`╭━━━〔 ⏳ *TEMPO SCADUTO* 〕━━━┈
┃ Nessuna risposta ricevuta.
╰━━━━━━━━━━━━━━━━━━┈`)

  if (res === 'yes') {
    adopter.adottati.push(mention)
    return conn.sendMessage(m.chat, {
      text:
`╭━━━〔 👶 *ADOZIONE COMPLETATA* 〕━━━┈
┃ @${mention.split('@')[0]} ora è figlio adottivo di
┃ ➜ @${m.sender.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━┈`,
      mentions: [mention, m.sender]
    })
  } else {
    return conn.sendMessage(m.chat, {
      text:
`╭━━━〔 ❌ *RIFIUTO ADOZIONE* 〕━━━┈
┃ @${mention.split('@')[0]} ha rifiutato.
╰━━━━━━━━━━━━━━━━━━┈`,
      mentions: [mention]
    })
  }
}

// ─────────────────────────────────────────────
// 🔥 MIGLIORE AMICO — STILE 888
// ─────────────────────────────────────────────
const miglioreamicoHandler = async (m, { conn }) => {
  const users = global.db.data.users
  const mention = m.mentionedJid[0] || m.quoted?.sender

  if (!mention)
    return conn.reply(m.chat,
`╭━━━〔 ❌ *NESSUN UTENTE TAGGATO* 〕━━━┈
┃ Tagga la persona che vuoi aggiungere come BFF.
╰━━━━━━━━━━━━━━━━━━┈`)

  if (mention === m.sender)
    return conn.reply(m.chat,
`╭━━━〔 ❌ *AZIONE NON CONSENTITA* 〕━━━┈
┃ Non puoi essere migliore amico di te stesso.
╰━━━━━━━━━━━━━━━━━━┈`)

  if (!users[m.sender]) users[m.sender] = {}
  if (!users[mention]) users[mention] = {}

  const requester = users[m.sender]
  const target = users[mention]

  if (requester.miglioreamico === mention) {
    return conn.reply(m.chat,
`╭━━━〔 ⚠️ *GIÀ MIGLIORI AMICI* 〕━━━┈
┃ Siete già migliori amici.
╰━━━━━━━━━━━━━━━━━━┈`)
  }

  await conn.sendMessage(m.chat, {
    text:
`╭━━━〔 🤝 *RICHIESTA BFF* 〕━━━┈
┃ @${m.sender.split('@')[0]} vuole diventare
┃ il tuo migliore amico.
┃━━━━━━━━━━━━━━━━━━
┃ Premi un bottone per scegliere.
╰━━━━━━━━━━━━━━━━━━┈`,
    mentions: [mention, m.sender],
    buttons: [
      { buttonId: 'yes', buttonText: { displayText: '✅ Accetta' }, type: 1 },
      { buttonId: 'no', buttonText: { displayText: '❌ Rifiuta' }, type: 1 }
    ],
    headerType: 1
  }, { quoted: m })

  const res = await waitButton(conn, m.chat, mention)

  if (!res)
    return conn.reply(m.chat,
`╭━━━〔 ⏳ *TEMPO SCADUTO* 〕━━━┈
┃ Nessuna risposta ricevuta.
╰━━━━━━━━━━━━━━━━━━┈`)

  if (res === 'yes') {
    requester.miglioreamico = mention
    target.miglioreamico = m.sender

    return conn.sendMessage(m.chat, {
      text:
`╭━━━〔 🤝 *NUOVI MIGLIORI AMICI* 〕━━━┈
┃ @${m.sender.split('@')[0]} e @${mention.split('@')[0]}
┃ ora sono migliori amici.
╰━━━━━━━━━━━━━━━━━━┈`,
      mentions: [mention, m.sender]
    })
  } else {
    return conn.sendMessage(m.chat, {
      text:
`╭━━━〔 ❌ *RIFIUTO BFF* 〕━━━┈
┃ @${mention.split('@')[0]} ha rifiutato.
╰━━━━━━━━━━━━━━━━━━┈`,
      mentions: [mention]
    })
  }
}

// ─────────────────────────────────────────────
// 🔥 RIMOZIONE FIGLIO — 888
// ─────────────────────────────────────────────
const togliAdottaHandler = async (m, { conn }) => {
  const users = global.db.data.users
  const mention = m.mentionedJid[0] || m.quoted?.sender

  if (!mention)
    return conn.reply(m.chat,
`╭━━━〔 ❌ *NESSUN UTENTE TAGGATO* 〕━━━┈
┃ Tagga il figlio da rimuovere.
╰━━━━━━━━━━━━━━━━━━┈`)

  const adopter = users[m.sender]
  adopter.adottati = adopter.adottati || []

  if (!adopter.adottati.includes(mention)) {
    return conn.reply(m.chat,
`╭━━━〔 ❌ *NON È TUO FIGLIO* 〕━━━┈
┃ Non risulta adottato da te.
╰━━━━━━━━━━━━━━━━━━┈`)
  }

  adopter.adottati = adopter.adottati.filter(u => u !== mention)

  return conn.sendMessage(m.chat, {
    text:
`╭━━━〔 ❌ *ADOZIONE REVOCATA* 〕━━━┈
┃ @${mention.split('@')[0]} non è più tuo figlio.
╰━━━━━━━━━━━━━━━━━━┈`,
    mentions: [mention]
  })
}

// ─────────────────────────────────────────────
// 🔥 RIMOZIONE MIGLIORE AMICO — 888
// ─────────────────────────────────────────────
const togliMiglioreamicoHandler = async (m, { conn }) => {
  const users = global.db.data.users
  const requester = users[m.sender]

  if (!requester.miglioreamico) {
    return conn.reply(m.chat,
`╭━━━〔 ❌ *NESSUN BFF* 〕━━━┈
┃ Non hai un migliore amico.
╰━━━━━━━━━━━━━━━━━━┈`)
  }

  const ex = requester.miglioreamico

  requester.miglioreamico = null
  if (users[ex]) users[ex].miglioreamico = null

  return conn.sendMessage(m.chat, {
    text:
`╭━━━〔 💔 *AMICIZIA TERMINATA* 〕━━━┈
┃ @${ex.split('@')[0]} non è più il tuo migliore amico.
╰━━━━━━━━━━━━━━━━━━┈`,
    mentions: [ex]
  })
}

// ─────────────────────────────────────────────
// 🔥 HANDLER PRINCIPALE — 888
// ─────────────────────────────────────────────
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