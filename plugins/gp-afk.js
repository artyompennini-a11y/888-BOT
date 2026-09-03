// by Elixir, Punisher & 888 Staff

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
        } else {
            afkData = {}
        }
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

    const s = sec % 60
    const m = min % 60
    const h = hrs

    return `${h}h ${m}m ${s}s`
}

let handler = m => m

handler.all = async function (m) {
    if (!m.text || m.fromMe) return
    if (!m.isGroup) return

    const sender = m.sender
    const body = m.text.trim().toLowerCase()

    
    if (afkData[sender] && !body.startsWith('.afk')) {
        const { since, reason } = afkData[sender]
        const ms = Date.now() - since
        const readable = formatAFK(ms)

        delete afkData[sender]
        saveAfkData()

        await this.sendMessage(m.chat, {
            text: `👋 *Bentornato!* Hai disattivato l'AFK.\n⏱️ AFK per *${readable}*\n📝 Motivo: ${reason}`
        }, { quoted: m })

        return
    }

    
    if (body.startsWith('.afk')) {
        let reason = m.text.slice(4).trim()
        if (!reason) reason = 'Nessun motivo specificato'

        await this.sendMessage(m.chat, {
            text: `💤 *Dove vuoi attivare l'AFK?*\n📝 Motivo: ${reason}`,
            buttons: [
                { buttonId: `.afk_here ${reason}`, buttonText: { displayText: "📍 Su questo gruppo" }, type: 1 },
                { buttonId: `.afk_all ${reason}`, buttonText: { displayText: "🌐 In tutti i gruppi" }, type: 1 }
            ],
            headerType: 1
        }, { quoted: m })

        return
    }

    
    if (m.text.startsWith('.afk_here')) {
        const reason = m.text.replace('.afk_here', '').trim() || 'Nessun motivo specificato'

        afkData[sender] = {
            reason,
            since: Date.now(),
            onlyGroup: m.chat
        }
        saveAfkData()

        await this.sendMessage(m.chat, {
            text: `📍 *AFK attivato solo in questo gruppo!*\n📝 Motivo: ${reason}`
        }, { quoted: m })

        return
    }

    
    if (m.text.startsWith('.afk_all')) {
        const reason = m.text.replace('.afk_all', '').trim() || 'Nessun motivo specificato'

        afkData[sender] = {
            reason,
            since: Date.now(),
            onlyGroup: null
        }
        saveAfkData()

        await this.sendMessage(m.chat, {
            text: `🌐 *AFK attivato in tutti i gruppi!*\n📝 Motivo: ${reason}`
        }, { quoted: m })

        return
    }

    
    const mentioned = m.mentionedJid || []
    if (mentioned.length > 0) {
        for (const jid of mentioned) {
            if (afkData[jid] && jid !== sender) {

                
                if (afkData[jid].onlyGroup && afkData[jid].onlyGroup !== m.chat) {
                    continue
                }

                const now = Date.now()

                
                if (antiSpam[jid] && now - antiSpam[jid] < 10000) {
                    return
                }

                antiSpam[jid] = now

                const { reason, since } = afkData[jid]
                const ms = now - since
                const readable = formatAFK(ms)
                const name = await this.getName(jid)

                await this.sendMessage(m.chat, {
                    text: `💤 *${name}* è AFK da *${readable}*\n📝 Motivo: ${reason}\n🚫 Anti-tag attivo (evita spam)`
                }, { quoted: m })
            }
        }
    }
}

export default handler
