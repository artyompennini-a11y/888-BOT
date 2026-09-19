// Plugin by Elixir, Punisher & 888 staff
import { xpRange } from '../../lib/levelling.js'

const handler = async (m, { conn, groupMetadata }) => {

  if (!m.isGroup)
    return await conn.sendMessage(m.chat, { text: 'Questo comando funziona solo nei gruppi.' })

  groupMetadata = groupMetadata || await conn.groupMetadata?.(m.chat).catch(() => null)
  const participants = groupMetadata?.participants || []

  if (!participants.length) {
    return await conn.sendMessage(m.chat, { text: 'Impossibile recuperare i membri del gruppo.' })
  }

  const usersDb = global.db.data.users || (global.db.data.users = {})

  const groupMemberJids = new Set(participants.map(p => p.id))
  const botJid = conn.user && (conn.user.jid || conn.user.id)

  // 🔥 Raccolta dati utenti
  let values = Array.from(groupMemberJids)
    .filter(jid => jid !== botJid)
    .map(jid => {
      const user = usersDb[jid] || {}
      return {
        jid,
        level: Number(user.level || 0),
        exp: Number(user.exp || 0),
        role: user.role || 'Novizio',
        money: Number(user.money || 0)
      }
    })
    .filter(u => u.level > 0 || u.exp > 0)

  if (!values.length) {
    return await conn.sendMessage(m.chat, { text: 'Nessun rank disponibile per i membri di questo gruppo.' })
  }

  // 📊 Ordina per livello → XP
  values.sort((a, b) => b.level - a.level || b.exp - a.exp)

  const top = values.slice(0, 10)

  // 🏆 Rilevamento nuovo primo
  const newFirst = top[0].jid

  let chat = global.db.data.chats[m.chat]
  if (!chat) {
    global.db.data.chats[m.chat] = {}
    chat = global.db.data.chats[m.chat]
  }

  if (chat.prevFirst && chat.prevFirst !== newFirst) {
    await conn.sendMessage(m.chat, {
      text: `🏆 @${newFirst.split('@')[0]} ha superato @${chat.prevFirst.split('@')[0]} ed è il nuovo primo in classifica!`,
      mentions: [newFirst, chat.prevFirst]
    })
  }

  chat.prevFirst = newFirst

  // 🎨 Grafica minimal/premium 888
  const header =
`🏆 *TOP 10 RANK DEL GRUPPO*
👥 Gruppo: ${groupMetadata.subject || m.chat.split('@')[0]}

🎁 Se sei il primo, riscatta il tuo premio con *.premiotop*

`

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

  const posEmojis = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟']

  const lines = top.map((user, idx) => {
    const rank = posEmojis[idx]
    const title = titles[idx] || 'Membro'
    return (
`${rank} @${user.jid.split('@')[0]} — ${title}
• Lv.${user.level} • XP: ${user.exp} • ${user.role} • ${user.money} 888COIN

`
    )
  }).join('')

  await conn.sendMessage(m.chat, {
    text: header + lines,
    mentions: top.map(u => u.jid),
    buttons: [
      { buttonId: '.top', buttonText: { displayText: '📊 Top messaggi' }, type: 1 },
      { buttonId: '.statsgiornaliere', buttonText: { displayText: '📅 Statistiche giornaliere' }, type: 1 }
    ],
    headerType: 1
  })
}

handler.help = ['topranks', 'toprank']
handler.tags = ['group']
handler.command = ['topranks', 'toprank']

export default handler