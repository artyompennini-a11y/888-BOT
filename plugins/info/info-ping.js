import speed from 'performance-now'
import os from 'os'
import dns from 'dns'
import fetch from 'node-fetch'
import fs from 'fs'
import process from 'process'
import { fetchLatestBaileysVersion } from '@888-BOT/888baileys'

const uptimeFmt = ms => {
  const d = Math.floor(ms / 86400000)
  const h = Math.floor(ms % 86400000 / 3600000)
  const m = Math.floor(ms % 3600000 / 60000)
  return `${d}g ${h}o ${m}m`
}

const formatBytes = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

let handler = async (m, { conn, usedPrefix }) => {
  let imageBuffer
  try {
    imageBuffer = fs.readFileSync('./media/888.jpeg.jpeg')
  } catch {
    imageBuffer = await (await fetch('https://telegra.ph/file/22b3e3d2a7b9f346e21b3.png')).buffer()
  }

  const start = speed()
  try { await conn.readMessages([m.key]) } catch {}
  const latency = (speed() - start).toFixed(2)

  const uptime = uptimeFmt(process.uptime() * 1000)

  const state = conn?.ev?.connectionState
  const status =
    state === 'open' ? '🟢 Connesso' :
    state === 'connecting' ? '🟡 Connessione…' :
    state === 'close' ? '🔴 Disconnesso' :
    `⚪ ${state || 'N/D'}`

  const ramtot = os.totalmem()
  const ramusata = ramtot - os.freemem()
  const ramBot = process.memoryUsage().rss
  const perc = ((ramusata / ramtot) * 100).toFixed(1)

  const cpu = os.cpus()?.[0]
  const cpuInfo = cpu?.model?.trim() || `CPU @ ${cpu?.speed || 'N/D'}MHz`
  const cpuCount = os.cpus()?.length || 'N/D'

  let dnsPing = 'N/D'
  try {
    const t = speed()
    await Promise.race([
      new Promise(r => dns.lookup('google.com', () => r())),
      new Promise(r => setTimeout(r, 500))
    ])
    dnsPing = (speed() - t).toFixed(2)
  } catch {}

  let baileys = 'N/D'
  try {
    baileys = (await fetchLatestBaileysVersion()).version.join('.')
  } catch {}

  const caption = `
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

  const buttonMessage = {
    image: imageBuffer,
    caption,
    footer: '',
    buttons: buttons,
    headerType: 4
  }

  await conn.sendMessage(m.chat, buttonMessage, { quoted: m })
}

handler.help = ['ping']
handler.tags = ['info']
handler.command = /^(ping)$/i

export default handler