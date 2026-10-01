// Plugin by elixir, punisher & 888 staff
import speed from 'performance-now'
import os from 'os'
import dns from 'dns'
import process from 'process'
import { fetchLatestBaileysVersion } from '@888-BOT/888baileys'

const uptimeFmt = ms => {
  const d = Math.floor(ms / 86400000)
  const h = Math.floor(ms % 86400000 / 3600000)
  const m = Math.floor(ms % 3600000 / 60000)
  return `${d}g ${h}o ${m}m`
}

const formatBytes = bytes => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

let baileysCache = { value: null, at: 0 }
const BAILEYS_TTL_MS = 6 * 60 * 60 * 1000

let handler = async (m, { conn, usedPrefix }) => {

  // Baileys version cache
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

  // DNS ping
  const dnsPing = await (async () => {
    try {
      const t = speed()
      await Promise.race([
        new Promise(r => dns.lookup('google.com', () => r())),
        new Promise(r => setTimeout(r, 400))
      ])
      return (speed() - t).toFixed(2)
    } catch {
      return 'N/D'
    }
  })()

  // Latency
  const start = speed()
  try { await conn.readMessages([m.key]) } catch {}
  const latency = (speed() - start).toFixed(2)

  // Uptime
  const uptime = uptimeFmt(process.uptime() * 1000)

  // RAM
  const ramtot = os.totalmem()
  const ramusata = ramtot - os.freemem()
  const ramBot = process.memoryUsage().rss
  const perc = ((ramusata / ramtot) * 100).toFixed(1)

  // CPU
  const cpu = os.cpus()?.[0]
  const cpuInfo = cpu?.model?.trim() || `CPU @ ${cpu?.speed || 'N/D'}MHz`
  const cpuCount = os.cpus()?.length || 'N/D'

  const text = `
⚡ *PING 888*
📡 Ping: *${latency}ms*
🌐 DNS: *${dnsPing}ms*
⏳ Uptime: *${uptime}*
🔧 Baileys: *v${baileys}*

💾 *RAM Totale:* ${formatBytes(ramtot)}
📊 *RAM Usata:* ${formatBytes(ramusata)} (${perc}%)
🤖 *RAM Bot:* ${formatBytes(ramBot)}

🖥️ CPU: *${cpuInfo}* (${cpuCount} core${cpuCount !== 'N/D' ? 's' : ''})

📂 Apri il pannello dal pulsante sotto.
`.trim()

  const buttons = [
    { buttonId: `${usedPrefix}ping`, buttonText: { displayText: '🔄 𝐑𝐢𝐜𝐚𝐥𝐜𝐨𝐥𝐚' }, type: 1 },
    { buttonId: `${usedPrefix}status`, buttonText: { displayText: '⚙️ 𝐒𝐭𝐚𝐭𝐨' }, type: 1 },
    { buttonId: `${usedPrefix}menu`, buttonText: { displayText: '📋 𝐌𝐞𝐧𝐮' }, type: 1 }
  ]

  await conn.sendMessage(
    m.chat,
    {
      text,
      footer: '888 BOT',
      buttons,
      headerType: 1
    },
    { quoted: m }
  )
}

handler.help = ['ping']
handler.tags = ['info']
handler.command = /^(ping)$/i

export default handler
