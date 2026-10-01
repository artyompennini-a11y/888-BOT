// Plugin by elixir, punisher & 888 staff
import { Mutex } from 'async-mutex'

const CONFIG = {
  window: 10000,
  maxCommands: 8,
  maxUnique: 6,
  warnCooldown: 60000
}

const track = {}
const warned = new Set()
const mutexes = {}
const lock = (chat) => {
  if (!mutexes[chat]) mutexes[chat] = new Mutex()
  return mutexes[chat]
}

const digits = (jid = '') => String(jid ?? '').split('@')[0].split(':')[0].replace(/\D+/g, '')

const isOwnerOfBot = (jid) => {
  const target = digits(jid)
  if (!target) return false
  return (global.owner || []).some(e => {
    const raw = Array.isArray(e) ? e[0] : e
    return digits(String(raw ?? '')) === target
  })
}

const configOf = (chat) => {
  const c = global.db?.data?.chats?.[chat] || {}
  return {
    enabled: c.antiflood === true,
    maxCommands: Number.isFinite(c.antifloodMax) && c.antifloodMax > 0 ? c.antifloodMax : CONFIG.maxCommands,
    maxUnique: Number.isFinite(c.antifloodUnique) && c.antifloodUnique > 0 ? c.antifloodUnique : CONFIG.maxUnique,
    window: Number.isFinite(c.antifloodWindow) && c.antifloodWindow > 0 ? c.antifloodWindow : CONFIG.window,
    silent: c.antifloodSilent === true
  }
}

  const text = String(m?.text || '')
  if (!text.startsWith('.')) return null
  return text.split(/\s+/)[0].slice(1).toLowerCase() || null
}

const prune = (obj, chat) => {
  if (!obj[chat]) return null
  const now = Date.now()
  const cfg = configOf(chat)
  obj[chat] = obj[chat].filter(e => now - e.at < cfg.window)
  if (!obj[chat].length) delete obj[chat]
  return obj[chat] || null
}

export async function before(m, { conn, isAdmin, isOwner, isROwner, isMods }) {
  try {
    if (m?.fromMe) return true
    if (!m?.isGroup) return false
    if (!m?.sender) return true

    const chat = m.chat
    const cfg = configOf(chat)
    if (!cfg.enabled) return true

    if (isOwner || isROwner || isAdmin || isMods) return true
    if (isOwnerOfBot(m.sender)) return true

    const cmd = extractCommand(m)
    if (!cmd) return true

    const release = await lock(chat).acquire()
    try {
      const now = Date.now()
      const log = prune(track, chat) || []
      log.push({ at: now, cmd, by: m.sender })
      track[chat] = log

      const uniqueSenders = new Set(log.map(e => e.by)).size
      const uniqueCmds = new Set(log.map(e => e.cmd)).size

      const flood = log.length > cfg.maxCommands || uniqueCmds > cfg.maxUnique
      const multiUser = uniqueSenders > 2 && log.length > cfg.maxCommands

      if (!flood && !multiUser) return true

      const key = `${chat}:${m.sender}`
      const firstWarn = !warned.has(key)
      if (!firstWarn) return true

      if (!cfg.silent) {
        await conn.sendMessage(chat, {
          text:
`🌊 *ANTI-FLOOD 888*
━━━━━━━━━━━━━━━━━━━━━
⚠️ Troppi comandi in pochi secondi.
📊 Comandi: *${log.length}* nella finestra
🔁 Comandi diversi: *${uniqueCmds}*
⏱️ Finestra: *${cfg.window / 1000}s*
━━━━━━━━━━━━━━━━━━━━━
I tuoi comandi verranno ignorati per un po'.
🔐 *888 SECURITY*`,
          contextInfo: { mentionedJid: [m.sender] },
          mentions: [m.sender]
        }).catch(() => {})
      }

      warned.add(key)
      setTimeout(() => warned.delete(key), CONFIG.warnCooldown).unref?.()
      return true
    } finally {
      release()
    }
  } catch (e) {
    console.error('[antiflood]', e?.message || e)
    return true
  }
}

const handler = m => m
handler.help = ['attiva antiflood']
handler.tags = ['anti']
handler.command = [/^antiflood$/i]

export default handler
