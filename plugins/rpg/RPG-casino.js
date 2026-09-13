let handler = async (m, { conn }) => {

  await conn.sendMessage(m.chat, {
    text: `
🎰 *CASINÒ 888 BOT*

💸 Benvenuto nel paradiso della rovina economica.
Scegli il tuo gioco e tenta la fortuna.

🎯 Roulette  
🎲 Dadi  
🎰 Slot  
🃏 Blackjack  
🐎 Cavalli  
💎 Miniera  
❓ Estrazione  
🎯 Freccette  
♠️ Poker  
🎳 Bowling  
🎡 Ruota  
🎟️ Gratta e Vinci  
🏟️ Calcio Scommesse

━━━━━━━━━━━━━━━━━━━━━━
👇 Seleziona il gioco:
`.trim(),
    footer: "𝟴𝟴𝟴 𝗕𝗢𝗧 — CASINÒ",
    buttons: [
      { buttonId: ".roulette",         buttonText: { displayText: "🎯 Roulette" }, type: 1 },
      { buttonId: ".dadi",             buttonText: { displayText: "🎲 Dadi" }, type: 1 },
      { buttonId: ".slot",             buttonText: { displayText: "🎰 Slot" }, type: 1 },
      { buttonId: ".blackjack",        buttonText: { displayText: "🃏 Blackjack" }, type: 1 },
      { buttonId: ".cavalli",          buttonText: { displayText: "🐎 Cavalli" }, type: 1 },
      { buttonId: ".miniera",          buttonText: { displayText: "💎 Miniera" }, type: 1 },
      { buttonId: ".estrazione",       buttonText: { displayText: "❓ Estrazione" }, type: 1 },
      { buttonId: ".freccette",        buttonText: { displayText: "🎯 Freccette" }, type: 1 },
      { buttonId: ".poker",            buttonText: { displayText: "♠️ Poker" }, type: 1 },
      { buttonId: ".bowling",          buttonText: { displayText: "🎳 Bowling" }, type: 1 },
      { buttonId: ".ruota",            buttonText: { displayText: "🎡 Ruota" }, type: 1 },
      { buttonId: ".gratta",           buttonText: { displayText: "🎟️ Gratta e Vinci" }, type: 1 },
      { buttonId: ".calcioscommesse",  buttonText: { displayText: "🏟️ Calcio Scommesse" }, type: 1 },
    ],
    headerType: 1
  }, { quoted: m })
}

handler.command = /^casino$/i
handler.group = true
export default handler