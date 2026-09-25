// Plugin by elixir & punisher
import {
  ROLES,
  LIMITS,
  resolveRole,
  resolveRoleOfJid,
  canUse,
  roleLabel,
  resolveTarget,
  isTargetProtected,
  recordAction,
  logModAction,
  checkUnwarnCooldown,
  markUnwarn
} from '../../lib/moderation.js'

const handler = async (msg, { conn, command, text, isOwner, isROwner, isAdmin, isMods, participants }) => {
  const role = resolveRole({ isOwner, isROwner, isAdmin, isMods })
  if (!canUse(role, ROLES.MOD)) {
    return conn.reply(msg.chat, '⛔ Questo comando è riservato allo staff (Moderatori/Admin/Owner).', msg)
  }

  const target = resolveTarget(msg, text || '')
  if (!target) {
    return conn.reply(msg.chat, '⚠️ Devi menzionare o rispondere a un utente.', msg)
  }

  const targetTag = `@${target.split('@')[0]}`
  const executorTag = `@${msg.sender.split('@')[0]}`
  const targetRole = resolveRoleOfJid(conn, msg.chat, target, participants)

  const protection = isTargetProtected({
    target,
    actorRole: role,
    participants,
    conn,
    chat: msg.chat
  })
  if (protection.protected) {
    return conn.reply(msg.chat, `ⓘ Sanzione non applicabile: ${protection.reason} (${roleLabel(protection.targetRole)}).`, msg)
  }

  const reason = String(text || '').replace(/@\d+/g, '').replace(/^\d+/, '').trim()

  global.db.data.users ??= {}
  global.db.data.users[target] ??= { warn: 0 }
  const targetUser = global.db.data.users[target]
  targetUser.warn = Number(targetUser.warn) || 0

  if (command === 'warn') {
    if (!reason || reason.length < 3) {
      return conn.reply(msg.chat, 'ℹ️ Inserisci una motivazione valida per ammonire l’utente.', msg)
    }

    const nextWarn = targetUser.warn + 1

    if (role === ROLES.MOD && nextWarn > LIMITS.MOD_MAX_WARN) {
      logModAction({
        role,
        actor: msg.sender,
        action: 'warn BLOCCATO',
        target,
        extra: `limite moderatori ${LIMITS.MOD_MAX_WARN}/${LIMITS.MAX_WARN}`
      })
      return conn.sendMessage(msg.chat, {
        text:
          `⚠️ *Limite moderatori raggiunto*\n` +
          `👤 Target: ${targetTag}\n` +
          `📊 Sanzioni attuali: [ ${targetUser.warn}/${LIMITS.MAX_WARN} ]\n\n` +
          `🛑 I moderatori non possono assegnare il ${LIMITS.MAX_WARN}° avvertimento.\n` +
          `⏳ Attendi la decisione di un Admin/Owner.`,
        mentions: [target]
      }, { quoted: msg })
    }

    targetUser.warn = nextWarn
    recordAction({ chat: msg.chat, actor: msg.sender, action: 'warn', target, role, detail: reason })
    logModAction({ role, actor: msg.sender, action: 'warn', target, extra: `${targetUser.warn}/${LIMITS.MAX_WARN}` })

    if (targetUser.warn >= LIMITS.MAX_WARN) {
      targetUser.warn = 0
      await conn.sendMessage(msg.chat, {
        text:
          `❌ *UTENTE ESPULSO*\n` +
          `👤 Target: ${targetTag}\n` +
          `⚙️ Azione: Rimozione automatica\n` +
          `⛔ Motivo: Ha raggiunto ${LIMITS.MAX_WARN} avvertimenti`,
        mentions: [target]
      })
      await new Promise(resolve => setTimeout(resolve, 1000))
      return conn.groupParticipantsUpdate(msg.chat, [target], 'remove').catch(() => {})
    }

    const warnLimitLabel = role === ROLES.MOD
      ? `${targetUser.warn}/${LIMITS.MOD_MAX_WARN} (limite moderatori)`
      : `${targetUser.warn}/${LIMITS.MAX_WARN}`

    return conn.sendMessage(msg.chat, {
      text:
        `⚠️ *AVVERTIMENTO*\n` +
        `👤 Target: ${targetTag}\n` +
        `👑 Eseguito da: ${executorTag} ${roleLabel(role)}\n` +
        `📊 Sanzioni: [ ${warnLimitLabel} ]\n` +
        `📝 Motivo: ${reason}\n\n` +
        `⮕ Al ${LIMITS.MAX_WARN}° avvertimento l'utente verrà espulso dal gruppo.`,
      mentions: [target, msg.sender]
    }, { quoted: msg })
  }

  if (command === 'unwarn') {
    if (targetUser.warn <= 0) {
      return conn.reply(msg.chat, 'ℹ️ L’utente non ha sanzioni attive.', msg)
    }

    const cooldown = checkUnwarnCooldown(msg.chat, msg.sender, role)
    if (!cooldown.ok) {
      logModAction({ role, actor: msg.sender, action: 'unwarn BLOCCATO', target, extra: 'cooldown attivo' })
      return conn.sendMessage(msg.chat, {
        text: `${cooldown.message}\n👤 Target: ${targetTag}`,
        mentions: [target]
      }, { quoted: msg })
    }

    targetUser.warn -= 1
    markUnwarn(msg.chat, msg.sender)
    recordAction({ chat: msg.chat, actor: msg.sender, action: 'unwarn', target, role, detail: 'sanzione revocata' })
    logModAction({ role, actor: msg.sender, action: 'unwarn', target, extra: `${targetUser.warn}/${LIMITS.MAX_WARN}` })

    return conn.sendMessage(msg.chat, {
      text:
        `✅ *SANZIONE REVOCATA*\n` +
        `👤 Target: ${targetTag}\n` +
        `👑 Eseguito da: ${executorTag} ${roleLabel(role)}\n` +
        `📊 Sanzioni rimanenti: [ ${targetUser.warn}/${LIMITS.MAX_WARN} ]\n\n` +
        `⮕ Un avvertimento è stato rimosso.`,
      mentions: [target, msg.sender]
    }, { quoted: msg })
  }
}

handler.help = ['warn @user motivo', 'unwarn @user']
handler.tags = ['admin']
handler.command = /^(warn|unwarn)$/i
handler.group = true
handler.mods = true
handler.botAdmin = true

export default handler
