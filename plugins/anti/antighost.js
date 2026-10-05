// Plugin by elixir
const DEFAULT_WINDOW = 30
const MAX_CACHED_MESSAGES = 1500
const CACHE_TTL = 60 * 60 * 1000

const messageCache = global.antighostCache ??= new Map()

const cacheSet = (key, value) => {
  messageCache.set(key, value)

  while (messageCache.size > MAX_CACHED_MESSAGES) {
    const oldest = messageCache.keys().next().value
    messageCache.delete(oldest)
  }
}

const cacheGet = key => {
  const entry = messageCache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.storedAt > CACHE_TTL) {
    messageCache.delete(key)
    return undefined
  }
  return entry
}

const cacheDel = key => messageCache.delete(key)

const digits = (jid = '') =>
  String(jid ?? '').split('@')[0].split(':')[0].replace(/\D+/g, '')

const isOwnerOfBot = jid => {
  const target = digits(jid)
  if (!target) return false
  return (global.owner || []).some(entry => {
    const raw = Array.isArray(entry) ? entry[0] : entry
    return digits(String(raw ?? '')) === target
  })
}

const configOf = chat => {
  const c = global.db?.data?.chats?.[chat] || {}
  const rawWindow = Number(c.antighostWindow)
  return {
    enabled: c.antighost === true,
    
    silent: c.antighostIgnore === true,
    window: Number.isFinite(rawWindow) && rawWindow > 0 ? rawWindow : DEFAULT_WINDOW
  }
}

const extractText = msg => {
  const message = msg?.message || {}
  if (typeof message.conversation === 'string') return message.conversation
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text
  if (message.imageMessage?.caption) return message.imageMessage.caption
  if (message.videoMessage?.caption) return message.videoMessage.caption
  if (message.documentMessage?.caption) return message.documentMessage.caption
  if (message.audioMessage?.caption) return message.audioMessage.caption
  if (message.stickerMessage) return '[sticker]'
  return ''
}


const extractMentions = msg => {
  const message = msg?.message || {}
  const jids = []
  const push = value => {
    if (Array.isArray(value)) {
      for (const jid of value) if (typeof jid === 'string' && jid) jids.push(jid)
    } else if (typeof value === 'string' && value) {
      jids.push(value)
    }
  }

  push(message.contextInfo?.mentionedJid)
  push(message.extendedTextMessage?.contextInfo?.mentionedJid)
  push(message.imageMessage?.contextInfo?.mentionedJid)
  push(message.videoMessage?.contextInfo?.mentionedJid)
  push(message.documentMessage?.contextInfo?.mentionedJid)
  push(message.audioMessage?.contextInfo?.mentionedJid)


  const text = extractText(msg)
  const textMentions = text.match(/@(\d{8,15})/g)
  if (textMentions) {
    for (const raw of textMentions) push(raw.slice(1) + '@s.whatsapp.net')
  }

  return [...new Set(jids)]
}

const saveMessage = msg => {
  const remoteJid = msg?.key?.remoteJid
  const id = msg?.key?.id
  if (!remoteJid || !id) return
  if (!remoteJid.endsWith('@g.us')) return
  if (msg.key?.fromMe) return

  const sender = msg.key.participant || remoteJid
  if (!sender || !sender.endsWith('@s.whatsapp.net')) return

  cacheSet(`${remoteJid}|${id}`, {
    chat: remoteJid,
    id,
    sender,
    pushName: msg.pushName || null,
    text: extractText(msg),
    mentions: extractMentions(msg),
    timestamp: Number(msg.messageTimestamp || msg.message?.timestamp || Date.now()),
    storedAt: Date.now()
  })
}


const extractRevokeKey = raw => {
  const protoMsg = raw?.message?.protocolMessage
  const type = protoMsg?.type
  const isRevoke = type === 'REVOKE' || type === 0
  const isStub = raw?.messageStubType === 68
  if (!isRevoke && !isStub) return null

  const origKey = protoMsg?.key || {}
  return {
    remoteJid: origKey.remoteJid || raw?.key?.remoteJid,
    id: origKey.id || raw?.key?.id,
    participant: origKey.participant || raw?.key?.participant,
    fromMe: origKey.fromMe ?? raw?.key?.fromMe ?? false
  }
}


const handledRevokes = global.antighostHandled ??= new Map()

const alreadyHandled = key => {
  const cacheKey = `${key.remoteJid}|${key.id}`
  if (handledRevokes.has(cacheKey)) return true
  handledRevokes.set(cacheKey, Date.now())

  if (handledRevokes.size > 2000) {
    const now = Date.now()
    for (const [k, at] of handledRevokes) {
      if (now - at > 60 * 60 * 1000) handledRevokes.delete(k)
    }
  }
  return false
}


const loadOriginal = async (conn, key) => {
  const cached = cacheGet(`${key.remoteJid}|${key.id}`)
  if (cached) return { ...cached, fromCache: true }

  try {
    let raw = null
    if (global.store?.getMessage) raw = await global.store.getMessage(key)
    else if (global.store?.loadMessage) raw = await global.store.loadMessage(conn.decodeJid(key.remoteJid), key.id)
    else if (typeof conn.loadMessage === 'function') raw = await conn.loadMessage(key.id)

    if (!raw) return null

    return {
      chat: raw.key?.remoteJid || key.remoteJid,
      id: raw.key?.id || key.id,
      sender: raw.key?.participant || key.participant,
      pushName: raw.pushName || null,
      text: extractText(raw),
      mentions: extractMentions(raw),
      timestamp: Number(raw.messageTimestamp || raw.message?.timestamp || Date.now()),
      fromCache: false
    }
  } catch {
    return null
  }
}

const formatSeconds = ms => {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

const handleRevoke = async (conn, key) => {
  if (!key?.remoteJid || !key?.id) return
  if (!key.remoteJid.endsWith('@g.us')) return
  if (key.fromMe) return

  const cfg = configOf(key.remoteJid)
  if (!cfg.enabled) return

  const original = await loadOriginal(conn, key)
  if (!original) return

  if (alreadyHandled(key)) return

 
  const targets = (original.mentions || []).filter(jid => {
    const d = digits(jid)
    return d && !isOwnerOfBot(jid) && d !== digits(conn.user?.jid)
  })
  const hasText = Boolean(original.text && original.text.trim())

  if (!targets.length && !hasText) return

  const elapsed = Date.now() - original.timestamp

  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > cfg.window * 1000) return

  const sender = original.sender || key.participant
  if (!sender || !sender.endsWith('@s.whatsapp.net')) return
  if (isOwnerOfBot(sender)) return

  const victimList = targets.length
    ? targets.map(jid => '@' + digits(jid)).join(', ')
    : 'nessuno (messaggio testuale)'
  const body = (original.text || '').trim() || '[contenuto non testuale]'


  let kicked = false
  let kickError = null

  if (!cfg.silent) {
    try {
      const meta = await conn.groupMetadata(key.remoteJid).catch(() => null)
      const botIsAdmin = !!meta?.participants?.some(p => {
        const pid = conn.decodeJid(p.jid || p.id)
        return pid === conn.decodeJid(conn.user?.jid) && (p.admin === 'admin' || p.admin === 'superadmin')
      })
      if (!botIsAdmin) {
        kickError = 'il bot non è admin'
      } else {
        await conn.groupParticipantsUpdate(key.remoteJid, [sender], 'remove')
        kicked = true
      }
    } catch (e) {
      kickError = e?.message || 'errore sconosciuto'
    }
  }

  const statusText = cfg.silent
    ? '📝 Cronaca registrata (modalità ignora)'
    : kicked
      ? '🚫 *UTENTE RIMOSSO*'
      : `⚠️ Rimozione non riuscita (${kickError || 'ignota'})`

  await conn.sendMessage(key.remoteJid, {
    text:
`🕵️ *ANTIGHOST — MESSAGGIO FANTASMA*
━━━━━━━━━━━━━━━━━━━━━━
👤 Autore: @${sender.split('@')[0]}
📝 Contenuto eliminato:
\`${body.replace(/```/g, "'''").slice(0, 400)}\`
🔔 Tag colpiti: ${victimList}
⏱️ Cancellato dopo: *${formatSeconds(elapsed)}*
${statusText}
━━━━━━━━━━━━━━━━━━━━━━
🔐 *888 SECURITY*`,
    mentions: [sender, ...targets]
  }).catch(e => console.error('[antighost] send failed:', e?.message || e))


  try {
    if (global.db?.data) {
      if (!global.db.data.chats) global.db.data.chats = {}
      const chat = global.db.data.chats[key.remoteJid] ??= {}
      if (!chat.antighostLog) chat.antighostLog = []
      chat.antighostLog.push({
        at: Date.now(),
        user: sender,
        name: original.pushName || null,
        text: body.slice(0, 400),
        targets: targets.map(digits),
        elapsedMs: elapsed,
        removed: kicked
      })
      if (chat.antighostLog.length > 50) chat.antighostLog.splice(0, chat.antighostLog.length - 50)
    }
  } catch {}

  cacheDel(`${key.remoteJid}|${key.id}`)
}

const attachListeners = () => {
  if (!global.conn?.ev?.on) return false
  if (global.antighostListenerInitialized) return true
  const conn = global.conn

  conn.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages || []) {
      try {
  
        const revokeKey = extractRevokeKey(msg)
        if (revokeKey) {
          handleRevoke(conn, revokeKey)
          continue
        }
        saveMessage(msg)
      } catch (e) {
        console.error('[antighost] saveMessage error', e?.message || e)
      }
    }
  })

  conn.ev.on('messages.update', async (updates) => {
    for (const update of updates || []) {
      try {
       
        const revokeKey = extractRevokeKey({ message: update?.update?.message, key: update?.key })
        if (revokeKey) await handleRevoke(conn, revokeKey)
      } catch (e) {
        console.error('[antighost] handleRevoke error', e?.message || e)
      }
    }
  })

  global.antighostListenerInitialized = true
  return true
}

const initPlugin = () => {
  if (attachListeners()) return
  let attempts = 0
  const maxAttempts = 10
  const interval = setInterval(() => {
    attempts++
    if (attachListeners()) clearInterval(interval)
    else if (attempts >= maxAttempts) {
      clearInterval(interval)
      console.warn('[antighost] Listener attachment failed after', maxAttempts, 'attempts')
    }
  }, 1000)
}

initPlugin()

const handler = async (m, { args, isAdmin, isOwner, isROwner }) => {
  if (!m.isGroup) return m.reply('❌ Questo comando funziona solo nei gruppi.')

  const sub = (args[0] || '').toLowerCase()

  if (!isAdmin && !isOwner && !isROwner) {
    return m.reply('⛔ Non hai abbastanza aura per usare questo comando.')
  }

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
  const chat = global.db.data.chats[m.chat]

  if (sub === 'on' || sub === 'attiva') {
    chat.antighost = true
    return m.reply(`🟩 *ANTIGHOST ATTIVATO*\nSoglia: *${chat.antighostWindow || DEFAULT_WINDOW}s*\nI ghost msg verranno segnalati e l'autore rimosso.`)
  }

  if (sub === 'off' || sub === 'disattiva') {
    chat.antighost = false
    return m.reply('🟥 *ANTIGHOST DISATTIVATO*')
  }

  if (sub === 'ignora') {
    chat.antighostIgnore = !chat.antighostIgnore
    return m.reply(chat.antighostIgnore
      ? '📝 *Modalità IGNORA attivata:* i ghost msg vengono solo segnalati, nessuna rimozione.'
      : '🚫 *Modalità IGNORA disattivata:* gli autori dei ghost msg verranno rimossi.')
  }

  if (sub === 'tempo') {
    const seconds = Number(args[1])
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return m.reply('⚠️ Uso corretto: `.antighost tempo <secondi>`\nEsempio: `.antighost tempo 45`')
    }
    chat.antighostWindow = seconds
    return m.reply(`⏱️ Soglia ANTIGHOST impostata a *${seconds}s*.`)
  }

  const cfg = configOf(m.chat)
  const logCount = chat.antighostLog?.length || 0

  return m.reply(
`🕵️ *ANTIGHOST 888*
━━━━━━━━━━━━━━━━━━
🟩 Attivo: *${cfg.enabled ? 'SI' : 'NO'}*
⏱️ Soglia: *${cfg.window}s*
📝 Solo segnalazione: *${cfg.silent ? 'SI' : 'NO'}*
📋 Cronaca salvata: *${logCount}*

*Comandi:*
• \`.antighost on\` / \`.antighost off\`
• \`.antighost tempo <secondi>\`
• \`.antighost ignora\`

🔐 *888 SECURITY*`
  )
}

handler.help = ['antighost']
handler.tags = ['anti']
handler.command = /^antighost$/i
handler.group = true
handler.admin = true

export default handler