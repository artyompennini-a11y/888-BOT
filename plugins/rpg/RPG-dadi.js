let handler = async (m, { conn, args }) => {
  let bet = parseInt(args[0])
  let user = global.db.data.users[m.sender]

  if (user.money < bet) return m.reply(`💸 Ti servono almeno *${bet} 888COIN*`)

  let u = Math.floor(Math.random() * 6) + 1
  let b = Math.floor(Math.random() * 6) + 1

  let text

  // 🏆 VITTORIA — 888
  if (u > b) {
    user.money += bet
    text = `
🎲 *DADI 888*
Tu: ${u} | Bot: ${b}

🏆 Vittoria  
+${bet} 888COIN

💼 Saldo: *${user.money} 888COIN*
`.trim()
  }

  // 💀 SCONFITTA — 888
  else if (u < b) {
    user.money -= bet
    text = `
🎲 *DADI 888*
Tu: ${u} | Bot: ${b}

💀 Sconfitta  
-${bet} 888COIN

💼 Saldo: *${user.money} 888COIN*
`.trim()
  }

  // 😐 PAREGGIO — 888
  else {
    text = `
🎲 *DADI 888*
Tu: ${u} | Bot: ${b}

😐 Pareggio

💼 Saldo: *${user.money} 888COIN*
`.trim()
  }

  await conn.sendMessage(m.chat, {
    text,
    buttons: [
      { buttonId: ".dadi", buttonText: { displayText: "🔁 Gioca di nuovo" }, type: 1 }
    ],
    headerType: 1
  }, { quoted: m })
}

handler.command = /^dadiplay$/i
export default handler