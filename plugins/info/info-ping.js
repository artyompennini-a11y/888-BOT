import speed from 'performance-now'
import os from 'os'
import dns from 'dns'
import fetch from 'node-fetch'
import fs from 'fs'
import { fetchLatestBaileysVersion } from '@chatunity/baileys'

const uptimeFmt = ms => {
  const d = Math.floor(ms / 86400000)
  const h = Math.floor(ms % 86400000 / 3600000)
  const m = Math.floor(ms % 3600000 / 60000)
  return `${d}g ${h}o ${m}m`
}

const formatMem = (bytes) => {
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}

const getSystemRAM = () => {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  return { total, used, free }
}

let handler = async (m, { conn, usedPrefix }) => {

  // Immagine stile 888
  let imageBuffer
  try {
    imageBuffer = fs.readFileSync('./media/888.jpeg.jpeg')
  } catch {
    imageBuffer = await (await fetch('https://telegra.ph/file/22b3e3d2a7b9f346e21b3.png')).buffer()
  }

  // Ping reale: misura il round-trip time del messaggio
  const start = speed()
  try { await conn.readMessages([m.key]) } catch {}
  const latency = (speed() - start).toFixed(2)

  // Uptime
  const uptime = uptimeFmt(process.uptime() * 1000)

  // Connessione
  const state = conn?.ev?.connectionState
  const status =
    state === 'open' ? '🟢 Connesso' :
    state === 'connecting' ? '🟡 Connessione…' :
    state === 'close' ? '🔴 Disconnesso' :
    `⚪ ${state || 'N/D'}`

  // RAM di sistema reale
  const sysRam = getSystemRAM()
  const ramTotal = sysRam.total
  const ramUsed = sysRam.used
  const ramFree = sysRam.free

  // CPU
  const cpu = os.cpus()?.[0]
  const cpuInfo = cpu?.model?.trim() || `CPU @ ${cpu?.speed || 'N/D'}MHz`
  const cpuCount = os.cpus()?.length || 'N/D'

  // DNS
  let dnsPing = 'N/D'
  try {
    const t = speed()
    await Promise.race([
      new Promise(r => dns.lookup('google.com', () => r())),
      new Promise(r => setTimeout(r, 500))
    ])
    dnsPing = (speed() - t).toFixed(2)
  } catch {}

  // Baileys
  let baileys = 'N/D'
  try {
    baileys = (await fetchLatestBaileysVersion()).version.join('.')
  } catch {}

  // Caption stile 888 con dati reali
  const caption = `
⚡ *PING 888*
📡 Ping: *${latency}ms*
🌐 DNS: *${dnsPing}ms*
⏳ Uptime: *${uptime}*
🔧 Baileys: *v${baileys}*
💾 RAM: *${formatMem(ramUsed)} / ${formatMem(ramTotal)}* (Lib: ${formatMem(ramFree)})
🖥️ CPU: *${cpuInfo}* (${cpuCount} core${cpuCount !== 'N/D' ? 's' : ''})

📂 Apri il pannello dal pulsante sotto.
`.trim()

  // Pulsante single_select stile menu 888
  const buttonParamsJson = JSON.stringify({
    title: "Pannello Ping 888",
    sections: [
      {
        title: "📡 Diagnostica",
        highlight_label: "888",
        rows: [
          { id: `${usedPrefix}ping`, title: "🔄 Ricalcola Ping", description: "Esegui un nuovo test" },
          { id: `${usedPrefix}status`, title: "⚙️ Stato Sistema", description: "Info hardware & runtime" },
          { id: `${usedPrefix}menu`, title: "📋 Menu Principale", description: "Torna al menu 888" }
        ]
      }
    ]
  })

  await conn.sendMessage(m.chat, {
    image: imageBuffer,
    caption,
    footer: "",
    headerType: 4,
    interactiveButtons: [
      {
        name: "single_select",
        buttonParamsJson
      }
    ]
  }, { quoted: m })
}

handler.help = ['ping']
handler.tags = ['info']
handler.command = /^(ping)$/i

export default handler
