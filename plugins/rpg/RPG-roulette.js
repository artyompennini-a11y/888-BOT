let handler = async (m, { conn, args }) => {
  let bet = parseInt(args[0])
  let choice = args[1] // rosso o nero

  let user = global.db.data.users[m.sender]

  if (!bet || bet < 50) return m.reply("💸 Puntata minima: *50 888COIN*")
  if (user.money < bet) return m.reply(`💸 Ti servono almeno *${bet} 888COIN*`)

  // Se non ha scelto rosso/nero → mostra menu
  if (!choice) {
    return conn.sendMessage(m.chat, {
      text: `
🎰 *ROULETTE 888*
💰 Puntata: *${bet} 888COIN*

Scegli dove puntare:
`.trim(),
      buttons: [
        { buttonId: `.rouletteplay ${bet} rosso`, buttonText: { displayText: "🔴 Rosso" }, type: 1 },
        { buttonId: `.rouletteplay ${bet} nero`,  buttonText: { displayText: "⚫ Nero" },  type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }

  // Risultato casuale
  let result = Math.random() < 0.5 ? "rosso" : "nero"
  let win = choice.toLowerCase() === result

  // Messaggio finale
  let text

  if (win) {
    user.money += bet
    text = `
🎰 *ROULETTE 888*
🎯 Risultato: *${result.toUpperCase()}*

🟢 Hai vinto!
💰 Guadagno: *+${bet} 888COIN*

💼 Saldo: *${user.money} 888COIN*
`.trim()
  } else {
    user.money -= bet
    if (user.money < 0) user.money = 0

    text = `
🎰 *ROULETTE 888*
🎯 Risultato: *${result.toUpperCase()}*

🔴 Hai perso!
💸 Perdita: *-${bet} 888COIN*

💼 Saldo: *${user.money} 888COIN*
`.trim()
  }

  await conn.sendMessage(m.chat, {
    text,
    buttons: [
      { buttonId: `.rouletteplay ${bet}`, buttonText: { displayText: "🔁 Gioca di nuovo" }, type: 1 }
    ],
    headerType: 1
  }, { quoted: m })
}

handler.command = /^rouletteplay$/i
export default handler