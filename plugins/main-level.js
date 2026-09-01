// Plugin by Elixir & 888 staff
import { xpRange } from '../lib/levelling.js'

export async function all(m) {
  if (!global.db.data) return
  if (!m.sender || !m.chat) return
  if (m.fromMe) return
  if (m.mtype === 'pollUpdateMessage' || m.mtype === 'reactionMessage') return
  if (!m.message) return
  if (m.sender.endsWith('@g.us') || m.sender.endsWith('@broadcast') || m.sender.endsWith('@newsletter')) return

  let sender = m.sender.includes(':') ? m.sender.split(':')[0] + '@s.whatsapp.net' : m.sender
  if (!sender.endsWith('@s.whatsapp.net')) return

  let user = global.db.data.users[sender]
  if (!user) return

  user.exp = user.exp || 0
  user.level = user.level || 0
  user.role = user.role || 'Novizio'
  user.autolevelup = user.autolevelup !== false
// -----------------------------------------------------------
  // XP ogni 150 messaggi: al raggiungimento del 150°,  300°,...
  // vengono concessi 5 XP. Contatore dedicato per non dipendere
  // da user.messaggi (che l'handler incrementa solo nel finally).)
  // -----------------------------------------------------------
  const XP_EVERY_MESSAGES = 150
  const XP_REWARD =5
  user._xpMsgCount = (user._xpMsgCount || 0) + 1
  if (user._xpMsgCount % XP_EVERY_MESSAGES === 0) {
    user.exp = (user.exp || 0) + XP_REWARD
  }

  const currentLevel = user.level
  const xpNeeded = xpRange(currentLevel + 1).min

  const now = Date.now()
  if (user._lastLevelUp && now - user._lastLevelUp < 5000) return

  if (user.exp >= xpNeeded && user.autolevelup) {
    let newLevel = currentLevel
    while (user.exp >= xpRange(newLevel + 1).min) {
      newLevel++
    }

    if (newLevel > currentLevel) {
      user.level = newLevel
      user.role = getRole(newLevel)
      user._lastLevelUp = now

      const reward = newLevel * 50
      user.money = (user.money || 0) + reward

      const levelUpText = `🎉 *LEVEL UP!*\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👤 *${m.pushName || 'Utente'}*\n` +
        `📈 *Livello:* ${currentLevel} → ${newLevel}\n` +
        `🏅 *Ruolo:* ${user.role}\n` +
        `💰 *Bonus:* +${reward}€\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `Continua così! 🔥`

      try {
        await m.reply(levelUpText)
      } catch (e) {}
    }
  }

  if (!user.rankData) user.rankData = {}
  user.rankData.level = user.level
  user.rankData.xp = user.exp
  user.rankData.role = user.role
}

function getRole(level) {
  if (level >= 100) return '👑 Leggenda'
  if (level >= 80) return '💎 Diamante'
  if (level >= 60) return '🥇 Platino'
  if (level >= 40) return '🥈 Oro'
  if (level >= 25) return '🥉 Argento'
  if (level >= 10) return '⚡ Bronzo'
  if (level >= 5) return '🌟 Principiante'
  return '🌱 Novizio'
}

export default { all }
