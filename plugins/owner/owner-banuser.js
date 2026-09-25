// Plugin by elixir & punisher
import {
  ROLES,
  LIMITS,
  resolveRole,
  canUse,
  roleLabel,
  resolveTarget,
  parseDuration,
  formatDuration,
  isTargetProtected,
  applyBan,
  restoreTempBans,
  startBanSweeper,
  recordAction,
  logModAction
} from '../../lib/moderation.js'

let handler = async (m, { conn, text, isOwner, isROwner, isAdmin, isMods, participants }) => {
  const role = resolveRole({ isOwner, isROwner, isAdmin, isMods })
  if (!canUse(role, ROLES.MOD)) {
    return conn.reply(m.chat, '⛔ Questo comando è riservato allo staff (Moderatori/Admin/Owner).', m)
  }

  const target = resolveTarget(m, text || '')
  if (!target) return conn.reply(m.chat, '❌ Tagga, rispondi o scrivi un numero da bannare.', m)

  const protection = isTargetProtected({
    target,
    actorRole: role,
    participants,
    conn,
    chat: m.chat
  })
  if (protection.protected) {
    return conn.reply(m.chat, `⛔ Ban non consentito: ${protection.reason} (${roleLabel(protection.targetRole)}).`, m)
  }

  const reason = String(text || '')
    .replace(/@\d+/g, '')
    .replace(/^\d+/, '')
    .replace(/\b\d+\s*(m|min|minuti|minuto|h|ore|ora|d|giorni|giorno|s|sec|secondi)\b/gi, '')
    .trim()

  const requested = parseDuration(text || '')
  const resolved = applyBan({
    conn,
    target,
    actor: m.sender,
    role,
    durationMs: requested?.ms ?? null,
    chat: m.chat,
    reason
  })

  startBanSweeper(conn)
  restoreTempBans(conn).catch(() => {})

  const number = String(target).split('@')[0]
  const durationLabel = formatDuration(resolved.ms)

  recordAction({ chat: m.chat, actor: m.sender, action: 'ban', target, role, detail: durationLabel })
  logModAction({ role, actor: m.sender, action: 'ban', target, extra: durationLabel })

  const capNote = resolved.capped
    ? `\n⚠️ Durata ridotta al massimo consentito ai moderatori (${LIMITS.MOD_BAN_MAX_MS / 60000} minuti).`
    : ''

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: '888BanUser'
    },
    message: {
      contactMessage: {
        displayName: `🚫 Ban Utente`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\\nFN:y\nitem1.TEL;waid=${number}:${number}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: '0@s.whatsapp.net'
  }

  await conn.sendMessage(
    m.chat,
    {
      text:
        `🚫 *UTENTE BANNATO*\n` +
        `👤 Target: @${number}\n` +
        `📞 wa.me/${number}\n` +
        `👑 Da: @${m.sender.split('@')[0]} ${roleLabel(role)}\n` +
        `⏳ Durata: ${durationLabel}${capNote}\n` +
        (reason ? `📝 Motivo: ${reason}\n` : '') +
        `\n🔒 L’utente è stato bloccato dai moduli del bot.`,
      mentions: [target, m.sender]
    },
    { quoted: fake }
  )
}

handler.command = /^banuser$/i
handler.mods = true
handler.tags = ['admin']

const initBanRestore = (attempt = 0) => {
  const conn = global.conn
  if (conn?.sendMessage) {
    startBanSweeper(conn)
    restoreTempBans(conn).catch(() => {})
    return
  }
  if (attempt < 10) setTimeout(() => initBanRestore(attempt + 1), 1500).unref?.()
}
initBanRestore()

export default handler
