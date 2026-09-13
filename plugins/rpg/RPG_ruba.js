let handler = async (m, { conn }) => {
  const mention = m.mentionedJid ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)
  const who = mention

  // ❌ Nessun target
  if (!who)
    throw `
❌ *Nessun target*
Tagga la persona da cui rubare.
`.trim()

  // ❌ Non puoi rubare a te stesso
  if (who === m.sender)
    throw `
❌ *Azione non consentita*
Non puoi rubare a te stesso.
`.trim()

  const users = global.db.data.users

  if (!users[who]) {
    users[who] = { money: 0, bank: 0, rubati: 0, furti: 0, datafurto: 'Nessuno', warn: 0 }
  }

  if (!users[m.sender]) {
    users[m.sender] = { money: 0, bank: 0, rubati: 0, furti: 0, datafurto: 'Nessuno', warn: 0 }
  }

  const uSender = users[m.sender]
  const uVictim = users[who]

  uSender.money ||= 0
  uSender.bank ||= 0
  uVictim.money ||= 0
  uVictim.bank ||= 0

  const senderTotalFunds = uSender.bank + uSender.money

  // ❌ Fondi insufficienti per rubare
  if (senderTotalFunds < 1000)
    throw `
🏦 *Fondi insufficienti*
Ti servono almeno *1000 888COIN* tra banca e portafoglio per tentare un furto.
`.trim()

  const payFine = (amount) => {
    let usedBank = Math.min(uSender.bank, amount)
    uSender.bank -= usedBank
    let remaining = amount - usedBank
    let usedMoney = 0
    if (remaining > 0) {
      usedMoney = Math.min(uSender.money, remaining)
      uSender.money -= usedMoney
      remaining -= usedMoney
    }
    return { usedBank, usedMoney, remaining }
  }

  const formatFineSource = ({ usedBank, usedMoney }) => {
    const parts = []
    if (usedBank > 0) parts.push(`*${usedBank} 888COIN* dalla banca`)
    if (usedMoney > 0) parts.push(`*${usedMoney} 888COIN* dal portafoglio`)
    return parts.join(' e ')
  }

  // ❌ Vittima senza soldi
  if (uVictim.money <= 0) {
    let multa = Math.floor(Math.random() * 60) + 40
    const paid = payFine(multa)
    uSender.warn = (uSender.warn || 0) + 1
    const sourceText = formatFineSource(paid) || '*0 888COIN*'

    return conn.reply(
      m.chat,
      `
🚨 *Rapina fallita*
@${who.split('@')[0]} non ha soldi.

Multa: *${multa} 888COIN*
Pagata con: ${sourceText}
`.trim(),
      null,
      { mentions: [who] }
    )
  }

  let percentuale = Math.floor(Math.random() * 21) + 5
  const fallisce = Math.random() * 100 < 40

  let testo = ""

  // ❌ Rapina fallita
  if (fallisce) {
    let multa = Math.floor(Math.random() * 50) + 20
    const paid = payFine(multa)
    uSender.warn = (uSender.warn || 0) + 1
    const sourceText = formatFineSource(paid) || '*0 888COIN*'

    testo = `
🚨 *Sei stato scoperto!*
La polizia ti ha fermato.

Multa: *${multa} 888COIN*
Pagata con: ${sourceText}
`.trim()
  }

  // 💰 Rapina riuscita
  else {
    let rubato = Math.floor((uVictim.money * percentuale) / 100)
    rubato = Math.min(rubato, uVictim.money)

    uVictim.money -= rubato
    uSender.money += rubato

    uSender.furti += 1
    uSender.rubati += rubato
    uSender.datafurto = new Date().toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    testo = `
💰 *Rapina riuscita*
Hai rubato *${rubato} 888COIN* (${percentuale}%)
A: @${who.split('@')[0]}

Ottimo colpo, soldato 888.
`.trim()
  }

  conn.reply(m.chat, testo, null, { mentions: [who] })
}

handler.command = /^ruba$/i
export default handler