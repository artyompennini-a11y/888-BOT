let handler = async (m, { conn, usedPrefix = '.' }) => {
  const user = global.db.data.users[m.sender]
  if (!user) return m.reply('❌ Non trovo il tuo profilo nel database.')
  const money = Math.max(0, Number(user.money) || 0)
  const bets = [100, 500, 1000, 10000].filter(amount => amount <= money).slice(-3)

  const text = `
🎰 *ROULETTE 888*
💰 Portafoglio: *${money} 888COIN*

Scegli l'importo da puntare.${bets.length ? '' : `\n\nPuoi puntare almeno 50 888COIN scrivendo:\n${usedPrefix}rouletteplay 50`}
`.trim()

  await conn.sendMessage(m.chat, {
    text,
    ...(bets.length ? {
      buttons: bets.map(amount => ({
        buttonId: `${usedPrefix}rouletteplay ${amount}`,
        buttonText: { displayText: `${amount} 888COIN` },
        type: 1
      })),
      headerType: 1
    } : {})
  }, { quoted: m })
}

handler.command = /^roulette$/i
export default handler