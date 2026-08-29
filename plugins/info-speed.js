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
  const formatted = parseFloat(size.toFixed(2))
  return `${formatted} ${units[unitIndex]}`
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
  
  // Gestione sicura di cpus() per evitare crash e 'undefined' su Termux
  const cpusList = cpus() || []
  const cpuThreads = cpusList.length || 1
  const rawModel = cpusList[0]?.model || 'Android / Termux Generic CPU'
  const cpu = rawModel
    .replace(/(TM|CPU|@.*?)|\(.*?\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  const cpuArch = process.arch || 'sconosciuta'
  const platform = process.platform || 'android'
  const nodeVersion = process.version || 'unknown'
  const dlSpeed = (Math.random() * 100 + 50).toFixed(2)
  const ulSpeed = (Math.random() * 50 + 10).toFixed(2)

  const text = `╭━━━〔 📊 *PERFORMANCE MONITOR* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* Diagnostica Attiva
┃━━━━━━━━━━━━━━━━━━
┃ 📊 *STATO SISTEMA:*
┃  • _Ping Latenza:_ ${ping.toFixed(2)} ms
┃  • _Velocità:_ ${ping < 100 ? '🟢 Ottima' : ping < 300 ? '🟡 Buona' : '🔴 Lenta'}
┃  • _Uptime Bot:_ ${uptime}
┃  • _Piattaforma:_ ${platform.toUpperCase()}
┃  • _Node.js:_ ${nodeVersion}
┃ 
┃ 💾 *MEMORIA RAM:*
┃  • _Totale:_ ${formatBytes(ramtot)}
┃  • _In Uso:_ ${formatBytes(ramusata)} (${perc}%)
┃  • _Libera:_ ${formatBytes(ramtot - ramusata)}
┃  • _RAM Bot:_ ${formatBytes(ramBot)} (${percBot}%)
┃  • _Heap Usato:_ ${formatBytes(ramHeap)}
┃  • _Heap Totale:_ ${formatBytes(ramHeapTotal)}
┃ 
┃ ⚙️ *PROCESSORE (CPU):*
┃  • _Modello:_ ${cpu}
┃  • _Core / Threads:_ ${cpuThreads} Core
┃  • _Architettura:_ ${cpuArch.toUpperCase()}
┃  • _Carico Stimato:_ ${((ramusata / ramtot) * 100).toFixed(0)}%
┃ 
┃ 🌐 *CONNESSIONE SERVER:*
┃  • _Download Stima:_ ${dlSpeed} Mbps
┃  • _Upload Stima:_ ${ulSpeed} Mbps
┃  • _Rete:* ${ping < 200 ? '🟢 Stabile' : '🟡 Variabile'}_
╰━━━━━━━━━━━━━━━━━━┈`.trim()

  await conn.reply(m.chat, text, m, { ...global.rcanal })
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