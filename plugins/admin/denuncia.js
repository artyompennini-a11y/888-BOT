// Plugin by elixir & punisher
import {
  ROLES,
  resolveRole,
  canUse,
  roleLabel,
  resolveTarget,
  resolveRoleOfJid,
  recordAction,
  logModAction
} from '../../lib/moderation.js'
import { sendStaffReport, staffGroupJid, staffInviteLink } from '../utility/ticket.js'

function formatDate(ts = Date.now()) {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(ts))
}

let handler = async (m, { conn, text, command, usedPrefix, isOwner, isROwner, isAdmin, isMods, participants }) => {
  const role = resolveRole({ isOwner, isROwner, isAdmin, isMods })
  if (!canUse(role, ROLES.MOD)) {
    return conn.reply(m.chat, '⛔ Questo comando è riservato allo staff (Moderatori/Admin/Owner).', m)
  }

  const target = resolveTarget(m, text || '')
  if (!target) {
    return conn.reply(
      m.chat,
      `⚠️ *Uso corretto:*\n\`${usedPrefix + command} @utente motivo della denuncia\`\n\nDevi menzionare (o rispondere a) un utente e indicare il motivo.`,
      m
    )
  }

  const reason = String(text || '')
    .replace(/@\d+/g, '')
    .replace(/^\d+/, '')
    .trim()

  if (!reason || reason.length < 3) {
    return conn.reply(m.chat, '📝 Il motivo è *obbligatorio*: aggiungi una motivazione valida dopo la menzione.', m)
  }

  const targetRole = resolveRoleOfJid(conn, m.chat, target, participants)
  const targetNum = String(target).split('@')[0]

  let chatName = 'Chat Privata'
  let chatLink = ''
  if (m.isGroup) {
    try {
      const metadata = await conn.groupMetadata(m.chat)
      chatName = metadata.subject || chatName
    } catch {
      chatName = 'Gruppo (metadata non accessibile)'
    }
    try {
      const code = await conn.groupInviteCode(m.chat)
      if (code) chatLink = `https://chat.whatsapp.com/${code}`
    } catch {}
  }

  const report =
    `🚨 *DENUNCIA MODERAZIONE* 🚨\n\n` +
    `👮 *Segnalato da:* @${m.sender.split('@')[0]} ${roleLabel(role)}\n` +
    `👤 *Utente segnalato:* @${targetNum} ${roleLabel(targetRole)}\n` +
    `📞 *Contatto:* wa.me/${targetNum}\n\n` +
    `🏠 *Gruppo:* ${chatName}\n` +
    `🆔 *ID Chat:* \`${m.chat}\`\n` +
    (chatLink ? `🔗 *Link gruppo:* ${chatLink}\n` : '') +
    `📅 *Data:* ${formatDate()}\n\n` +
    `📝 *Motivo:*\n"${reason}"\n\n` +
    `📌 *Gruppo staff:* ${staffGroupJid}\n` +
    `🔗 ${staffInviteLink}`

  try {
    const result = await sendStaffReport(conn, {
      text: report,
      mentions: [m.sender, target]
    })

    if (!result.ok) {
      return conn.reply(m.chat, '❌ Impossibile recapitare la denuncia al gruppo staff. Verifica il link in ticket.js.', m)
    }

    recordAction({
      chat: m.chat,
      actor: m.sender,
      action: 'denuncia',
      target,
      role,
      detail: reason
    })
    logModAction({ role, actor: m.sender, action: 'denuncia', target, extra: reason.slice(0, 40) })

    return conn.sendMessage(m.chat, {
      text:
        `✅ *Denuncia inviata allo staff*\n` +
        `👤 Utente segnalato: @${targetNum}\n` +
        `📝 Motivo: ${reason}\n` +
        `📨 Destinazione: gruppo staff 888`,
      mentions: [target]
    }, { quoted: m })
  } catch (e) {
    console.error('[DENUNCIA ERROR]', e)
    return conn.reply(m.chat, '❌ Errore interno durante l’invio della denuncia.', m)
  }
}

handler.help = ['denuncia @user motivo']
handler.tags = ['admin']
handler.command = /^(denuncia|segnalamod|denunciamod)$/i
handler.group = true
handler.mods = true

export default handler
