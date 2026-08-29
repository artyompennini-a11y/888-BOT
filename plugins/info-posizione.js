let handler = async (m, { conn, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    let targetName = user.name || m.pushName || "Utente"

    let exp = user.exp || 0
    let level = user.level || 1
    let min = user.expMin || 0
    let needed = user.expMax ? user.expMax - user.expMin : 100

    const currentIn = exp - min
    const percentRaw = (currentIn / needed) * 100

    // Percentuale sempre valida
    const percent = Math.max(0, Math.min(100, Math.floor(percentRaw)))

    const totalBars = 12
    const filledBars = Math.max(0, Math.min(totalBars, Math.floor((percent / 100) * totalBars)))
    const emptyBars = totalBars - filledBars

    const bar = '█'.repeat(filledBars) + '░'.repeat(emptyBars)

    const role = user.role || '🌱 Novizio'
    const messaggi = user.messaggi || 0
    const money = (Number(user.money) || 0) + (Number(user.bank) || 0)

    const resultText =
`📊 *POSIZIONE UTENTE*
━━━━━━━━━━━━━━━━━━
👤 *Nome:* ${targetName}
🏅 *Ruolo:* ${role}
📈 *Livello:* ${level}
━━━━━━━━━━━━━━━━━━
✨ *XP:* ${exp}
🎯 *Prossimo livello:* ${min}
📊 *Progresso:* ${percent}%
│ ${bar} │
━━━━━━━━━━━━━━━━━━
💬 *Messaggi:* ${messaggi}
💰 *Soldi totali:* ${money}€
━━━━━━━━━━━━━━━━━━
Mancano *${Math.max(0, needed - currentIn)} XP* al prossimo livello!`

    await conn.sendMessage(m.chat, { text: resultText }, { quoted: m })
}

handler.help = ['posizione', 'level', 'rank']
handler.tags = ['info']
handler.command = /^(posizione|miolevel|miorank|level)$/i

export default handler