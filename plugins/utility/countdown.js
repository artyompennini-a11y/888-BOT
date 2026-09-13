const handler = async (m, { conn, text, usedPrefix, command, isGroup }) => {
  if (!text) {
    return m.reply(`❌ Uso: ${usedPrefix + command} <data> <messaggio>\n\nEsempi:\n• ${usedPrefix + command} 25/12/2025 Natale\n• ${usedPrefix + command} tra 2 giorni Messaggio\n• ${usedPrefix + command} 10min Ricordati di comprare il pane`)
  }

  const args = text.trim().split(/\s+/)
  
  let targetDate
  let message

  const timeMatch = text.match(/^(\d+)\s*(s|sec|secondi?|m|min|minuti?|h|ore?|d|giorni?)\b/i)
  if (timeMatch && command !== 'countdown' && command !== 'cd' && command !== 'contoallarovescia') {
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
          text: `⏰ *PROMEMORIA!*\n\n👤 *${senderName}*\n📝 *${reminderText}*\n\n⏱️ Impostato ${timeLabel} fa`,
          mentions: [m.sender]
        })
      } catch (e) {}
    }, ms)

    return
  }

  if (args[0].toLowerCase() === 'tra') {
    const amount = parseInt(args[1])
    const unit = args[2]?.toLowerCase()
    
    if (!amount || !unit) {
      return m.reply('❌ Formato: tra <numero> <unità>\nUnità: secondi, minuti, ore, giorni, settimane, mesi')
    }

    targetDate = Date.now()
    if (unit.includes('second')) targetDate += amount * 1000
    else if (unit.includes('minut')) targetDate += amount * 60 * 1000
    else if (unit.includes('ora')) targetDate += amount * 60 * 60 * 1000
    else if (unit.includes('giorn')) targetDate += amount * 24 * 60 * 60 * 1000
    else if (unit.includes('settiman')) targetDate += amount * 7 * 24 * 60 * 60 * 1000
    else if (unit.includes('mes')) targetDate += amount * 30 * 24 * 60 * 60 * 1000
    else return m.reply('❌ Unità non valida. Usa: secondi, minuti, ore, giorni, settimane, mesi')

    message = args.slice(3).join(' ') || 'Countdown!'
  } else {
    const dateStr = args[0]
    message = args.slice(1).join(' ') || 'Countdown!'
    
    const dateParts = dateStr.split(/[\/\-\.]/)
    if (dateParts.length !== 3) {
      return m.reply('❌ Formato data non valido. Usa GG/MM/AAAA')
    }

    const [day, month, year] = dateParts.map(Number)
    targetDate = new Date(year, month - 1, day).getTime()
  }

  if (isNaN(targetDate) || targetDate <= Date.now()) {
    return m.reply('❌ Data non valida o già passata.')
  }

  if (!global.db.data.countdowns) global.db.data.countdowns = {}
  
  const countdownId = Date.now().toString()
  global.db.data.countdowns[countdownId] = {
    chat: m.chat,
    targetDate,
    message,
    createdBy: m.sender,
    createdAt: Date.now()
  }

  const target = new Date(targetDate)
  const dateStr = target.toLocaleDateString('it-IT', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  await m.reply(`✅ *Countdown creato!*\n\n📅 Data: ${dateStr}\n📝 Messaggio: ${message}\n⏳ Rimani in questo gruppo per ricevere la notifica.`)

  const notifyIn = targetDate - Date.now()
  setTimeout(async () => {
    try {
      await conn.sendMessage(m.chat, {
        text: `⏰ *COUNTDOWN SCADUTO!*\n\n📝 ${message}\n\n🗓️ ${dateStr}`
      })
      delete global.db.data.countdowns[countdownId]
    } catch (e) {
      console.error('Errore invio countdown:', e)
    }
  }, notifyIn)
}

handler.command = ['countdown', 'cd', 'contoallarovescia', 'ricordami', 'promemoria', 'reminder']
handler.help = ['countdown <data> <messaggio>', 'countdown tra <numero> <unità> <messaggio>', 'ricordami <tempo> <messaggio>']
handler.tags = ['utility']

export default handler
