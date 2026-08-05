// Plugin by Elixir, Punisher & 888 staff

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AFK_FILE = path.join(__dirname, '..', 'data', 'afk.json')

let afkData = {}

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

let handler = m => m

handler.all = async function (m) {
    if (!m.text || m.fromMe) return
    if (!m.isGroup) return

    const sender = m.sender
    const body = m.text.trim()

    if (afkData[sender] && body.toLowerCase() !== '.afk') {
        const { since } = afkData[sender]
        const seconds = Math.floor((Date.now() - since) / 1000)
        delete afkData[sender]
        saveAfkData()

        await this.sendMessage(m.chat, {
            text: `👋 Non sei più AFK!\n⏱️ Sei stato/a AFK per *${seconds}s*`
        }, { quoted: m })
        return
    }

    if (body.toLowerCase() === '.afk') {
        if (!afkData[sender]) {
            afkData[sender] = {
                reason: 'Nessun motivo specificato',
                since: Date.now()
            }
            saveAfkData()

            await this.sendMessage(m.chat, {
                text: '💤 *Modalità AFK attivata per questo gruppo!*\n\n_Non verrai menzionato/a nei tag._'
            }, { quoted: m })
        }
        return
    }

    const mentioned = m.mentionedJid || []
    if (mentioned.length > 0) {
        for (const jid of mentioned) {
            if (afkData[jid] && jid !== sender) {
                const { reason, since } = afkData[jid]
                const seconds = Math.floor((Date.now() - since) / 1000)
                const name = this.getName(jid) || jid.split('@')[0]
                await this.sendMessage(m.chat, {
                    text: `💤 *${name}* è AFK da *${seconds}s*\n📝 Motivo: ${reason}`
                }, { quoted: m })
            }
        }
    }
}

export default handler
