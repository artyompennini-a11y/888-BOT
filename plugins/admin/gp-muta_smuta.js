// Plugin by elixir & punisher
import fs from 'fs'
import {
  ROLES,
  LIMITS,
  resolveRole,
  resolveRoleOfJid,
  canUse,
  roleLabel,
  resolveTarget,
  parseDuration,
  formatDuration,
  isTargetProtected,
  applyMute,
  liftMute,
  getMute,
  activeMute,
  recordAction,
  logModAction
} from '../../lib/moderation.js'

function warnThumb() {
  try {
    const buffer = fs.readFileSync('icone/warn.png')
    return buffer && buffer.length ? buffer : null
  } catch {
    return null
  }
}

let handler = async (m, { conn, text, command, isOwner, isROwner, isAdmin, isMods, participants }) => {
  try {
    const role = resolveRole({ isOwner, isROwner, isAdmin, isMods })
    if (!canUse(role, ROLES.MOD)) {
      return conn.reply(m.chat, '⛔ Questo comando è riservato allo staff (Moderatori/Admin/Owner).', m)
    }

    const action = String(command || '').toLowerCase().includes('smuta') ? 'smuta' : 'muta'
    const target = resolveTarget(m, text || '')
    if (!target) {
      return conn.reply(m.chat, '⚠️ Devi menzionare o rispondere a un utente.', m)
    }

    const targetTag = `@${target.split('@')[0]}`
    const executorTag = `@${m.sender.split('@')[0]}`
    const thumb = warnThumb()

    if (action === 'muta') {
      const protection = isTargetProtected({
        target,
        actorRole: role,
        participants,
        conn,
        chat: m.chat
      })
      if (protection.protected) {
        return conn.reply(m.chat, `⛔ Impossibile mutare questo utente.\n📌 Motivo: ${protection.reason} (${roleLabel(protection.targetRole)})`, m)
      }

      const requested = parseDuration(text || '')
      const resolved = applyMute({
        chat: m.chat,
        target,
        actor: m.sender,
        role,
        durationMs: requested?.ms ?? null
      })

      recordAction({
        chat: m.chat,
        actor: m.sender,
        action: 'mute',
        target,
        role,
        detail: formatDuration(resolved.ms)
      })
      logModAction({
        role,
        actor: m.sender,
        action: 'mute',
        target,
        extra: formatDuration(resolved.ms)
      })

      const capNote = resolved.capped
        ? `\n⚠️ Durata ridotta al massimo consentito ai moderatori (${LIMITS.MOD_MUTE_MAX_MS / 60000} minuti).`
        : ''

      const body = `
🔇 *MUTE APPLICATO*
👤 Target: ${targetTag}
👑 Da: ${executorTag} ${roleLabel(role)}
⏳ Durata: ${formatDuration(resolved.ms)}${capNote}
📊 Stato: Attivo
`.trim()

      const payload = { text: body, mentions: [target, m.sender] }
      if (thumb) payload.jpegThumbnail = thumb

      return conn.sendMessage(m.chat, payload, { quoted: m })
    }

    const previous = getMute(m.chat, target)
    if (previous?.mutedByRole === ROLES.OWNER && role !== ROLES.OWNER) {
      return conn.reply(m.chat, '⛔ Solo un Owner può rimuovere un mute applicato da un Owner.', m)
    }

    const { removed } = liftMute({ chat: m.chat, target })
    if (!removed) {
      return conn.reply(m.chat, 'ℹ️ Questo utente non ha mute attivi.', m)
    }

    recordAction({
      chat: m.chat,
      actor: m.sender,
      action: 'smute',
      target,
      role,
      detail: 'mute revocato'
    })
    logModAction({ role, actor: m.sender, action: 'smute', target, extra: 'mute revocato' })

    const body = `
🔊 *MUTE RIMOSSO*
👤 Target: ${targetTag}
👑 Da: ${executorTag} ${roleLabel(role)}
⏳ Durata residua: ${formatDuration(previous?.expiresAt ? previous.expiresAt - Date.now() : 0)}
📊 Stato: Revocato
`.trim()

    const payload = { text: body, mentions: [target, m.sender] }
    if (thumb) payload.jpegThumbnail = thumb

    return conn.sendMessage(m.chat, payload, { quoted: m })
  } catch (e) {
    console.error('[MUTA ERROR]', e)
    conn.reply(m.chat, '❌ Errore durante il comando.', m)
  }
}

handler.before = async function (m, { conn }) {
  if (!m.isGroup || !m.sender || m.fromMe) return

  const muteData = activeMute(m.chat, m.sender)
  if (!muteData) return

  try {
    await conn.sendMessage(m.chat, { delete: m.key })
  } catch (err) {
    console.error('[MUTE DELETE ERROR]', err)
  }
}

handler.help = ['muta @user 5m', 'smuta @user']
handler.command = ['muta', 'smuta']
handler.group = true
handler.mods = true
handler.botAdmin = true
handler.tags = ['admin']

export default handler
