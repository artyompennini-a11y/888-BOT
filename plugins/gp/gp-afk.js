// by Elixir, Punisher & 888 Staff

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AFK_FILE = path.join(__dirname, '..', 'data', 'afk.json')

let afkData = {}
let antiSpam = {}
let antiSpamCleanup = null

function loadAfkData() {
    try {
        if (fs.existsSync(AFK_FILE)) {
            afkData = JSON.parse(fs.readFileSync(AFK_FILE, 'utf8'))
        } else afkData = {}
    } catch {
        afkData = {}
    }
}

function saveAfkData() {
    try {
        fs.writeFileSync(AFK_FILE, JSON.stringify(afkData, null, 2), 'utf8')
    } catch {}
}

function startAntiSpamCleanup() {
    if (antiSpamCleanup) clearInterval(antiSpamCleanup)
    antiSpamCleanup = setInterval(() => {
        const now = Date.now()
        for (const [jid, ts] of Object.entries(antiSpam)) {
            if (now - ts > 30000) delete antiSpam[jid]
        }
    }, 300000)
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

handler.all = async function (m, { conn }) {
    try {
        if (m.fromMe) return
        if (!m.isGroup) return

        const sender = m.sender
        const rawBody = (m.text || "").trim()

        const nativeBtn = m?.message?.buttonsResponseMessage?.selectedButtonId || null

        const isBtn = !!nativeBtn
            ? String(nativeBtn).trim().startsWith('.afk')
            : /^\.afk_(here|all)(\s|$)/i.test(rawBody)

        const btnBody = isBtn
            ? (nativeBtn ? String(nativeBtn).trim() : rawBody)
            : ''

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
                ? `🌐 *AFK attivato in TUTTI i gruppi!*\n📝 Motivo: ${reason}\n\n*888 AFK*`
                : `📍 *AFK attivato SOLO in questo gruppo!*\n📝 Motivo: ${reason}\n\n*888 AFK*`

            await this.sendMessage(m.chat, { text: msg }, { quoted: m })
            return
        }

        const isAfkCmd = /^\.afk(\s|$)/i.test(rawBody)
        if (isAfkCmd) {
            let reason = rawBody.replace(/^\.afk/i, '').trim()
            if (!reason) reason = 'Nessun motivo specificato'

            await this.sendMessage(m.chat, {
                text: `💤 *Dove vuoi attivare l'AFK?*\n📝 Motivo: ${reason}\n\n*888 AFK*`,
                buttons: [
                    { buttonId: `.afk_here ${reason}`, buttonText: { displayText: "📍 Solo questo gruppo" }, type: 1 },
                    { buttonId: `.afk_all ${reason}`, buttonText: { displayText: "🌐 Tutti i gruppi" }, type: 1 }
                ],
                headerType: 1
            }, { quoted: m })

            return
        }

        if (afkData[sender] && !rawBody.startsWith('.') && !isBtn) {
            const { since, reason } = afkData[sender]
            const readable = formatAFK(Date.now() - since)

            delete afkData[sender]
            saveAfkData()

            await this.sendMessage(m.chat, {
                text: `👋 *Bentornato!* Hai disattivato l'AFK.\n⏱️ AFK per *${readable}*\n📝 Motivo: ${reason}\n\n*888 AFK*`
            }, { quoted: m })

            return
        }

        const mentioned = m.mentionedJid || []
        if (mentioned.length > 0) {
            let count = 0
            const now = Date.now()

            for (const jid of mentioned) {
                const entry = afkData[jid]
                if (!entry) continue

                const allowed = entry.onlyGroup === null || entry.onlyGroup === m.chat
                if (!allowed) continue

                if (antiSpam[jid] && now - antiSpam[jid] < 10000) continue
                antiSpam[jid] = now

                count++
            }

            if (count > 0) {
                await this.sendMessage(m.chat, {
                    text: `⚠️ *Hai taggato ${count} utenti in AFK*\n\n*888 AFK*`
                }, { quoted: m })
            }
        }

    } catch (error) {
        console.error('[AFK] Errore:', error)
    }
}

export default handler