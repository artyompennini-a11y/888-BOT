let handler = async (m, { conn, args }) => {

  // Target: menzione, numero, oppure tu
  let target =
    m.mentionedJid?.[0] ||
    (args[0]?.includes('@') ? args[0].replace('@', '') + '@s.whatsapp.net' : null) ||
    m.sender

  let user = global.db.data.users[target]
  if (!user) {
    return conn.reply(m.chat, `❌ Utente non trovato nel database.`, m)
  }

  // Normalizzazione dati
  user.exp = Number(user.exp || 0)
  user.level = Number(user.level || 0)
  user.money = Number(user.money || 0)
  user.role = user.role || 'Novizio'

  // XP range per il livello successivo
  const { min, max } = xpRange(user.level)
  const nextXP = xpRange(user.level + 1).min

  // Percentuale barra XP
  let percent = Math.floor((user.exp / nextXP) * 100)
  if (percent > 100) percent = 100
  if (percent < 0 || !Number.isFinite(percent)) percent = 0

  let bar = "█".repeat(Math.floor(percent / 10)) + "░".repeat(10 - Math.floor(percent / 10))

  let missing = Math.max(0, nextXP - user.exp)

  let text = `
📊 *RANK SYSTEM*

👤 @${target.split('@')[0]}

🏆 *Livello:* ${user.level}
💬 *XP:* ${user.exp}/${nextXP}

${bar} ${percent}%

📈 *XP mancanti:* ${missing}
🏅 *Ruolo:* ${user.role}
💰 *Soldi:* ${user.money}€
`

  await conn.sendMessage(
    m.chat,
    { text, mentions: [target] },
    { quoted: m }
  )
}

handler.command = ['rank']
export default handler

