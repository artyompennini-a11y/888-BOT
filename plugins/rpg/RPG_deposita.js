let handler = async (m, { conn, command, text }) => {
  if (!text) return m.reply("💰 Quanti soldi vuoi depositare in banca?")

  let users = global.db.data.users
  const who = m.sender

  if (!users[who]) users[who] = { money: 0, bank: 0 }

  const deposito = parseInt(text.trim())

  if (isNaN(deposito))
    return m.reply("❌ Devi inserire un numero valido.")

  if (deposito < 0)
    return m.reply(`❌ Non puoi depositare *${deposito} 888COIN*.`)

  if (deposito > users[who].money)
    return m.reply(`❌ Non hai abbastanza soldi nel portafoglio.\n💼 Hai *${users[who].money} 888COIN*`)

  users[who].bank += deposito
  users[who].money -= deposito
  users[who].ultimodeposito = deposito

  return conn.reply(
    m.chat,
    `
🏦 *Deposito completato*

Hai depositato *${deposito} 888COIN* nel tuo conto bancario.

💳 Banca: *${users[who].bank} 888COIN*
💼 Portafoglio: *${users[who].money} 888COIN*
`.trim(),
    m
  )
}

handler.command = /^deposita|deposit$/i
export default handler