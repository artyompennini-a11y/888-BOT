//Plugin by Elixir, Punisher & 888 staff
const getAfkState = () => {
  global.afkState = global.afkState || {}
  return global.afkState
}

const getPendingState = () => {
  global.afkPending = global.afkPending || {}
  return global.afkPending
}

const formatMention = (jid = '') => `@${jid.split('@')[0]}`

const formatDuration = (ms) => {
  const seconds = Math.floor((ms / 1000) % 60)
  const minutes = Math.floor((ms / (1000 * 60)) % 60)
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))

  const parts = []
  if (days > 0) parts.push(`${days}g`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0) parts.push(`${seconds}s`)

  return parts.length > 0 ? parts.join(' ') : '0s'
}

const handler = async (m, { conn, text, command }) => {
  const afkState = getAfkState()
  const pendingState = getPendingState()

  if (command === 'afk') {
    const reason = (text || '').trim() || 'nessun motivo specificato'

    pendingState[m.sender] = { reason, chat: m.chat, at: Date.now() }

    return conn.sendMessage(m.chat, {
      text: `🌙 **Modalità AFK**

📝 Motivo impostato:
«${reason}»

Scegli dove attivare la modalità:
📍 *Questo gruppo*
🌍 *Tutti i gruppi*

888 • AFK Module`,
      footer: '888',
      buttons: [
        { buttonId: '.afk_scope group', buttonText: { displayText: '📍 Su questo gruppo' }, type: 1 },
        { buttonId: '.afk_scope all', buttonText: { displayText: '🌍 Su tutti i gruppi' }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }

  if (command === 'afk_scope') {
    const pending = pendingState[m.sender]
    if (!pending) return conn.reply(m.chat, '⚠️ Non hai una richiesta AFK in corso.', m)

    const scope = (text || '').trim().toLowerCase() === 'all' ? 'all' : 'group'
    afkState[m.sender] = {
      reason: pending.reason,
      scope,
      chat: m.chat,
      at: Date.now()
    }
    delete pendingState[m.sender]

    return conn.sendMessage(m.chat, {
      text: `✅ **AFK attivato!**

📌 Ambito: ${scope === 'all' ? '🌍 *Tutti i gruppi*' : '📍 *Questo gruppo*'}
📝 Motivo: «${afkState[m.sender].reason}»

🔕 Non verrai incluso negli hidetag.
😴 Buon riposo ${formatMention(m.sender)}.

888 • AFK Engine`,
      mentions: [m.sender]
    }, { quoted: m })
  }
}

handler.before = async (m, { conn }) => {
  const afkState = getAfkState()
  const pendingState = getPendingState()
  const botJid = conn?.user?.jid

  if (!m?.sender || m.sender === botJid || m.fromMe || m.key?.fromMe) return false

  const cleanCmd = (m.text || '').replace(/^[.!/#]/, '').split(/\s+/)[0] || ''
  const isAfkRelated = /^(afk|afk_scope)$/i.test(cleanCmd)

  // L'utente AFK scrive di nuovo -> bentornato e rimuovi AFK
  if (afkState[m.sender] && !isAfkRelated) {
    const duration = formatDuration(Date.now() - afkState[m.sender].at)
    delete afkState[m.sender]
    delete pendingState[m.sender]
    await conn.sendMessage(m.chat, {
      text: `🌅 **Bentornato ${formatMention(m.sender)}!**

⏱️ Sei stato AFK per:
➡️ *${duration}*

Spero tu abbia ricaricato le energie ⚡

888 • AFK Recovery`,
      mentions: [m.sender]
    }, { quoted: m }).catch(() => {})
    return false
  }

  // NIENTE SPAM: nessuna notifica quando qualcuno menziona un utente AFK.
  // L'esclusione avviene in silenzio dentro gp-hidetag.js
  // che filtra global.afkState prima di taggare.
  return false
}

handler.command = /^(afk|afk_scope)$/i
handler.help = ['afk [motivo]']
handler.tags = ['fun']
handler.modoadminBypass = true

export default handler
