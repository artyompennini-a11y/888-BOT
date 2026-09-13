let handler = async (m, { conn, args }) => {
  let bet = parseInt(args[0])
  let user = global.db.data.users[m.sender]

  if (!bet || bet < 50) return m.reply("💸 Puntata minima: *50 888COIN*")
  if (user.money < bet) return m.reply(`💸 Ti servono almeno *${bet} 888COIN*`)

  const symbols = ["🍒", "🍋", "💎", "7️⃣"]
  const spin = () => symbols[Math.floor(Math.random() * symbols.length)]

  let a = spin(), b = spin(), c = spin()

  let text

  // JACKPOT — 888
  if (a === b && b === c) {
    user.money += bet * 2
    text = `
🎰 *SLOT 888*
${a} ${b} ${c}

💎 *JACKPOT!*
Guadagni: *+${bet * 2} 888COIN*

💼 Saldo: *${user.money} 888COIN*
`.trim()
  }

  // PERDITA — 888
  else {
    user.money -= bet
    if (user.money < 0) user.money = 0

    text = `
🎰 *SLOT 888*
${a} ${b} ${c}

💀 Hai perso:
*-${bet} 888COIN*

💼 Saldo: *${user.money} 888COIN*
`.trim()
  }

  await conn.sendMessage(m.chat, {
    text,
    buttons: [
      { buttonId: ".slot", buttonText: { displayText: "🔁 Gioca di nuovo" }, type: 1 }
    ],
    headerType: 1
  }, { quoted: m })
}

handler.command = /^slotplay$/i
export default handler