// Plugin by Elixir & 888 staff

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
  if (!text) return m.reply(`⚠️ *Uso corretto:* ${usedPrefix + command} *[tempo] [messaggio]*\n\nEsempi:\n• ${usedPrefix + command} 10min Ricordati di comprare il pane\n• ${usedPrefix + command} 1h Riunione di gruppo\n• ${usedPrefix + command} 30s Pausa caffè`)

  const timeMatch = text.match(/^(\d+)\s*(s|sec|secondi?|m|min|minuti?|h|ore?|d|giorni?)\b/i)
  if (!timeMatch) return m.reply('⚠️ *Formato tempo non valido.*\n\nUsa: s (secondi), m (minuti), h (ore), d (giorni)')

  const amount = parseInt(timeMatch[1])
  const unit = timeMatch[2].toLowerCase()
  let ms = 0

  if (unit.startsWith('s')) ms = amount * 1000
  else if (unit.startsWith('m')) ms = amount * 60000
  else if (unit.startsWith('h')) ms = amount * 3600000
  else if (unit.startsWith('d')) ms = amount * 86400000

  if (ms > 7 * 86400000) return m.reply('⚠️ *Il promemoria massimo è di 7 giorni.*')

  const reminderText = text.replace(timeMatch[0], '').trim()
  if (!reminderText) return m.reply('⚠️ *Scrivi anche il messaggio del promemoria!*')

  const timeLabel = `${amount}${unit.startsWith('s') ? 's' : unit.startsWith('m') ? 'min' : unit.startsWith('h') ? 'h' : 'g'}`

  await m.reply(`⏰ *Promemoria impostato!*\n\n📝 *Messaggio:* ${reminderText}\n⏱️ *Tra:* ${timeLabel}\n\nTi avviserò qui nel gruppo.`)

  setTimeout(async () => {
    try {
      const senderName = await conn.getName(m.sender)
      await conn.sendMessage(m.chat, {
        text: `⏰ *PROMEMORIA!*\n\n` +
          `👤 *${senderName}*\n` +
          `📝 *${reminderText}*\n\n` +
          `⏱️ Impostato ${timeLabel} fa`,
        mentions: [m.sender]
      })
    } catch (e) {}
  }, ms)
}

handler.help = ['ricordami', 'promemoria', 'reminder']
handler.tags = ['utility']
handler.command = /^(ricordami|promemoria|reminder)$/i
handler.group = true

export default handler
