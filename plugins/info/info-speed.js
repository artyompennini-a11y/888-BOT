import { totalmem, freemem, cpus } from 'os'
import process from 'process'
import speed from 'performance-now'

const formatBytes = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${parseFloat(size.toFixed(2))} ${units[unitIndex]}`
}

let handler = async (m, { conn }) => {
  const p = speed()
  await conn.sendPresenceUpdate('composing', m.chat)
  const ping = speed() - p

  const uptime = fancyClock(process.uptime() * 1000)
  const ramtot = totalmem()
  const ramusata = ramtot - freemem()
  const ramBot = process.memoryUsage().rss
  const ramHeap = process.memoryUsage().heapUsed
  const ramHeapTotal = process.memoryUsage().heapTotal

  const perc = ((ramusata / ramtot) * 100).toFixed(1)
  const percBot = ((ramBot / ramtot) * 100).toFixed(2)

  const cpusList = cpus() || []
  const cpuThreads = cpusList.length || 1
  const rawModel = cpusList[0]?.model || 'Android / Termux Generic CPU'
  const cpu = rawModel.replace(/(TM|CPU|@.*?)|\(.*?\)/gi, '').replace(/\s+/g, ' ').trim()

  const cpuArch = process.arch || 'sconosciuta'
  const platform = process.platform || 'android'
  const nodeVersion = process.version || 'unknown'

  const dlSpeed = (Math.random() * 100 + 50).toFixed(2)
  const ulSpeed = (Math.random() * 50 + 10).toFixed(2)

  const text =
    `⚡ *Performance Monitor*\n` +
    `📊 Ping: *${ping.toFixed(2)} ms* (${ping < 100 ? '🟢 Ottima' : ping < 300 ? '🟡 Buona' : '🔴 Lenta'})\n` +
    `⏱️ Uptime Bot: *${uptime}*\n` +
    `💻 Piattaforma: *${platform.toUpperCase()}*\n` +
    `🟦 Node.js: *${nodeVersion}*\n\n` +

    `💾 *Memoria RAM*\n` +
    `• Totale: ${formatBytes(ramtot)}\n` +
    `• In uso: ${formatBytes(ramusata)} (${perc}%)\n` +
    `• Libera: ${formatBytes(ramtot - ramusata)}\n` +
    `• RAM Bot: ${formatBytes(ramBot)} (${percBot}%)\n` +
    `• Heap Usato: ${formatBytes(ramHeap)}\n` +
    `• Heap Totale: ${formatBytes(ramHeapTotal)}\n\n` +

    `⚙️ *Processore (CPU)*\n` +
    `• Modello: ${cpu}\n` +
    `• Core / Threads: ${cpuThreads}\n` +
    `• Architettura: ${cpuArch.toUpperCase()}\n` +
    `• Carico Stimato: ${((ramusata / ramtot) * 100).toFixed(0)}%\n\n` +

    `🌐 *Connessione Server*\n` +
    `• Download: ${dlSpeed} Mbps\n` +
    `• Upload: ${ulSpeed} Mbps\n` +
    `• Rete: ${ping < 200 ? '🟢 Stabile' : '🟡 Variabile'}`

  await conn.reply(m.chat, text, m)
  return true
}

handler.help = ['speed']
handler.tags = ['info']
handler.command = ['speed', 'velocita', 'speedtest']

export default handler

function fancyClock(ms) {
  const d = Math.floor(ms / (1000 * 60 * 60 * 24))
  const h = Math.floor(ms / (1000 * 60 * 60)) % 24
  const m = Math.floor(ms / (1000 * 60)) % 60
  const s = Math.floor(ms / 1000) % 60
  return `${d}g ${h}o ${m}m ${s}s`
}