let handler = async (m, { conn, args, usedPrefix = '.' }) => {
  const bet = Number(args[0])
  const choice = args[1]?.toLowerCase()
  const user = global.db.data.users[m.sender]

  if (!user) return m.reply('❌ Non trovo il tuo profilo nel database.')
  if (!Number.isSafeInteger(bet) || bet < 50) return m.reply(`💸 Puntata minima: *50 888COIN*.\nEsempio: ${usedPrefix}rouletteplay 100`)
  const money = Math.max(0, Number(user.money) || 0)
  if (money < bet) return m.reply(`💸 Ti servono almeno *${bet} 888COIN*. Saldo: *${money} 888COIN*.`)

  // Se non ha scelto rosso/nero → mostra menu
  if (!choice) {
    return conn.sendMessage(m.chat, {
      text: `
🎰 *ROULETTE 888*
💰 Puntata: *${bet} 888COIN*

Scegli dove puntare:
`.trim(),
      buttons: [
  { buttonId: `${usedPrefix}rouletteplay ${bet} rosso`, buttonText: { displayText: "🔴 Rosso" }, type: 1 },
  { buttonId: `${usedPrefix}rouletteplay ${bet} nero`,  buttonText: { displayText: "⚫ Nero" },  type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }

  if (choice !== 'rosso' && choice !== 'nero') {
    return m.reply(`Scegli *rosso* o *nero*.\nEsempio: ${usedPrefix}rouletteplay ${bet} rosso`)
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
    { buttonId: `${usedPrefix}rouletteplay ${bet}`, buttonText: { displayText: "🔁 Gioca di nuovo" }, type: 1 }
    ],
    headerType: 1
  }, { quoted: m })
}

handler.command = /^rouletteplay$/i
export default handler