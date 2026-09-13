global.estrazione = global.estrazione || {
  players: {},
  active: false,
  endTime: 0
}

let handler = async (m, { conn, args, command }) => {

  let user = global.db.data.users[m.sender]
  if (!user) return

  // ───────────────────────────────
  // 🎯 AVVIO ESTRAZIONE — 888
  // ───────────────────────────────
  if (command === "estrazione") {

    if (global.estrazione.active)
      return m.reply("⏳ C'è già un’estrazione in corso.")

    global.estrazione = {
      players: {},
      active: true,
      endTime: Date.now() + 60 * 1000
    }

    let money = user.money || 0
    const bet = (x) => money >= x ? `.estrazionegioca ${x}` : `no_${x}`

    await conn.sendMessage(m.chat, {
      text: `
🎯 *ESTRAZIONE 888 LIVE*

💰 Portafoglio: *${money} 888COIN*
⏳ Tempo: *60 secondi*
🎲 Scegli *1 numero (1–100)*
🏆 3 numeri vincenti
`.trim(),
      buttons: [
        { buttonId: bet(100),   buttonText: { displayText: "💵 100 888COIN" }, type: 1 },
        { buttonId: bet(200),   buttonText: { displayText: "💵 200 888COIN" }, type: 1 },
        { buttonId: bet(500),   buttonText: { displayText: "💰 500 888COIN" }, type: 1 },
        { buttonId: bet(1000),  buttonText: { displayText: "💰 1000 888COIN" }, type: 1 },
        { buttonId: bet(10000), buttonText: { displayText: "💎 10000 888COIN" }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })

    // ───────────────────────────────
    // ⏳ TIMER 60s — RISULTATO
    // ───────────────────────────────
    setTimeout(async () => {

      let players = global.estrazione.players
      let list = Object.entries(players).filter(([_, v]) => v.number !== null)

      // Nessun partecipante
      if (!list.length) {
        global.estrazione.active = false
        return conn.sendMessage(m.chat, {
          text: `
💀 *ESTRAZIONE ANNULLATA*
Nessuno ha partecipato.

Che tristezza 😐
`.trim()
        })
      }

      await conn.sendMessage(m.chat, { text: "🎯 Estrazione in corso..." })
      await new Promise(r => setTimeout(r, 2000))

      // Numeri vincenti
      let winNumbers = []
      while (winNumbers.length < 3) {
        let r = Math.floor(Math.random() * 100) + 1
        if (!winNumbers.includes(r)) winNumbers.push(r)
      }

      let winners = list.filter(([_, v]) => winNumbers.includes(v.number))
      let pool = list.reduce((acc, [_, v]) => acc + v.bet, 0)

      let text = `
🎯 *RISULTATO ESTRAZIONE 888*

🎲 Numeri usciti:
➤ ${winNumbers.join(" • ")}

💰 Montepremi:
➤ *${pool} 888COIN*
`.trim() + "\n\n"

      // Vincitori
      if (winners.length) {

        let prize = Math.floor(pool / winners.length)

        winners.forEach(([jid]) => {
          global.db.data.users[jid].money += prize
        })

        text += `🏆 *VINCITORI*\n`
        winners.forEach(([jid]) => {
          text += `➤ @${jid.split("@")[0]}\n`
        })

        text += `\n💎 Premio: *${prize} 888COIN* ciascuno`

      } else {
        text += `💀 Nessun vincitore...\n\nRiprova, magari oggi sei meno sfortunato 😈`
      }

      global.estrazione = {
        players: {},
        active: false,
        endTime: 0
      }

      await conn.sendMessage(m.chat, {
        text,
        mentions: winners.map(w => w[0]),
        buttons: [
          { buttonId: ".estrazione", buttonText: { displayText: "🎯 Nuova estrazione" }, type: 1 }
        ],
        headerType: 1
      })

    }, 60000)
  }

  // ───────────────────────────────
  // 🎰 PARTECIPAZIONE — 888
  // ───────────────────────────────
  if (command === "estrazionegioca") {

    if (!global.estrazione.active)
      return m.reply("❌ Nessuna estrazione attiva.")

    let bet = parseInt(args[0])
    if (!bet || bet < 50) return m.reply("💸 Puntata minima: *50 888COIN*")
    if (user.money < bet) return m.reply(`💸 Ti servono almeno *${bet} 888COIN*`)

    global.estrazione.players[m.sender] = {
      bet,
      number: null
    }

    user.money -= bet

    return m.reply(`
🎯 *PARTECIPAZIONE REGISTRATA*

💰 Puntata: *${bet} 888COIN*

✍️ Scrivi:
*.scegli numero*

Esempio:
*.scegli 77*
`.trim())
  }

  // ───────────────────────────────
  // 🔢 SCELTA NUMERO — 888
  // ───────────────────────────────
  if (command === "scegli") {

    if (!global.estrazione.active)
      return m.reply("❌ Nessuna estrazione attiva.")

    let game = global.estrazione.players[m.sender]
    if (!game) return m.reply("❌ Non stai partecipando.")
    if (game.number !== null) return m.reply("❌ Hai già scelto un numero.")

    let num = parseInt(args[0])
    if (!num || num < 1 || num > 100)
      return m.reply("⚠️ Numero valido: *1–100*")

    let already = Object.values(global.estrazione.players)
      .find(p => p.number === num)

    if (already)
      return m.reply("❌ Numero già preso.")

    game.number = num

    return m.reply(`
✅ *NUMERO SCELTO*

🎯 Numero: *${num}*
⏳ Attendi l’estrazione...
`.trim())
  }
}

handler.command = /^(estrazione|estrazionegioca|scegli)$/i
export default handler