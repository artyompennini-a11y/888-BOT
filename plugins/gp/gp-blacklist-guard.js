// Plugin by elixir & punisher
import { isBlacklisted, getBlacklist } from '../../lib/blacklist.js'

export async function before(m, { conn }) {
  if (!m.isGroup) return
  if (m.messageStubType !== 27 && m.messageStubType !== 28) return
  const chat = global.db.data.chats[m.chat] || {}
  const newcomers = Array.isArray(m.messageStubParameters) ? m.messageStubParameters : []
  if (!newcomers.length) return
  let groupMetadata = null
  try {
    groupMetadata = await conn.groupMetadata(m.chat)
  } catch {
    groupMetadata = null
  }
  const parts = groupMetadata?.participants || []
  const admins = parts.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id)
  const botJid = conn.user?.jid || conn.user?.id
  const botIsAdmin = parts.some(p => (p.id === botJid || p.jid === botJid) && (p.admin === 'admin' || p.admin === 'superadmin'))
  for (const user of newcomers) {
    const entry = getBlacklist()[user]
    if (!entry && !isBlacklisted(user)) continue
    if (botIsAdmin) {
      try {
        await conn.sendMessage(m.chat, {
          text: `ACCESSO NEGATO\n\n@${user.split('@')[0]} e' in Blacklist e verra' espulso immediatamente.\n\nMotivo: ${entry?.reason || 'Nessun motivo specificato'}\nData ban: ${entry?.date || '-'}`,
          mentions: [user, ...admins]
        })
      } catch {}
      try {
        await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
      } catch {}
    } else if (chat.welcome !== false) {
      try {
        await conn.sendMessage(m.chat, {
          text: `ATTENZIONE ADMIN\n\nL'utente @${user.split('@')[0]} e' in Blacklist ma non posso rimuoverlo perche' non sono admin!`,
          mentions: [user, ...admins]
        })
      } catch {}
    }
  }
}
