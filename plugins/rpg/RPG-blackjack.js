let pesca = () => Math.floor(Math.random() * 10) + 1

let handler = async (m, { conn, args, command }) => {

  global.blackjack = global.blackjack || {}
  let user = global.db.data.users[m.sender]

  // ───────────────────────────────
  // 🎮 AVVIO PARTITA — 888
  // ───────────────────────────────
  if (command === "blackjackplay") {
    let bet = parseInt(args[0])
    if (!bet || bet < 50) return m.reply("💸 Puntata minima: *50 888COIN*")
    if (user.money < bet) return m.reply(`💸 Ti servono almeno *${bet} 888COIN*`)

    global.blackjack[m.sender] = {
      player: [pesca(), pesca()],
      dealer: [pesca(), pesca()],
      bet
    }

    let g = global.blackjack[m.sender]
    let sum = g.player.reduce((a,b)=>a+b,0)

    return conn.sendMessage(m.chat, {
      text: `
🃏 *BLACKJACK 888*

🧑 Tu: ${g.player.join(" + ")} = *${sum}*
🤖 Banco: ${g.dealer[0]} + ?

🎮 Scegli un’azione:
`.trim(),
      buttons: [
        { buttonId: ".pesco", buttonText: { displayText: "🃏 Pesco" }, type: 1 },
        { buttonId: ".sto",   buttonText: { displayText: "✋ Sto"   }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }

  let g = global.blackjack[m.sender]
  if (!g) return m.reply("❌ Nessuna partita in corso.")

  // ───────────────────────────────
  // 🃏 PESCO — 888
  // ───────────────────────────────
  if (command === "pesco") {
    g.player.push(pesca())
    let sum = g.player.reduce((a,b)=>a+b,0)

    if (sum > 21) {
      user.money -= g.bet
      delete global.blackjack[m.sender]

      return conn.sendMessage(m.chat, {
        text: `
💀 *SBALLATO 888*
Totale: ${sum}

-${g.bet} 888COIN
`.trim(),
        buttons: [
          { buttonId: ".blackjackplay", buttonText: { displayText: "🔁 Gioca di nuovo" }, type: 1 },
          { buttonId: ".casino",        buttonText: { displayText: "🎰 Torna al casinò" }, type: 1 }
        ],
        headerType: 1
      }, { quoted: m })
    }

    return conn.sendMessage(m.chat, {
      text: `
🃏 *Carte attuali*
${g.player.join(", ")} = *${sum}*
`.trim(),
      buttons: [
        { buttonId: ".pesco", buttonText: { displayText: "🃏 Pesco" }, type: 1 },
        { buttonId: ".sto",   buttonText: { displayText: "✋ Sto"   }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }

  // ───────────────────────────────
  // ✋ STO — 888
  // ───────────────────────────────
  if (command === "sto") {
    let sumP = g.player.reduce((a,b)=>a+b,0)
    let sumD = g.dealer.reduce((a,b)=>a+b,0)

    while (sumD < 17) {
      g.dealer.push(pesca())
      sumD = g.dealer.reduce((a,b)=>a+b,0)
    }

    let msg = `
🃏 *BLACKJACK 888 — Risultato*

🧑 Tu: *${sumP}*
🤖 Banco: *${sumD}*
`.trim()

    if (sumD > 21 || sumP > sumD) {
      user.money += g.bet
      msg += `\n🏆 *VITTORIA* +${g.bet} 888COIN`
    } else if (sumP < sumD) {
      user.money -= g.bet
      msg += `\n💀 *SCONFITTA* -${g.bet} 888COIN`
    } else {
      msg += `\n😐 *Pareggio*`
    }

    msg += `\n💼 Saldo: *${user.money} 888COIN*`

    delete global.blackjack[m.sender]

    return conn.sendMessage(m.chat, {
      text: msg,
      buttons: [
        { buttonId: ".blackjack", buttonText: { displayText: "🔁 Gioca di nuovo" }, type: 1 },
        { buttonId: ".casino",    buttonText: { displayText: "🎰 Torna al casinò" }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }
}

handler.command = /^(blackjackplay|pesco|sto)$/i
export default handler