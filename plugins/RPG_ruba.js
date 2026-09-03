let handler = async (m, { conn }) => {
  const mention = m.mentionedJid ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)
  const who = mention

  // ───────────────────────────────
  // 🔥 ERRORE: NESSUN TAG — 888
  // ───────────────────────────────
  if (!who)
    throw `╭━━━〔 ❌ *NESSUN TARGET* 〕━━━┈
┃ Tagga la persona da cui rubare!
╰━━━━━━━━━━━━━━━━━━┈`

  // ───────────────────────────────
  // 🔥 ERRORE: RUBA A SE STESSO — 888
  // ───────────────────────────────
  if (who === m.sender)
    throw `╭━━━〔 ❌ *AZIONE NON CONSENTITA* 〕━━━┈
┃ Non puoi rubare a te stesso!
╰━━━━━━━━━━━━━━━━━━┈`

  const users = global.db.data.users

  if (!users[who]) {
    users[who] = { money: 0, bank: 0, rubati: 0, furti: 0, datafurto: 'Nessuno', warn: 0 }
  }

  if (!users[m.sender]) {
    users[m.sender] = { money: 0, bank: 0, rubati: 0, furti: 0, datafurto: 'Nessuno', warn: 0 }
  }

  const uSender = users[m.sender]
  const uVictim = users[who]

  uSender.furti = uSender.furti || 0
  uSender.rubati = uSender.rubati || 0
  uSender.datafurto = uSender.datafurto || 'Nessuno'
  uSender.money = uSender.money || 0
  uSender.bank = uSender.bank || 0
  uVictim.money = uVictim.money || 0
  uVictim.bank = uVictim.bank || 0

  const senderTotalFunds = uSender.bank + uSender.money

  // ───────────────────────────────
  // 🔥 ERRORE: SOLDI INSUFFICIENTI PER RUBARE — 888
  // ───────────────────────────────
  if (senderTotalFunds < 1000)
    throw `╭━━━〔 🏦 *FONDI INSUFFICIENTI* 〕━━━┈
┃ Devi avere almeno *1000 888COIN*
┃ tra banca e portafoglio
┃ per tentare una rapina!
╰━━━━━━━━━━━━━━━━━━┈`

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

  // ───────────────────────────────
  // 🔥 VITTIMA SENZA SOLDI — 888
  // ───────────────────────────────
  if (uVictim.money <= 0) {
    let multa = Math.floor(Math.random() * 60) + 40
    const paid = payFine(multa)
    uSender.warn = (uSender.warn || 0) + 1
    const sourceText = formatFineSource(paid) || '*0 888COIN*'

    return conn.reply(
      m.chat,
`╭━━━〔 🚨 *RAPINA FALLITA* 〕━━━┈
┃ @${who.split('@')[0]} non ha soldi!
┃━━━━━━━━━━━━━━━━━━
┃ Sei stato multato di:
┃ ➜ *${multa} 888COIN* (${sourceText})
╰━━━━━━━━━━━━━━━━━━┈`,
      null,
      { mentions: [who] }
    )
  }

  let percentuale = Math.floor(Math.random() * 21) + 5
  const fallisce = Math.random() * 100 < 40

  let testo = ""

  // ───────────────────────────────
  // 🔥 RAPINA FALLITA — 888
  // ───────────────────────────────
  if (fallisce) {
    let multa = Math.floor(Math.random() * 50) + 20
    const paid = payFine(multa)
    uSender.warn = (uSender.warn || 0) + 1
    const sourceText = formatFineSource(paid) || '*0 888COIN*'

    testo =
`╭━━━〔 🚨 *SEI STATO SCOPERTO!* 〕━━━┈
┃ La polizia ti ha fermato!
┃━━━━━━━━━━━━━━━━━━
┃ Multa: *${multa} 888COIN*
┃ Pagata con: ${sourceText}
╰━━━━━━━━━━━━━━━━━━┈`
  }

  // ───────────────────────────────
  // 🔥 RAPINA RIUSCITA — 888
  // ───────────────────────────────
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

    testo =
`╭━━━〔 💰 *RAPINA RIUSCITA* 〕━━━┈
┃ Hai rubato:
┃ ➜ *${rubato} 888COIN* (${percentuale}%)
┃ A: @${who.split('@')[0]}
┃━━━━━━━━━━━━━━━━━━
┃ Ottimo colpo, soldato 888.
╰━━━━━━━━━━━━━━━━━━┈`
  }

  conn.reply(m.chat, testo, null, { mentions: [who] })
}

handler.command = /^ruba$/i
export default handler