// Plugin by Elixir, Punisher & 888 staff

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AFK_FILE = path.join(__dirname, '..', 'data', 'afk.json')

const formatDur = (ms) => {
    if (!ms || ms < 0) ms = 0
    const sec = Math.floor(ms / 1000)
    const min = Math.floor(sec / 60)
    const hrs = Math.floor(min / 60)
    const dd = Math.floor(hrs / 24)
    if (dd > 0) return `${dd}g ${hrs % 24}h`
    if (hrs > 0) return `${hrs}h ${min % 60}m`
    if (min > 0) return `${min}m ${sec % 60}s`
    return `${sec}s`
}

let handler = async (m, { conn }) => {
    if (!m.isGroup) {
        return conn.sendMessage(m.chat, {
            text: "❌ Questo comando funziona solo nei gruppi."
        }, { quoted: m })
    }

    let afkData = {}
    try {
        if (fs.existsSync(AFK_FILE)) {
            afkData = JSON.parse(fs.readFileSync(AFK_FILE, 'utf8'))
        }
    } catch (e) {
        console.error('[listaAFK] Errore caricamento AFK:', e)
    }

    const meta = await conn.groupMetadata(m.chat)
    const groupName = meta.subject || await conn.getName(m.chat).catch(() => '?')

    // Normalizza i membri come nel handler (number@s.whatsapp.net)
    const groupMembers = new Set(meta.participants.map(p => {
        try { return conn.decodeJid(p.id) } catch { return p.id }
    }))

    // Includiamo gli AFK del gruppo: chi è AFK in TUTTI i gruppi (onlyGroup == null)
    // oppure chi è AFK SOLO in questo gruppo (onlyGroup == m.chat)
    const filtered = Object.entries(afkData).filter(([jid, data]) => {
        if (!groupMembers.has(jid)) return false
        return data.onlyGroup == null || data.onlyGroup === m.chat
    })

    if (filtered.length === 0) {
        return conn.sendMessage(m.chat, {
            text: "📋 Nessun utente del gruppo è attualmente AFK."
        }, { quoted: m })
    }

    let txt = `
╭━━━〔 💤 *LISTA UTENTI AFK* 〕━━━┈
┃ 👥 *Gruppo:* ${groupName}
┃ *Totale AFK:* ${filtered.length}
┃━━━━━━━━━━━━━━━━━━
`

    for (const [jid, data] of filtered) {
        const name = await conn.getName(jid)
        const duration = formatDur(Date.now() - (data.since || Date.now()))
        const scope = (data.onlyGroup == null)
            ? '🌐 *Tutti i gruppi*'
            : '📍 *Solo questo gruppo*'

        txt += `┃ 👤 *${name}*\n`
        txt += `┃ ⏱️ Da: ${duration}\n`
        txt += `┃ 🎯 Stato: ${scope}\n`
        txt += `┃ 📝 Motivo: ${data.reason || 'Nessun motivo'}\n`
        txt += `┃━━━━━━━━━━━━━━━━━━\n`
    }

    txt += "╰━━━━━━━━━━━━━━━━━━┈"

    await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
}

handler.help = ['listafk']
handler.tags = ['info']
handler.command = /^(listafk)$/ig
// Consenti l'uso anche quando 'modoadmin' (Solo admin) è attivo nel gruppo
handler.modoadminBypass = true

export default handler