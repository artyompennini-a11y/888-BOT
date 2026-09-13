global.prelievi = global.prelievi || {}

let handler = async (m, { conn, command, text }) => {
  let users = global.db.data.users
  const who = m.sender

  if (!users[who]) users[who] = {}

  users[who].bank = Number(users[who].bank) || 0
  users[who].money = Number(users[who].money) || 0

  // ✔️ CONFERMA PRELIEVO — 888
  if (command === "confermaprelievo") {
    let data = global.prelievi[who]
    if (!data)
      return m.reply(`
❌ *Nessun prelievo in corso*
`.trim())

    let amount = Number(data)

    if (amount > users[who].bank)
      return m.reply(`
🏦 *Fondi insufficienti*
Non hai abbastanza soldi in banca.
`.trim())

    users[who].bank -= amount
    users[who].money += amount
    users[who].ultimoprelievo = amount

    delete global.prelievi[who]

    return conn.reply(m.chat, `
💸 *Prelievo effettuato*
Hai prelevato *${amount} 888COIN*.

💰 Contanti: *${users[who].money} 888COIN*
🏦 Banca: *${users[who].bank} 888COIN*
`.trim(), m)
  }

  // ❌ ANNULLA PRELIEVO — 888
  if (command === "annullaprelievo") {
    delete global.prelievi[who]
    return m.reply(`
❌ *Prelievo annullato*
Operazione annullata correttamente.
`.trim())
  }

  // 💬 RICHIESTA IMPORTO — 888
  if (!text)
    throw `
💸 *Quanto vuoi prelevare?*
Inserisci l’importo da prelevare.
`.trim()

  const prelievo = parseInt(text)

  // 🔍 VALIDAZIONE IMPORTO — 888
  if (isNaN(prelievo))
    throw `
❌ *Importo non valido*
Inserisci un numero.
`.trim()

  if (prelievo < 0)
    throw `
❌ *Importo negativo*
Non puoi prelevare soldi negativi.
`.trim()

  if (prelievo > users[who].bank)
    throw `
🏦 *Fondi insufficienti*
Non hai abbastanza soldi in banca.
`.trim()

  global.prelievi[who] = prelievo

  // 🔘 CONFERMA CON BOTTONI — 888
  await conn.sendMessage(
    m.chat,
    {
      text: `
💸 *Conferma prelievo*
Vuoi prelevare *${prelievo} 888COIN*?
`.trim(),
      buttons: [
        { buttonId: ".confermaprelievo", buttonText: { displayText: "✅ SI" }, type: 1 },
        { buttonId: ".annullaprelievo", buttonText: { displayText: "❌ NO" }, type: 1 }
      ],
      headerType: 1
    },
    { quoted: m }
  )
}

handler.command = /^(preleva|prelievo|ritira|confermaprelievo|annullaprelievo)$/i
handler.tags = ['RPG']

export default handler