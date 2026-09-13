//Plugin by punisher, elixir & 888 staff — Grafica Premium 888

let handler = async (m, { conn, command }) => {

  global.ruotaSession = global.ruotaSession || {}
  global.ruotaTimeout = global.ruotaTimeout || {}

  let user = global.db.data.users[m.sender]
  if (!user) {
    global.db.data.users[m.sender] = { bank: 0, ruotaCount: 0, ruotaLast: 0 }
    user = global.db.data.users[m.sender]
  }

  let oggi = new Date().toDateString()
  if (user.ruotaLast !== oggi) {
    user.ruotaCount = 0
    user.ruotaLast = oggi
  }

  // ───────────────────────────────
  // 🎡 AVVIO RUOTA — 888
  // ───────────────────────────────
  if (command === 'ruota') {

    if (user.ruotaCount >= 3)
      return conn.reply(m.chat, "❌ Hai già girato la ruota *3 volte oggi*. Torna domani.", m)

    if (global.ruotaSession[m.sender])
      return conn.reply(m.chat, "⚠️ Hai già una scelta in corso. Rispondi con *.si* o *.no*.", m)

    global.ruotaSession[m.sender] = true

    global.ruotaTimeout[m.sender] = setTimeout(() => {
      if (global.ruotaSession[m.sender]) {
        delete global.ruotaSession[m.sender]
        conn.reply(m.chat, "⏰ *Tempo scaduto!* Giro annullato.", m)
      }
    }, 30000)

    return conn.reply(
      m.chat,
      `
🎡 *RUOTA DELLA FORTUNA 888*

La ruota ha *18 spicchi*:
• 10 vincenti (max: 100.000 888COIN)
• 8 perdenti (max: perdita totale)

Vuoi tentare la fortuna?

Rispondi:
• *.si* per accettare
• *.no* per rifiutare

⏳ Hai *30 secondi* per rispondere.
`.trim(),
      m
    )
  }

  // ───────────────────────────────
  // ❌ RIFIUTO — 888
  // ───────────────────────────────
  if (command === 'no') {
    if (!global.ruotaSession[m.sender])
      return conn.reply(m.chat, "❌ Nessun giro attivo.", m)

    clearTimeout(global.ruotaTimeout[m.sender])
    delete global.ruotaTimeout[m.sender]
    delete global.ruotaSession[m.sender]

    return conn.reply(m.chat, "🚫 Hai rifiutato il giro della ruota.", m)
  }

  // ───────────────────────────────
  // ✔️ ACCETTAZIONE — 888
  // ───────────────────────────────
  if (command === 'si') {

    if (!global.ruotaSession[m.sender])
      return conn.reply(m.chat, "❌ Nessun giro attivo.", m)

    clearTimeout(global.ruotaTimeout[m.sender])
    delete global.ruotaTimeout[m.sender]
    delete global.ruotaSession[m.sender]

    user.ruotaCount += 1

    const premi = [
      { name: "*100 888COIN*", amount: 100, weight: 20 },
      { name: "*200 888COIN*", amount: 200, weight: 15 },
      { name: "*300 888COIN*", amount: 300, weight: 10 },
      { name: "*400 888COIN*", amount: 400, weight: 8 },
      { name: "*500 888COIN*", amount: 500, weight: 5 },
      { name: "*1000 888COIN*", amount: 1000, weight: 4 },
      { name: "*Raddoppia*", amount: "double", weight: 3 },
      { name: "*5000 888COIN*", amount: 5000, weight: 2 },
      { name: "*10.000 888COIN*", amount: 10000, weight: 1 },
      { name: "*100.000 888COIN*", amount: 100000, weight: 0.5 }
    ]

    const perdite = [
      { name: "*-100 888COIN*", amount: -100, weight: 20 },
      { name: "*-200 888COIN*", amount: -200, weight: 15 },
      { name: "*-300 888COIN*", amount: -300, weight: 10 },
      { name: "*-400 888COIN*", amount: -400, weight: 8 },
      { name: "*-500 888COIN*", amount: -500, weight: 5 },
      { name: "*-1000 888COIN*", amount: -1000, weight: 4 },
      { name: "*-10.000 888COIN*", amount: -10000, weight: 2 },
      { name: "*PERDI TUTTO*", amount: "all", weight: 1 }
    ]

    function pick(lista) {
      const total = lista.reduce((a, b) => a + b.weight, 0)
      let rand = Math.random() * total
      for (let item of lista) {
        if (rand < item.weight) return item
        rand -= item.weight
      }
    }

    // Animazione ruota
    const frames = [
      "🎡 ▰▱▱▱▱",
      "🎡 ▰▰▰▱▱",
      "🎡 ▰▰▰▰▰"
    ]

    await conn.reply(m.chat, "🎡 La ruota sta girando...", m)

    for (let f of frames) {
      await new Promise(r => setTimeout(r, 3000))
      await conn.reply(m.chat, f + "\n888 BOT", m)
    }

    let lista = Math.random() < 0.5 ? premi : perdite
    let risultato = pick(lista)

    if (risultato.amount === "double") user.bank *= 2
    else if (risultato.amount === "all") user.bank = 0
    else user.bank += risultato.amount

    if (user.bank < 0) user.bank = 0

    let finalText =
      (risultato.amount > 0 || risultato.amount === "double")
        ? `
🏆 *VITTORIA!*
Hai vinto: ${risultato.name}

💰 Saldo bancario attuale:
*${user.bank} 888COIN*

Fortunato!
`.trim()
        : `
💀 *SCONFITTA!*
Hai perso: ${risultato.name}

💰 Saldo bancario attuale:
*${user.bank} 888COIN*

Ritenta, sarai più fortunato!
`.trim()

    await conn.reply(m.chat, finalText, m)
  }
}

handler.command = /^(ruota|si|no)$/i
export default handler