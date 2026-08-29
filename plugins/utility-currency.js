import fetch from 'node-fetch';

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`❌ Uso: ${usedPrefix + command} <importo> <da> <a>\n\nEsempio: ${usedPrefix + command} 100 EUR USD\n\nValute supportate: EUR, USD, GBP, JPY, BTC, ETH, ecc.`)
  }

  const args = text.trim().split(/\s+/i)
  if (args.length < 3) {
    return m.reply('❌ Formato: <importo> <valuta_origine> <valuta_destinazione>\nEsempio: 100 EUR USD')
  }

  const amount = parseFloat(args[0])
  const from = args[1].toUpperCase()
  const to = args[2].toUpperCase()

  if (isNaN(amount) || amount <= 0) {
    return m.reply('❌ Importo non valido.')
  }

  try {
    let result
    const cryptoCurrencies = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'LTC', 'BCH', 'AVAX', 'MATIC']
    const isCrypto = cryptoCurrencies.includes(from) || cryptoCurrencies.includes(to)

    if (isCrypto) {
      const fromId = from === 'USD' ? 'tether' : from.toLowerCase()
      const toId = to === 'USD' ? 'tether' : to.toLowerCase()
      
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${fromId},tether&vs_currencies=${toId}`
      const res = await fetch(url)
      const data = await res.json()
      
      if (data[fromId] && data[fromId][toId]) {
        result = amount * data[fromId][toId]
      } else {
        return m.reply('❌ Valuta crypto non supportata o errore API.')
      }
    } else {
      const url = `https://api.exchangerate-api.com/v4/latest/${from}`
      const res = await fetch(url)
      const data = await res.json()
      
      if (data.rates && data.rates[to]) {
        result = amount * data.rates[to]
      } else {
        return m.reply('❌ Valuta non supportata.')
      }
    }

    const formatted = result.toFixed(2)
    await conn.sendMessage(m.chat, {
      text: `💱 *Conversione Valuta*\n\n💰 ${amount} ${from}\n➡️ *${formatted} ${to}*`
    }, { quoted: m })

  } catch (e) {
    m.reply(`❌ Errore nella conversione: ${e.message}`)
  }
}

handler.command = ['convert', 'currency', 'valuta', 'cambio']
handler.help = ['convert <importo> <da> <a>']
handler.tags = ['utility', 'finance']

export default handler
