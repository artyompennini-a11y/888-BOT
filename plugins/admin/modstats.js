// Plugin by elixir & punisher
import {
  ROLES,
  STAFF_ACTIONS,
  resolveRole,
  canUse,
  roleLabel,
  readStats,
  totalsFor,
  getGroupMods,
  isOwnerJid,
  logModAction
} from '../../lib/moderation.js'

const ACTION_LABELS = {
  warn: '⚠️ Warn',
  unwarn: '✅ Unwarn',
  mute: '🔇 Mute',
  smute: '🔊 Unmute',
  ban: '🚫 Ban',
  unban: '🔓 Unban',
  denuncia: '🚨 Denunce'
}

function formatWhen(ts) {
  if (!ts) return '—'
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(ts))
}

function staffRoleOf(jid, chat) {
  if (isOwnerJid(jid)) return ROLES.OWNER
  if (getGroupMods(chat).some(v => String(v).split('@')[0] === String(jid).split('@')[0])) return ROLES.MOD
  return ROLES.USER
}

function actionLines(entry) {
  const lines = []
  for (const action of STAFF_ACTIONS) {
    const count = Number(entry?.[action]) || 0
    if (count > 0) lines.push(`• ${ACTION_LABELS[action]}: *${count}*`)
  }
  return lines.length ? lines.join('\n') : '• Nessuna azione registrata'
}

let handler = async (m, { conn, isOwner, isROwner, isAdmin, isMods }) => {
  const role = resolveRole({ isOwner, isROwner, isAdmin, isMods })
  if (!canUse(role, ROLES.MOD)) {
    return conn.reply(m.chat, '⛔ Questo comando è riservato allo staff (Moderatori/Admin/Owner).', m)
  }

  const store = readStats(m.chat)

  if (role === ROLES.MOD) {
    const entry = store[m.sender] || {}
    const total = totalsFor(entry)
    logModAction({ role, actor: m.sender, action: 'modstats', extra: 'report personale' })

    return conn.sendMessage(m.chat, {
      text:
        `📊 *LE TUE STATISTICHE MODERAZIONE*\n` +
        `👤 Moderatore: @${m.sender.split('@')[0]} ${roleLabel(role)}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `${actionLines(entry)}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📈 Totale azioni: *${total}*\n` +
        `🕒 Ultima azione: *${formatWhen(entry.lastAction)}*`,
      mentions: [m.sender]
    }, { quoted: m })
  }

  const mods = getGroupMods(m.chat)
  const actors = new Set([...Object.keys(store), ...mods])
  if (actors.size === 0) {
    return conn.reply(m.chat, '📋 Nessuna statistica di moderazione registrata in questo gruppo.', m)
  }

  const rows = [...actors].map(jid => {
    const entry = store[jid] || {}
    return {
      jid,
      role: staffRoleOf(jid, m.chat),
      entry,
      total: totalsFor(entry)
    }
  }).sort((a, b) => b.total - a.total)

  const mentions = rows.map(r => r.jid)
  const globalTotal = rows.reduce((sum, r) => sum + r.total, 0)

  const body = rows.map(r =>
    `👤 @${String(r.jid).split('@')[0]} ${roleLabel(r.role)}\n` +
    `${actionLines(r.entry)}\n` +
    `📈 Totale: *${r.total}* — 🕒 ${formatWhen(r.entry.lastAction)}`
  ).join('\n\n')

  logModAction({ role, actor: m.sender, action: 'modstats', extra: `report staff (${rows.length} membri)` })

  return conn.sendMessage(m.chat, {
    text:
      `📊 *REPORT MODERAZIONE STAFF*\n` +
      `🏠 Gruppo: ${(await conn.groupMetadata(m.chat).catch(() => null))?.subject || 'questo gruppo'}\n` +
      `👥 Staff monitorato: *${rows.length}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${body}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📈 Totale azioni staff: *${globalTotal}*`,
    mentions
  }, { quoted: m })
}

handler.help = ['modstats']
handler.tags = ['admin']
handler.command = /^(modstats|statmod|modreport)$/i
handler.group = true
handler.mods = true

export default handler
