global.miniera = global.miniera || {}

let handler = async (m, { conn, args, command }) => {

  let user = global.db.data.users[m.sender]
  if (!user) return

  // ───────────────────────────────
  // 💎 MENU MINIERA — 888
  // ───────────────────────────────
  if (command === "miniera") {
    let money = user.money || 0
    const bet = (x) => money >= x ? `.minieraplay ${x}` : `no_${x}`

    return conn.sendMessage(m.chat, {
      text: `
💎 *MINIERA 888*
💰 Portafoglio: *${money} 888COIN*

Scegli la puntata:
`.trim(),
      buttons: [
        { buttonId: bet(100),   buttonText: { displayText: "100 888COIN" }, type: 1 },
        { buttonId: bet(200),   buttonText: { displayText: "200 888COIN" }, type: 1 },
        { buttonId: bet(500),   buttonText: { displayText: "500 888COIN" }, type: 1 },
        { buttonId: bet(1000),  buttonText: { displayText: "1000 888COIN" }, type: 1 },
        { buttonId: bet(10000), buttonText: { displayText: "10000 888COIN" }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }

  // ───────────────────────────────
  // 💎 AVVIO PARTITA — 888
  // ───────────────────────────────
  if (command === "minieraplay") {

    let bet = parseInt(args[0])
    if (!bet || bet < 50) return m.reply("💸 Puntata minima: *50 888COIN*")
    if (user.money < bet) return m.reply(`💸 Ti servono almeno *${bet} 888COIN*`)

    let grid = Array(9).fill("💎")
    let bombs = []

    while (bombs.length < 2) {
      let r = Math.floor(Math.random() * 9)
      if (!bombs.includes(r)) {
        bombs.push(r)
        grid[r] = "💣"
      }
    }

    global.miniera[m.sender] = {
      bet,
      multiplier: 1,
      grid,
      opened: []
    }

    return sendGrid(conn, m, m.sender)
  }

  // ───────────────────────────────
  // 💎 APERTURA CASELLA — 888
  // ───────────────────────────────
  if (command === "minieraopen") {

    let game = global.miniera[m.sender]
    if (!game) return m.reply("❌ Nessuna partita attiva.")

    let pos = parseInt(args[0]) - 1
    if (isNaN(pos) || pos < 0 || pos > 8) return
    if (game.opened.includes(pos)) return

    game.opened.push(pos)

    // 💣 BOMBA
    if (game.grid[pos] === "💣") {

      delete global.miniera[m.sender]

      return conn.sendMessage(m.chat, {
        text: `
💣 *BOOM!*
Hai perso *${game.bet} 888COIN*

${revealGrid(game)}
`.trim(),
        buttons: [
          { buttonId: ".miniera", buttonText: { displayText: "🔁 Gioca di nuovo" }, type: 1 }
        ],
        headerType: 1
      }, { quoted: m })
    }

    // 💎 GEMMA → aumenta moltiplicatore
    game.multiplier *= 1.5
    return sendGrid(conn, m, m.sender)
  }

  // ───────────────────────────────
  // 💰 CASHOUT — 888
  // ───────────────────────────────
  if (command === "minieracashout") {

    let game = global.miniera[m.sender]
    if (!game) return m.reply("❌ Nessuna partita attiva.")

    let win = Math.floor(game.bet * game.multiplier)
    user.money += win

    delete global.miniera[m.sender]

    return conn.sendMessage(m.chat, {
      text: `
💰 *RITIRO COMPLETATO*
Vincita: *${win} 888COIN*
`.trim(),
      buttons: [
        { buttonId: ".miniera", buttonText: { displayText: "🔁 Gioca di nuovo" }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }
}

// ───────────────────────────────
// 💎 GRIGLIA — 888
// ───────────────────────────────
function sendGrid(conn, m, sender) {

  let game = global.miniera[sender]

  let text = `
💎 *MINIERA 888*
💰 Puntata: *${game.bet} 888COIN*
📈 Moltiplicatore: *x${game.multiplier.toFixed(2)}*

Scegli una casella:
`.trim()

  let buttons = []

  for (let i = 0; i < 9; i++) {
    let display = game.opened.includes(i) ? "💎" : (i + 1).toString()

    buttons.push({
      buttonId: `.minieraopen ${i + 1}`,
      buttonText: { displayText: display },
      type: 1
    })
  }

  buttons.push({
    buttonId: `.minieracashout`,
    buttonText: { displayText: "💰 RITIRA" },
    type: 1
  })

  return conn.sendMessage(m.chat, {
    text,
    buttons,
    headerType: 1
  }, { quoted: m })
}

// ───────────────────────────────
// 💣 RIVELA GRIGLIA — 888
// ───────────────────────────────
function revealGrid(game) {
  let out = ""
  for (let i = 0; i < 9; i++) {
    out += game.grid[i] + " "
    if ((i + 1) % 3 === 0) out += "\n"
  }
  return out
}

handler.command = /^(miniera|minieraplay|minieraopen|minieracashout)$/i
export default handler