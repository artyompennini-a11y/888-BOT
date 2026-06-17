import { performance } from 'perf_hooks'

const toMathematicalAlphanumericSymbols = number => {
  const map = {
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '.': '.'
  }

  return number
    .toString()
    .split('')
    .map(d => map[d] || d)
    .join('')
}

const clockString = ms => {
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)

  return `${days.toString().padStart(2, '0')}g ${hours.toString().padStart(2, '0')}o ${minutes.toString().padStart(2, '0')}m`
}

let handler = async (m, { conn, usedPrefix }) => {
  const start = performance.now()
  const uptime = clockString(process.uptime() * 1000)

  const handlerStart = m.timestamp || start
  const speed = (performance.now() - handlerStart).toFixed(2)
  const speedWithFont = toMathematicalAlphanumericSymbols(speed)

  const info = `╭━━━〔 🏓 *PING* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* Online / Attivo
┃━━━━━━━━━━━━━━━━━━
┃ 🚀 *Risposta:* ${speedWithFont} ms
┃ ⏳ *Uptime:* ${uptime}
┃ 📶 *Segnale:* Eccellente
╰━━━━━━━━━━━━━━━━━━┈`.trim()

  const buttons = [
    { buttonId: `${usedPrefix}ping`, buttonText: { displayText: "📡 PING" }, type: 1 },
    { buttonId: `${usedPrefix}menu`, buttonText: { displayText: "📋 MENU" }, type: 1 }
  ]

  await conn.sendMessage(m.chat, {
    text: info,
    footer: "Seleziona un'opzione qui sotto o digita il relativo comando.",
    buttons: buttons,
    headerType: 1
  }, { quoted: m })
}

handler.help = ['ping']
handler.tags = ['info']
handler.command = /^(ping)$/i

export default handler
