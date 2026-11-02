// Plugin by elixir, punisher & 888 staff
import speed from 'performance-now'
import process from 'process'
import { fetchLatestBaileysVersion } from '@888-BOT/888baileys'

const uptimeFmt = ms => {
  const d = Math.floor(ms / 86400000)
  const h = Math.floor(ms % 86400000 / 3600000)
  const m = Math.floor(ms % 3600000 / 60000)
  return `${d}g ${h}o ${m}m`
}

const formatBytes = bytes => {
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(2)} ${units[i]}`
}

let baileysCache = { value: null, at: 0 }
const BAILEYS_TTL_MS = 6 * 60 * 60 * 1000

let handler = async (m, { conn, usedPrefix }) => {
  const nomeBot = global.nomebot || 'Bot'
  const versioneBot = global.versione || 'N/D'

  const nowB = Date.now()
  if (!baileysCache.value || nowB - baileysCache.at > BAILEYS_TTL_MS) {
    try {
      baileysCache.value = (await fetchLatestBaileysVersion()).version.join('.')
      baileysCache.at = Date.now()
    } catch {
      if (!baileysCache.value) baileysCache = { value: 'N/D', at: Date.now() }
    }
  }
  const baileys = baileysCache.value

  const start = speed()
  try { await conn.readMessages([m.key]) } catch {}
  const latency = (speed() - start).toFixed(2)

  const text = `
⚡ *PING ${nomeBot}*
📡 Ping: *${latency}ms*
⏳ Uptime: *${uptimeFmt(process.uptime() * 1000)}*
🏷️ Versione: *${versioneBot}*
🔧 Baileys: *v${baileys}*
🤖 RAM Bot: *${formatBytes(process.memoryUsage().rss)}*
`.trim()

  const buttons = [
    { buttonId: `${usedPrefix}ping`, buttonText: { displayText: '🔄 Ricalcola' }, type: 1 },
    { buttonId: `${usedPrefix}status`, buttonText: { displayText: '⚙️ Stato' }, type: 1 },
    { buttonId: `${usedPrefix}menu`, buttonText: { displayText: '📋 Menu' }, type: 1 }
  ]

  await conn.sendMessage(
    m.chat,
    { text, footer: nomeBot, buttons, headerType: 1 },
    { quoted: m }
  )
}

handler.help = ['ping']
handler.tags = ['info']
handler.command = /^(ping)$/i

export default handler