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
      { buttonId: ".roulette",         buttonText: { displayText: "🎯 𝐑𝐨𝐮𝐥𝐞𝐭𝐭𝐞" }, type: 1 },
      { buttonId: ".dadi",             buttonText: { displayText: "🎲 𝐃𝐚𝐝𝐢" }, type: 1 },
      { buttonId: ".slot",             buttonText: { displayText: "🎰 𝐒𝐥𝐨𝐭" }, type: 1 },
      { buttonId: ".blackjack",        buttonText: { displayText: "🃏 𝐁𝐥𝐚𝐜𝐤𝐣𝐚𝐜𝐤" }, type: 1 },
      { buttonId: ".cavalli",          buttonText: { displayText: "🐎 𝐂𝐚𝐯𝐚𝐥𝐥𝐢" }, type: 1 },
      { buttonId: ".miniera",          buttonText: { displayText: "💎 𝐌𝐢𝐧𝐢𝐞𝐫𝐚" }, type: 1 },
      { buttonId: ".estrazione",       buttonText: { displayText: "❓ 𝐄𝐬𝐭𝐫𝐚𝐳𝐢𝐨𝐧𝐞" }, type: 1 },
      { buttonId: ".freccette",        buttonText: { displayText: "🎯 𝐅𝐫𝐞𝐜𝐜𝐞𝐭𝐭𝐞" }, type: 1 },
      { buttonId: ".poker",            buttonText: { displayText: "♠️ 𝐏𝐨𝐤𝐞𝐫" }, type: 1 },
      { buttonId: ".bowling",          buttonText: { displayText: "🎳 𝐁𝐨𝐰𝐥𝐢𝐧𝐠" }, type: 1 },
      { buttonId: ".ruota",            buttonText: { displayText: "🎡 𝐑𝐮𝐨𝐭𝐚" }, type: 1 },
      { buttonId: ".gratta",           buttonText: { displayText: "🎟️ 𝐆𝐫𝐚𝐭𝐭𝐚 𝐞 𝐕𝐢𝐧𝐜𝐢" }, type: 1 },
      { buttonId: ".calcioscommesse",  buttonText: { displayText: "🏟️ 𝐂𝐚𝐥𝐜𝐢𝐨 𝐒𝐜𝐨𝐦𝐦𝐞𝐬𝐬𝐞" }, type: 1 },
    ],
    headerType: 1
  }, { quoted: m })
}

handler.command = /^casino$/i
handler.group = true
export default handler