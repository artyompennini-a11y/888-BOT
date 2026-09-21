// by Elixir, Punisher & 888 Staff

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AFK_FILE = path.join(__dirname, '..', '..', 'data', 'afk.json')

let afkData = {}
let antiSpam = {}   // Anti-tag cache
let antiSpamCleanup = null // Cleanup interval reference

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

// Cleanup anti-spam cache ogni 5 minuti
function startAntiSpamCleanup() {
    if (antiSpamCleanup) clearInterval(antiSpamCleanup)
    antiSpamCleanup = setInterval(() => {
        const now = Date.now()
        const expireTime = 30000 // 30 secondi
        for (const [jid, timestamp] of Object.entries(antiSpam)) {
            if (now - timestamp > expireTime) {
                delete antiSpam[jid]
            }
        }
    }, 300000) // ogni 5 minuti
}

loadAfkData()
startAntiSpamCleanup()

function formatAFK(ms) {
    const sec = Math.floor(ms / 1000)
    const min = Math.floor(sec / 60)
    const hrs = Math.floor(min / 60)
    return `${hrs}h ${min % 60}m ${sec % 60}s`
}

let handler = m => m

handler.all = async function (m) {
    try {
        // Ignora messaggi del bot e fuori dai gruppi
        if (m.fromMe) return
        if (!m.isGroup) return

        const sender = m.sender

        // In molti setup Baileys, il testo può stare in posti diversi
        const rawBody = (m.text || m.message?.conversation || m.message?.extendedTextMessage?.text || "").trim()

        // Pulsante nativo
        const nativeBtn = m?.message?.buttonsResponseMessage?.selectedButtonId || null

        // Riconoscimento se è un pulsante AFK
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

        // 4️⃣ Tag AFK → notifica + anti-spam + conteggio utenti AFK
        const mentioned = m.mentionedJid || []
        if (mentioned.length > 0) {
            const now = Date.now()
            const afkMentioned = []

            for (const jid of mentioned) {
                if (afkData[jid] && jid !== sender) {
                    // Se AFK solo in un gruppo diverso → salta
                    if (afkData[jid].onlyGroup && afkData[jid].onlyGroup !== m.chat) continue

                    // Anti-spam: cooldown 10 secondi per singolo utente
                    if (antiSpam[jid] && now - antiSpam[jid] < 10000) continue

                    antiSpam[jid] = now
                    afkMentioned.push(jid)
                }
            }

            // Se ci sono utenti AFK taggati → manda messaggio
            if (afkMentioned.length > 0) {
                let lines = []
                for (const jid of afkMentioned) {
                    const { since, reason } = afkData[jid]
                    const readable = formatAFK(now - since)
                    const tag = '@' + jid.split('@')[0]
                    lines.push(`• ${tag} è AFK da *${readable}*\n  📝 Motivo: ${reason}`)
                }

                const msg = `⚠️ *AFK attivi tra gli utenti taggati (${afkMentioned.length})*\n\n` + lines.join('\n\n')

                await this.sendMessage(m.chat, {
                    text: msg,
                    mentions: afkMentioned
                }, { quoted: m })
            }
        }
    } catch (error) {
        console.error('[AFK] Errore:', error)
    }
}

export default handler
