// by Elixir, Punisher & 888 Staff

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AFK_FILE = path.join(__dirname, '..', 'data', 'afk.json')

let afkData = {}
let antiSpam = {}   // Anti-tag cache

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
// Consenti l'uso anche quando 'modoadmin' (Solo admin) è attivo nel gruppo
handler.modoadminBypass = true

handler.all = async function (m) {

    if (m.fromMe) return
    if (!m.isGroup) return

    const sender = m.sender
    const rawBody = (m.text || "").trim()

    // 🔥 Il pulsante può arrivare come buttonsResponseMessage NATIVO...
    const nativeBtn = m?.message?.buttonsResponseMessage?.selectedButtonId || null

    // ...oppure, in questo framework, viene rinviato come messaggio di testo
    // sintetico in cui m.text = ID del pulsante (es. ".afk_all motivo").
    const isBtn = !!nativeBtn
        ? String(nativeBtn).trim().startsWith('.afk')
        : /^\.afk_(here|all)(\s|$)/i.test(rawBody)

    const btnBody = isBtn
        ? (nativeBtn ? String(nativeBtn).trim() : rawBody)
        : ''

    // 1️⃣ Pulsante: AFK solo in questo gruppo / in TUTTI i gruppi
    if (isBtn && btnBody) {
        const isGlobal = /^\.afk_all/i.test(btnBody)
        const reason = btnBody.replace(/^\.afk_(here|all)/i, '').trim() || 'Nessun motivo specificato'

        afkData[sender] = {
            reason,
            since: Date.now(),
            onlyGroup: isGlobal ? null : m.chat
        }
        saveAfkData()

        const msg = isGlobal
            ? `🌐 *AFK attivato in TUTTI i gruppi!*\n📝 Motivo: ${reason}`
            : `📍 *AFK attivato SOLO in questo gruppo!*\n📝 Motivo: ${reason}`

        await this.sendMessage(m.chat, { text: msg }, { quoted: m })
        return
    }

    // 2️⃣ Comando .afk → mostra i pulsanti di scelta
    const isAfkCmd = /^\.afk(\s|$)/i.test(rawBody)
    if (isAfkCmd) {
        let reason = rawBody.replace(/^\.afk/i, '').trim()
        if (!reason) reason = 'Nessun motivo specificato'

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

    // 3️⃣ Se l'utente è AFK e scrive un messaggio normale → disattiva AFK
    if (afkData[sender] && !rawBody.startsWith('.') && !isBtn) {
        const { since, reason } = afkData[sender]
        const readable = formatAFK(Date.now() - since)

        delete afkData[sender]
        saveAfkData()

        await this.sendMessage(m.chat, {
            text: `👋 *Bentornato!* Hai disattivato l'AFK.\n⏱️ AFK per *${readable}*\n📝 Motivo: ${reason}`
        }, { quoted: m })

        return
    }

    // 4️⃣ Tag AFK → Timer + Anti-tag (NO FOTO)
    const mentioned = m.mentionedJid || []
    if (mentioned.length > 0) {
        for (const jid of mentioned) {
            if (afkData[jid] && jid !== sender) {

                if (afkData[jid].onlyGroup && afkData[jid].onlyGroup !== m.chat) continue

                const now = Date.now()

                if (antiSpam[jid] && now - antiSpam[jid] < 10000) return
                antiSpam[jid] = now

                const { reason, since } = afkData[jid]
                const readable = formatAFK(now - since)
                const name = await this.getName(jid)

                await this.sendMessage(m.chat, {
                    text: `💤 *${name}* è AFK da *${readable}*\n📝 Motivo: ${reason}\n🚫 Anti-tag attivo (evita spam)`
                }, { quoted: m })
            }
        }
    }
}

export default handler