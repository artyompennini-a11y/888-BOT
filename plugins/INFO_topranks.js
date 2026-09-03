// Plugin by Elixir, Punisher & 888 staff
import { xpRange } from '../lib/levelling.js'

const handler = async (m, { conn, groupMetadata }) => {
  if (!m.isGroup) return await conn.sendMessage(m.chat, { text: 'Questo comando funziona solo nei gruppi.' })

  groupMetadata = groupMetadata || await conn.groupMetadata?.(m.chat).catch(() => null)
  const participants = groupMetadata?.participants || []

  if (!participants.length) {
    return await conn.sendMessage(m.chat, { text: 'Impossibile recuperare i membri del gruppo.' })
  }

  const usersDb = global.db.data.users || (global.db.data.users = {})

  const groupMemberJids = new Set(participants.map(p => p.id))
const botJid = conn.user && (conn.user.jid || conn.user.id)

  let values = Array.from(groupMemberJids)
.filter(jid => {
      if (!botJid) return true
      const normJ = typeof conn.decodeJid === 'function' ? conn.decodeJid(jid) : jid
      const normBot = typeof conn.decodeJid === 'function' ? conn.decodeJid(botJid) : botJid
      return normJ !== normBot
    })
    .filter(jid => jid && !jid.endsWith('@g.us'))
    .map(jid => {
      const user = usersDb[jid] || {}

      const level = Number(user.level || 0)
      const exp = Number(user.exp || 0)
      const role = user.role || 'Novizio'
      const money = Number(user.money || 0)

      return { jid, level, exp, role, money }
    })
    .filter(u => u.level > 0 || u.exp > 0)

  if (!values.length) {
    return await conn.sendMessage(m.chat, { text: 'Nessun rank disponibile per i membri di questo gruppo.' })
  }

  // Ordina per livello, poi XP
  values.sort((a, b) => b.level - a.level || b.exp - a.exp)

  const top = values.slice(0, 10)

  const header =
    `🏆 *TOP 10 RANK DEL GRUPPO*\n` +
    `👥 Gruppo: ${groupMetadata.subject || m.chat.split('@')[0]}\n\n`

  const titles = [
    '👑 Re del gruppo',
    '💎 Elite',
    '🔥 Attivo',
    '⚡ Presente',
    '⭐ Contributore',
    '📘 Studente',
    '🧊 Timido',
    '🌫️ Fantasma',
    '🌱 Novizio',
    '💤 Dormiente'
  ]

  const lines = top.map((user, idx) => {
    const rank = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'][idx]
    const title = titles[idx] || ''
    return `${rank} @${user.jid.split('@')[0]} — ${title}\n` +
           `• Lv.${user.level} • XP: ${user.exp} • ${user.role} • ${user.money} 888COIN\n`
  }).join('\n')

  await conn.sendMessage(m.chat, {
    text: header + lines,
    mentions: top.map(u => u.jid)
  })
}

handler.help = ['topranks', 'toprank']
handler.tags = ['group']
handler.command = ['topranks', 'toprank']

export default handler
