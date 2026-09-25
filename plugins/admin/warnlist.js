// Plugin by elixir & punisher
import {
  ROLES,
  LIMITS,
  resolveRole,
  canUse,
  roleLabel,
  logModAction
} from '../../lib/moderation.js'

const quick = (display_text, id) => ({
  name: 'quick_reply',
  buttonParamsJson: JSON.stringify({ display_text, id })
})

let handler = async (m, { conn, usedPrefix, isOwner, isROwner, isAdmin, isMods, participants }) => {
  if (!m.isGroup) return m.reply('❌ Questo comando funziona solo nei gruppi.')
  const p = usedPrefix || '.'
  const role = resolveRole({ isOwner, isROwner, isAdmin, isMods })
  if (!canUse(role, ROLES.MOD)) {
    return conn.reply(m.chat, '⛔ Questo comando è riservato allo staff (Moderatori/Admin/Owner).', m)
  }
  logModAction({ role, actor: m.sender, action: 'warnlist', extra: 'lista utenti warnati' })
  const users = global.db?.data?.users || {}
  const memberJids = new Set((Array.isArray(participants) ? participants : []).map(x => x?.id).filter(Boolean))
  const rows = []
  for (const [jid, entry] of Object.entries(users)) {
    const count = Number(entry?.warn) || 0
    if (count < 1) continue
    if (memberJids.size && !memberJids.has(jid)) continue
    rows.push({ jid, count })
  }
  rows.sort((a, b) => b.count - a.count || String(a.jid).localeCompare(String(b.jid)))
  const mentions = rows.map(r => r.jid)
  let text = `⚠️ *WARNLIST 888*\n`
  text += `👥 *Utenti warnati:* ${rows.length}\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`
  if (!rows.length) {
    text += `✅ Nessun utente ha warn attivi.\n`
    text += `👉 Dai un warn con *${p}warn @utente motivo*\n`
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`
    text += `👤 *Il tuo ruolo:* ${roleLabel(role)}`
    return conn.sendMessage(m.chat, {
      text,
      footer: '𝟴𝟴𝟴 BOT • Moderazione',
      interactiveButtons: [
        quick('⚠️ Warn', `${p}warn`),
        quick('🛡️ Moderatori', `${p}mods`)
      ]
    }, { quoted: m })
  }
  rows.forEach((r, i) => {
    const level = r.count >= LIMITS.MAX_WARN - 1 ? '🔴' : r.count >= 3 ? '🟠' : '🟡'
    text += `${level} ${i + 1}. @${String(r.jid).split('@')[0]} — *${r.count}/${LIMITS.MAX_WARN}* warn\n`
  })
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`
  text += `⮕ Al ${LIMITS.MAX_WARN}° warn l’utente viene espulso.\n`
  text += `👤 *Il tuo ruolo:* ${roleLabel(role)}`
  return conn.sendMessage(m.chat, {
    text,
    mentions,
    footer: '𝟴𝟴𝟴 BOT • Moderazione',
    interactiveButtons: [
      quick('✅ Unwarn', `${p}unwarn`),
      quick('🛡️ Moderatori', `${p}mods`)
    ]
  }, { quoted: m })
}

handler.help = ['warnlist']
handler.tags = ['admin']
handler.command = /^(warnlist|listawarn|warns)$/i
handler.group = true
handler.mods = true

export default handler
