// Plugin by elixir, punisher & 888 staff
import { isWhitelistedJid } from '../../lib/whitelist.js'
import { isBlacklisted } from '../../lib/blacklist.js'
import state from '../../lib/state.js'

const BLOCK_TTL = 24 * 60 * 60 * 1000

const DEFAULTS = {
  max: 5,
  window: 15000,
  punish: 'kick',
  silent: false,
  requests: true,
  pollMs: 30000,
  notifyCooldown: 60000
}

const kicks = {}
const notified = {}
let pollTimer = null
let scanning = {}

const keyFor = (chat) => String(chat).replace(/\./g, '_')

const blockedFor = (chat) => {
  const rec = state.get('security.raid.' + keyFor(chat))
  if (rec && Date.now() - (rec.at || 0) < BLOCK_TTL) return new Set(rec.list || [])
  return new Set()
}

const persistBlocked = (chat, set) => {
  state.set('security.raid.' + keyFor(chat), { list: [...set], at: Date.now() })
}

const digits = (jid = '') => String(jid ?? '').split('@')[0].split(':')[0].replace(/\D+/g, '')

const isOwnerOfBot = (jid) => {
  const target = digits(jid)
  if (!target) return false
  return (global.owner || []).some(entry => {
    const raw = Array.isArray(entry) ? entry[0] : entry
    return digits(String(raw ?? '')) === target
  })
}

const positive = (value, fallback) =>
  Number.isFinite(value) && value > 0 ? value : fallback

// FIX: "Connection Closed" (status 428 / socket chiuso da Baileys) è transitorio:
// non deve intasare la console a ogni poll sui gruppi. Lo silenziamo,
// gli altri errori restano visibili ma throttlati per non spammare.
const isConnClosed = (e) =>
  e?.output?.statusCode === 428 || /connection closed/i.test(e?.message || '')

const _errThrottle = {}
const logAntiRaidError = (tag, chat, e) => {
  if (isConnClosed(e)) return
  const key = `${tag}:${chat || ''}`
  const nowTs = Date.now()
  if (nowTs - (_errThrottle[key] || 0) < 60000) return
  _errThrottle[key] = nowTs
  console.error(`[antiRaid] ${tag}${chat ? ` in ${chat}` : ''}:`, e?.message || e)
}

const configOf = (chat = '') => {
  const chatData = global.db?.data?.chats?.[chat] || {}
  return {
    enabled: chatData.antiraid === true,
    max: positive(chatData.antiraidMax, DEFAULTS.max),
    window: positive(chatData.antiraidWindow, DEFAULTS.window),
    punish: ['kick', 'ban', 'none'].includes(chatData.antiraidPunish)
      ? chatData.antiraidPunish
      : DEFAULTS.punish,
    silent: chatData.antiraidSilent === true,
    requests: chatData.antiraidRequests !== false,
    notifyCooldown: positive(chatData.antiraidNotifyCooldown, DEFAULTS.notifyCooldown)
  }
}

const isAdminParticipant = (p) =>
  p?.admin === 'admin' || p?.admin === 'superadmin' || p?.admin === true

async function punishMember(conn, chat, jid, action) {
  if (action === 'none') return true
  try {
    await conn.groupParticipantsUpdate(chat, [jid], action)
    return true
  } catch (e) {
    // Connection Closed = socket occupato/riconnessione: non spammare, riprova al prossimo giro
    if (isConnClosed(e)) return false
    logAntiRaidError(`${action} fallito per ${jid}`, '', e)
    return false
  }
}

const markBlocked = (chat, jid) => {
  const num = digits(jid)
  if (!num) return
  const set = blockedFor(chat)
  set.add(num)
  persistBlocked(chat, set)
}

const requestJidOf = (request, conn) => {
  let jid = request?.user || request?.requester || request?.id || request?.jid ||
    request?.participant || request?.lid || ''
  if (!jid) return ''
  if (conn && typeof conn.decodeJid === 'function') jid = conn.decodeJid(jid)
  return String(jid)
}

function blockReason(jid, chat) {
  const num = digits(jid)
  if (!num) return ''
  const full = num + '@s.whatsapp.net'
  if (blockedFor(chat).has(num)) return 'espulso da un raid'
  if (isBlacklisted(full) || isBlacklisted(jid)) return 'in blacklist'
  if (global.db?.data?.users?.[full]?.banned) return 'gia bandito'
  if (global.db?.data?.users?.[jid]?.banned) return 'gia bandito'
  return ''
}

const canHandleRequests = (conn) =>
  typeof conn?.groupRequestParticipantsList === 'function' &&
  typeof conn?.groupRequestParticipantsUpdate === 'function'

async function listRequests(conn, chat) {
  try {
    const pending = await Promise.race([
      conn.groupRequestParticipantsList(chat),
      new Promise((_, rej) => setTimeout(() => rej(new Error('listRequests timeout')), 8000))
    ])
    return Array.isArray(pending) ? pending : []
  } catch (e) {
    if (isConnClosed(e)) return []
    logAntiRaidError('list richieste fallito', chat, e)
    return []
  }
}

async function rejectRequests(conn, chat, jids) {
  try {
    const result = await conn.groupRequestParticipantsUpdate(chat, jids, 'reject')
    const list = Array.isArray(result) ? result : []
    const ok = new Set(
      list
        .filter(r => ['200', '201', 'success'].includes(String(r?.status)))
        .map(r => r.jid)
        .filter(Boolean)
    )
    return jids.filter(j => !list.length || ok.has(j))
  } catch (e) {
    if (isConnClosed(e)) return []
    logAntiRaidError('reject fallito', chat, e)
    return []
  }
}

async function notifyRejected(conn, chat, refused, cfg) {
  if (cfg.silent || !refused.length) return
  const lines = refused
    .slice(0, 12)
    .map(r => `• @${r.num} — ${r.reason}`)
    .join('\n')
  const extra = refused.length > 12 ? `\n...e altre ${refused.length - 12}` : ''
  try {
    await conn.sendMessage(chat, {
      text:
`🚫 *888 ANTI-RICHIESTA*
━━━━━━━━━━━━━━━━━━━━━
⚠️ Richieste di accesso rifiutate in automatico.
👥 Utenti bloccati: *${refused.length}*

${lines}${extra}
━━━━━━━━━━━━━━━━━━━━━
🔐 *888 SECURITY*`,
      contextInfo: { mentionedJid: refused.map(r => r.jid) },
      mentions: refused.map(r => r.jid)
    })
  } catch (e) {
    // notifica fallita (es. Connection Closed): rientra nel throttling, non spammare
    logAntiRaidError('notifica non riuscita', '', e)
  }
}

export async function scanRequests(conn, chat) {
  try {
    if (!chat || scanning[chat]) return
    const cfg = configOf(chat)
    if (!cfg.enabled || !cfg.requests) return
    if (!canHandleRequests(conn)) return

    scanning[chat] = true
    try {
      const pending = await listRequests(conn, chat)
      if (!pending.length) return

      const now = Date.now()
      const refused = []
      const seen = []

      for (const request of pending) {
        const jid = requestJidOf(request, conn)
        const num = digits(jid)
        if (!num) continue
        seen.push({ jid, num })

        const reason = blockReason(jid, chat)
        if (!reason) continue
        if (isWhitelistedJid('antiraid', chat, jid)) continue
        if (isOwnerOfBot(jid)) continue

        const last = notified[chat]?.[num] || 0
        if (now - last < cfg.notifyCooldown) continue
        refused.push({ jid, num, reason })
      }

      if (!refused.length) return

      const ok = await rejectRequests(conn, chat, refused.map(r => r.jid))

      if (!ok.length) {
        return
      }

      if (!notified[chat]) notified[chat] = {}
      const stamp = Date.now()
      for (const jid of ok) {
        const num = digits(jid)
        if (num) notified[chat][num] = stamp
      }

      const done = ok
        .map(jid => refused.find(r => r.jid === jid))
        .filter(Boolean)

      if (global.opts?.debugAntiRaid)
        console.log(`[antiRaid] ${done.length} richieste rifiutate in ${chat}`)
      await notifyRejected(conn, chat, done, cfg)
    } finally {
      scanning[chat] = false
    }
  } catch (e) {
    // Transitori (Connection Closed) silenziati: riprova al prossimo poll.
    // Altri errori throttlati 60s per non intasare i log.
    logAntiRaidError('scanRequests', chat, e)
    scanning[chat] = false
  }
}

export async function onParticipantUpdate(conn, update) {
  try {
    if (!update?.id || update.action !== 'add') return
    const chat = update.id
    const cfg = configOf(chat)
    if (!cfg.enabled) return

    const botJid = conn?.user?.jid || conn?.user?.id || ''
    const botNum = digits(botJid)
    const now = Date.now()

    if (!kicks[chat]) kicks[chat] = []
    const log = kicks[chat].filter(t => now - t.at < cfg.window)

    let participants = []
    try {
      participants = (await conn.groupMetadata(chat))?.participants || []
    } catch {}

    const adminNums = new Set(
      participants.filter(isAdminParticipant).map(p => digits(p.id || p.jid))
    )

    const suspect = []
    for (const raw of update.participants || []) {
      const jid = conn.decodeJid(raw)
      const num = digits(jid)
      if (!num) continue
      if (num === botNum) continue
      if (isOwnerOfBot(jid)) continue
      if (adminNums.has(num)) continue
      if (isWhitelistedJid('antiraid', chat, jid)) continue

      log.push({ at: now, jid })
      suspect.push(jid)
    }

    kicks[chat] = log

    if (!suspect.length) return
    if (log.length < cfg.max) return

    if (global.opts?.debugAntiRaid)
      console.log(`[antiRaid] RAID in ${chat}: ${log.length} ingressi in ${cfg.window}ms -> ${cfg.punish}`)

    const toRemove = [...new Set(log.map(e => e.jid))]
    const action = cfg.punish === 'ban' ? 'ban' : 'kick'

    for (const jid of toRemove) {
      markBlocked(chat, jid)
      await punishMember(conn, chat, jid, action)
      if (action === 'ban') {
        try {
          const user = global.db.data.users[jid] = global.db.data.users[jid] || {}
          user.banned = true
          user.bannedReason = 'AntiRaid: entrata sospetta'
          global.markDbDirty?.()
        } catch {}
      }
    }

    kicks[chat] = []

    if (!cfg.silent) {
      await conn.sendMessage(chat, {
        text:
`🛡️ *888 ANTI-RAID ATTIVATO*
━━━━━━━━━━━━━━━━━━━━━
⚠️ Rilevato un flusso anomalo di ingressi.
👥 Ingressi sospetti: *${toRemove.length}*
⏱️ Finestra: *${cfg.window / 1000}s*
🚫 Azione: *${action.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━━
Gli account sospetti sono stati rimossi.
🔐 *888 SECURITY*`,
        contextInfo: { mentionedJid: toRemove }
      }).catch(() => {})
    }
  } catch (e) {
    logAntiRaidError('errore', '', e)
  }
}

const protectedChats = () =>
  Object.keys(global.db?.data?.chats || {}).filter(chat => configOf(chat).enabled)

const startPolling = (conn) => {
  if (pollTimer) return
  pollTimer = setInterval(() => {
    for (const chat of protectedChats()) {
      scanRequests(conn, chat).catch(e => logAntiRaidError('poll', chat, e))
    }
  }, DEFAULTS.pollMs)
  pollTimer.unref?.()
}

const handler = m => m

handler.help = ['attiva antiraid']
handler.tags = ['anti']
handler.command = [/^antiraid$/i]

if (global.conn?.ev && !global.antiRaidListenerSet) {
  const conn = global.conn

  conn.ev.on('group-participants.update', (update) => {
    onParticipantUpdate(conn, update).catch(e =>
      logAntiRaidError('listener', '', e)
    )
  })

  conn.ev.on('group-requests.update', (update) => {
    if (!update?.id) return
    if (update.action === 'reject') return
    scanRequests(conn, update.id).catch(e =>
      logAntiRaidError('richieste', update.id, e)
    )
  })

  conn.ev.on('groups.update', (updates) => {
    for (const update of (Array.isArray(updates) ? updates : [updates])) {
      if (!update?.id) continue
      if (!configOf(update.id).enabled) continue
      if (!update.pendingJoinRequestCount) continue
      scanRequests(conn, update.id).catch(() => {})
    }
  })

  global.antiRaidListenerSet = true

  setTimeout(() => {
    if (global.conn && global.conn !== conn) return
    startPolling(conn)
    for (const chat of protectedChats()) {
      scanRequests(conn, chat).catch(() => {})
    }
  }, 8000)
}

export default handler