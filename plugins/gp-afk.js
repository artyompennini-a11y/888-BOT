import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AFK_FILE = path.join(__dirname, '..', 'data', 'afk.json')

let afkData = {}
let antiSpam = {}

function loadAfkData() {
    try {
        if (fs.existsSync(AFK_FILE)) {
            afkData = JSON.parse(fs.readFileSync(AFK_FILE, 'utf8'))
        } else afkData = {}
    } catch (e) {
        console.error('[AFK] Errore caricamento dati:', e)
        afkData = {}
    }
}

function saveAfkData() {
    try {
        fs.writeFileSync(AFK_FILE, JSON.stringify(afkData, null, 2), 'utf8')
    } catch (e) {
        console.error('[AFK] Errore salvataggio dati:', e)
    }
}

loadAfkData()

function formatAFK(ms) {
    const sec = Math.floor(ms / 1000)
    const min = Math.floor(sec / 60)
    const hrs = Math.floor(min / 60)
    return `${hrs}h ${min % 60}m ${sec % 60}s`
}

let handler = m => m

handler.all = async function (m) {

    // 🔥 LETTURA CORRETTA DEI PULSANTI
    const btn = m?.message?.buttonsResponseMessage?.selectedButtonId || null

    if (!m.text && !btn) return
    if (m.fromMe) return
    if (!m.isGroup) return

    const sender = m.sender
    const body = (m.text || "").trim().toLowerCase()

    // 🔹 Se l’utente è AFK e scrive → disattiva AFK
    if (afkData[sender] && !body.startsWith('.afk') && !btn) {
        const { since, reason } = afkData[sender]
        const readable = formatAFK(Date.now() - since)

        delete afkData[sender]
        saveAfkData()

        await this.sendMessage(m.chat, {
            text: `👋 *Bentornato!* Hai disattivato l'AFK.\n⏱️ AFK per *${readable}*\n📝 Motivo: ${reason}`
        }, { quoted: m })

        return
    }

    // 🔹 Comando AFK → scelta gruppo / globale
    if (body.startsWith('.afk')) {
        const reason = m.text.slice(4).trim() || 'Nessun motivo specificato'

        await this.sendMessage(m.chat, {
            text: `💤 *Dove vuoi attivare l'AFK?*\n📝 Motivo: ${reason}`,
            buttons: [
                { buttonId: `.afk_here ${reason}`, buttonText: { displayText: "📍 Solo questo gruppo" }, type: 1 },
                { buttonId: `.afk_all ${reason}`, buttonText: { displayText: "🌐 Tutti i gruppi" }, type: 1 }
            ],
            headerType: 1
        }, { quoted: m })

        return
    }

    // 🔹 AFK solo nel gruppo attuale (FUNZIONANTE)
    if (btn && btn.startsWith('.afk_here')) {
        const reason = btn.replace('.afk_here', '').trim() || 'Nessun motivo specificato'

        afkData[sender] = {
            reason,
            since: Date.now(),
            onlyGroup: m.chat
        }
        saveAfkData()

        await this.sendMessage(m.chat, {
            text: `📍 *AFK attivato SOLO in questo gruppo!*\n📝 Motivo: ${reason}`
        }, { quoted: m })

        return
    }

    // 🔹 AFK globale (FUNZIONANTE)
    if (btn && btn.startsWith('.afk_all')) {
        const reason = btn.replace('.afk_all', '').trim() || 'Nessun motivo specificato'

        afkData[sender] = {
            reason,
            since: Date.now(),
            onlyGroup: null
        }
        saveAfkData()

        await this.sendMessage(m.chat, {
            text: `🌐 *AFK attivato in TUTTI i gruppi!*\n📝 Motivo: ${reason}`
        }, { quoted: m })

        return
    }

    // 🔹 Tag AFK → avviso + anti‑spam
    const mentioned = m.mentionedJid || []
    if (mentioned.length > 0) {
        for (const jid of mentioned) {
            if (!afkData[jid] || jid === sender) continue

            if (afkData[jid].onlyGroup && afkData[jid].onlyGroup !== m.chat) continue

            const now = Date.now()

            if (antiSpam[jid] && now - antiSpam[jid] < 10000) continue
            antiSpam[jid] = now

            const { reason, since } = afkData[jid]
            const readable = formatAFK(now - since)
            const name = await this.getName(jid)

            await this.sendMessage(m.chat, {
                text: `💤 *${name}* è AFK da *${readable}*\n📝 Motivo: ${reason}\n🚫 Anti‑tag attivo (10s)`
            }, { quoted: m })
        }
    }
}

export default handler

