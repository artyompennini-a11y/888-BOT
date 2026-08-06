// Plugin by Elixir & 888 staff
import { xpRange } from '../lib/levelling.js'

let handler = async (m, { conn, usedPrefix, text }) => {
  const targetJid = m.mentionedJid?.[0] || m.quoted?.sender || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null) || m.sender
  const targetName = await conn.getName(targetJid)

  let user = global.db.data.users[targetJid]
  if (!user) return m.reply('⚠️ Utente non trovato nel database.')

  const level = Number(user.level) || 0
  const exp = Number(user.exp) || 0
  const xpNext = xpRange(level + 1)
  const min = xpNext.min
  const max = xpNext.max
  const needed = max - min
  const currentIn = exp - min
  const percent = Math.floor((currentIn / needed) * 100)

  const totalBars = 12
  const filledBars = Math.floor((percent / 100) * totalBars)
  const emptyBars = totalBars - filledBars
  const bar = '█'.repeat(filledBars) + '░'.repeat(emptyBars)

  const role = user.role || '🌱 Novizio'
  const messaggi = user.messaggi || 0
  const money = (Number(user.money) || 0) + (Number(user.bank) || 0)
  const rankData = user.rankData || {}

  const resultText = `📊 *POSIZIONE UTENTE*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Nome:* ${targetName}\n` +
    `🏅 *Ruolo:* ${role}\n` +
    `📈 *Livello:* ${level}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `✨ *XP:* ${exp}\n` +
    `🎯 *Prossimo livello:* ${min}\n` +
    `📊 *Progresso:* ${percent}%\n` +
    `│ ${bar} │\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💬 *Messaggi:* ${messaggi}\n` +
    `💰 *Soldi totali:* ${money}€\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Mancano *${needed - currentIn} XP* al prossimo livello!`

  await conn.sendMessage(m.chat, { text: resultText }, { quoted: m })
}

handler.help = ['posizione', 'level', 'rank']
handler.tags = ['info']
handler.command = /^(posizione|miolevel|miorank|level)$/i

export default handler
