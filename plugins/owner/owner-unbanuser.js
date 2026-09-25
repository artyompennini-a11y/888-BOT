// Plugin by elixir & punisher
import {
  ROLES,
  resolveRole,
  canUse,
  roleLabel,
  resolveTarget,
  getTempBan,
  liftBan,
  ensureUser,
  recordAction,
  logModAction
} from '../../lib/moderation.js'

let handler = async (m, { conn, text, isOwner, isROwner, isAdmin, isMods }) => {
  const role = resolveRole({ isOwner, isROwner, isAdmin, isMods })
  if (!canUse(role, ROLES.MOD)) {
    return conn.reply(m.chat, '⛔ Questo comando è riservato allo staff (Moderatori/Admin/Owner).', m)
  }

  const target = resolveTarget(m, text || '')
  if (!target) return conn.reply(m.chat, '❌ Tagga, rispondi o scrivi un numero da sbannare.', m)

  const record = getTempBan(target)
  const user = global.db?.data?.users?.[target]
  const isBanned = !!user?.banned || !!record

  if (!isBanned) {
    return conn.reply(m.chat, 'ℹ️ Questo utente non è attualmente bannato.', m)
  }

  if (role === ROLES.MOD && (!record || record.permanent)) {
    logModAction({ role, actor: m.sender, action: 'unban BLOCCATO', target, extra: 'ban permanente' })
    return conn.reply(
      m.chat,
      `⛔ Questo è un *ban permanente*: i moderatori non possono revocarlo.\n⏳ Richiedi l'intervento di un Admin/Owner.`,
      m
    )
  }

  const result = liftBan({ target, role })

  if (!result.ok) {
    if (result.reason === 'higher') {
      return conn.reply(m.chat, '⛔ Solo un Owner può revocare un ban applicato da un Owner.', m)
    }
    return conn.reply(m.chat, '❌ Impossibile revocare il ban.', m)
  }

  const safeUser = ensureUser(target)
  if (safeUser) {
    safeUser.banned = false
    safeUser.notifiedBan = false
    global.markDbDirty?.()
  }

  const number = String(target).split('@')[0]

  recordAction({ chat: m.chat, actor: m.sender, action: 'unban', target, role, detail: 'ban revocato' })
  logModAction({ role, actor: m.sender, action: 'unban', target, extra: result.record?.until ? 'temporaneo' : 'permanente' })

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: '888UnbanUser'
    },
    message: {
      contactMessage: {
        displayName: `✅ Utente Sbannato`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\\nFN:y\nitem1.TEL;waid=${number}:${number}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: '0@s.whatsapp.net'
  }

  await conn.sendMessage(
    m.chat,
    {
      text:
        `✅ *UTENTE SBANNATO*\n` +
        `👤 Target: @${number}\n` +
        `📞 wa.me/${number}\n` +
        `👑 Da: @${m.sender.split('@')[0]} ${roleLabel(role)}\n\n` +
        `🔓 L’utente è stato riattivato e ora può usare il bot.`,
      mentions: [target, m.sender]
    },
    { quoted: fake }
  )
}

handler.command = /^unbanuser$/i
handler.mods = true
handler.tags = ['admin']

export default handler
