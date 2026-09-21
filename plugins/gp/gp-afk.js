// by Elixir, Punisher & 888 Staff

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AFK_FILE = path.join(__dirname, '..', '..', 'data', 'afk.json')

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
        for (const [jid, timestamp] of Object.entries(antiSpam)) {
            if (now - timestamp > 30000) delete antiSpam[jid]
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

handler.all = async function (m) {
    try {
        if (m.fromMe) return
        if (!m.isGroup) return

        const sender = m.sender
        const rawBody =
            (m.text ||
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            "").trim()

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
                ? `🌐 AFK attivato in tutti i gruppi\nMotivo: ${reason}`
                : `📍 AFK attivato solo in questo gruppo\nMotivo: ${reason}`

            await this.sendMessage(m.chat, { text: msg }, { quoted: m })
            return
        }

        if (/^\.afk(\s|$)/i.test(rawBody)) {
            let reason = rawBody.replace(/^\.afk/i, '').trim()
            if (!reason) reason = 'Nessun motivo specificato'

            await this.sendMessage(m.chat, {
                text: `Dove vuoi attivare l'AFK?\nMotivo: ${reason}`,
                buttons: [
                    { buttonId: `.afk_here ${reason}`, buttonText: { displayText: "Solo questo gruppo" }, type: 1 },
                    { buttonId: `.afk_all ${reason}`, buttonText: { displayText: "Tutti i gruppi" }, type: 1 }
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
                text: `Bentornato!\nAFK per ${readable}\nMotivo: ${reason}`
            }, { quoted: m })

            return
        }

        let textMentions = []
        if (rawBody.includes('@')) {
            const regex = /@(\d{5,16})/g
            let match
            while ((match = regex.exec(rawBody)) !== null) {
                textMentions.push(match[1] + '@s.whatsapp.net')
            }
        }

        const mentioned = [
            ...(m.mentionedJid || []),
            ...textMentions
        ]

        if (mentioned.length > 0) {
            const now = Date.now()
            const afkMentioned = []

            for (const jid of mentioned) {
                if (afkData[jid] && jid !== sender) {
                    if (afkData[jid].onlyGroup && afkData[jid].onlyGroup !== m.chat) continue
                    if (antiSpam[jid] && now - antiSpam[jid] < 10000) continue
                    antiSpam[jid] = now
                    afkMentioned.push(jid)
                }
            }

            if (afkMentioned.length > 0) {
                let lines = []
                for (const jid of afkMentioned) {
                    const { since, reason } = afkData[jid]
                    const readable = formatAFK(now - since)
                    const tag = '@' + jid.split('@')[0]
                    lines.push(`• ${tag} AFK da ${readable}\nMotivo: ${reason}`)
                }

                const msg = `AFK attivi (${afkMentioned.length}):\n\n` + lines.join('\n\n')

                await this.sendMessage(m.chat, {
                    text: msg,
                    mentions: afkMentioned
                }, { quoted: m })
            }
        }

    } catch {}
}

export default handler
