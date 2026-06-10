import { performance } from 'perf_hooks'

const toMathematicalAlphanumericSymbols = number => {
  const map = {
    '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒',
    '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗', '.': '.'
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

  return `${toMathematicalAlphanumericSymbols(days.toString().padStart(2, '0'))}d ${toMathematicalAlphanumericSymbols(hours.toString().padStart(2, '0'))}h ${toMathematicalAlphanumericSymbols(minutes.toString().padStart(2, '0'))}m`
}

const handler = async (m, { conn, usedPrefix }) => {
  const start = performance.now()
  const uptime = clockString(process.uptime() * 1000)

  const handlerStart = m.timestamp || start
  const speed = (performance.now() - handlerStart).toFixed(2)
  const speedWithFont = toMathematicalAlphanumericSymbols(speed)

  const info = `
*🏓 ᴘɪɴɢ!*

*🚀 ᴠᴇʟᴏᴄɪᴛᴀ ᴅɪ ʀɪꜱᴘᴏꜱᴛᴀ:* ${speedWithFont} ms
*⏱️ ᴜᴘᴛɪᴍᴇ:* ${uptime}
*✅ ꜱᴛᴀᴛᴜꜱ:* Online

> *𝟴𝟴𝟴 𝗕𝗢𝗧*
`.trim()

  const buttons = [
    { buttonId: `${usedPrefix}ping`, buttonText: { displayText: "📡 𝐏𝐢𝐧𝐠" }, type: 1 },
    { buttonId: `${usedPrefix}menu`, buttonText: { displayText: "📋 Menu" }, type: 1 }
  ]

  await conn.sendMessage(m.chat, {
    text: info,
    footer: "Seleziona un'opzione qui sotto 👇",
    buttons: buttons,
    headerType: 1
  }, { quoted: m })
}

handler.help = ['ping']
handler.tags = ['info']
handler.command = /^(ping)$/i

export default handler   
