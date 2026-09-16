let handler = async (m, { conn, command }) => {
  const users = global.db.data.users
  const sender = m.sender
  const target = m.mentionedJid?.[0] || m.quoted?.sender

  if (!users[sender]) users[sender] = {}
  const user = users[sender]

  // SPOSA — 888 Minimal
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

    // Richiesta matrimonio — 888 Minimal
    const msg = await conn.sendMessage(m.chat, {
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
        { buttonId: `accetta_${sender}`, buttonText: { displayText: '💖 Accetta' }, type: 1 },
        { buttonId: `rifiuta_${sender}`, buttonText: { displayText: '💔 Rifiuta' }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })

    // Attesa risposta
    const collected = await new Promise(resolve => {
      const listener = async ({ messages }) => {
        const msg = messages[0]
        if (!msg?.message) return

        const from = msg.key.participant || msg.key.remoteJid
        if (from !== target) return

        const id = msg.message?.buttonsResponseMessage?.selectedButtonId
        if (!id) return

        if (id === `accetta_${sender}` || id === `rifiuta_${sender}`) {
          conn.ev.off('messages.upsert', listener)
          resolve(id)
        }
      }

      conn.ev.on('messages.upsert', listener)

      setTimeout(() => {
        conn.ev.off('messages.upsert', listener)
        resolve(null)
      }, 60000)
    })

    if (!collected) {
      return conn.sendMessage(m.chat, {
        text:
`⏳ *Tempo scaduto*
@${target.split('@')[0]} non ha risposto.
Proposta annullata.`,
        mentions: [target]
      })
    }

    // Matrimonio accettato
    if (collected.startsWith('accetta')) {

      user.sposato = true
      user.coniuge = target
      user.ex = user.ex || []

      partner.sposato = true
      partner.coniuge = sender
      partner.ex = partner.ex || []

      await conn.sendMessage(m.chat, {
        text:
`💖 *Matrimonio celebrato*
@${sender.split('@')[0]}
     🤍
@${target.split('@')[0]}
━━━━━━━━━━━━━━━━━━
✨ *Si sono sposati!* ✨
💣 Il matrimonio durerà 5 minuti.`,
        mentions: [sender, target]
      })

    } else {
      // Matrimonio rifiutato
      await conn.sendMessage(m.chat, {
        text:
`💔 *Rifiuto matrimonio*
@${target.split('@')[0]} ha rifiutato.`,
        mentions: [target]
      })
    }
  }

  // DIVORZIA — 888 Minimal
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