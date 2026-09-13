//Plugin by Elixir, Punisher & 888 staff — Grafica Premium 888

let handler = async (m, { conn, args, command }) => {

  let user = global.db.data.users[m.sender]
  if (!user) return

  // ───────────────────────────────
  // 🎯 MENU FRECCETTE — 888
  // ───────────────────────────────
  if (command === "freccette") {

    let money = user.money || 0
    const bet = (x) => money >= x ? `.freccetteplay ${x}` : `no_${x}`

    return conn.sendMessage(m.chat, {
      text: `
🎯 *FRECCETTE 888*
💰 Portafoglio: *${money} 888COIN*

Colpisci il bersaglio:
più punti fai, più vinci.
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
  }

  // ───────────────────────────────
  // 🎯 GIOCO FRECCETTE — 888
  // ───────────────────────────────
  if (command === "freccetteplay") {

    let bet = parseInt(args[0])
    let money = user.money || 0

    if (!bet || bet < 50) return m.reply("💸 Puntata minima: *50 888COIN*")
    if (money < bet) return m.reply(`💸 Ti servono almeno *${bet} 888COIN*`)

    user.money -= bet

    await conn.sendMessage(m.chat, { text: "🎯 Lancio della freccetta..." }, { quoted: m })
    await new Promise(r => setTimeout(r, 2000))

    let score = Math.floor(Math.random() * 61)
    let win = 0

    let text = `
🎯 *FRECCETTA 888*
Punteggio: *${score}*
`.trim() + "\n\n"

    if (score >= 50) {
      win = bet * 2
      text += `🎯 *BULLSEYE!*\n💰 Vinci *${win} 888COIN*`
    } else if (score >= 30) {
      win = Math.floor(bet * 1.5)
      text += `🙂 *Buon tiro*\n💰 Vinci *${win} 888COIN*`
    } else {
      text += `💀 *Tiro pessimo*\nHai perso *${bet} 888COIN*`
    }

    user.money += win

    return conn.sendMessage(m.chat, {
      text,
      buttons: [
        { buttonId: ".freccette", buttonText: { displayText: "🎯 Gioca di nuovo" }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }
}

handler.command = /^(freccette|freccetteplay)$/i
export default handler