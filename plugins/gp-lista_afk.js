// Plugin lista AFK — SOLO UTENTI DEL GRUPPO — by 888 Staff

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AFK_FILE = path.join(__dirname, '..', 'data', 'afk.json')

let handler = async (m, { conn }) => {
    if (!m.isGroup) {
        return conn.sendMessage(m.chat, {
            text: "❌ Questo comando funziona solo nei gruppi."
        }, { quoted: m })
    }

    // 🔹 Ricarica SEMPRE i dati AFK dal file
    let afkData = {}
    try {
        if (fs.existsSync(AFK_FILE)) {
            afkData = JSON.parse(fs.readFileSync(AFK_FILE, 'utf8'))
        }
    } catch (e) {
        console.error('[listaAFK] Errore caricamento AFK:', e)
    }

    const entries = Object.entries(afkData)

    // 🔹 Ottieni i membri del gruppo
    const meta = await conn.groupMetadata(m.chat)
    const groupMembers = meta.participants.map(p => p.id)

    // 🔹 Filtra SOLO utenti presenti nel gruppo
    const filtered = entries.filter(([jid]) => groupMembers.includes(jid))

    if (filtered.length === 0) {
        return conn.sendMessage(m.chat, { 
            text: "📋 Nessun utente del gruppo è attualmente AFK." 
        }, { quoted: m })
    }

    let txt = `
╭━━━〔 💤 *LISTA AFK — SOLO GRUPPO* 〕━━━┈
┃ *Totale:* ${filtered.length}
┃━━━━━━━━━━━━━━━━━━
`

    for (const [jid, data] of filtered) {
        const name = await conn.getName(jid)
        const seconds = Math.floor((Date.now() - data.since) / 1000)

        txt += `┃ 👤 *${name}*\n`
        txt += `┃ ⏱️ AFK da: ${seconds}s\n`
        txt += `┃ 📝 Motivo: ${data.reason}\n`
        txt += `┃━━━━━━━━━━━━━━━━━━\n`
    }

    txt += "╰━━━━━━━━━━━━━━━━━━┈"

    await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
}

handler.help = ['listaafk']
handler.tags = ['info']
handler.command = /^(listaafk)$/i

export default handler