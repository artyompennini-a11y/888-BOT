// Plugin by Elixir, Punisher & 888 staff

const parseTime = (input) => {
    if (!input) return null
    const match = input.trim().toLowerCase().match(/^(\d+)([mhd])$/)
    if (!match) return null
    const amount = parseInt(match[1])
    const unit = match[2]
    if (amount <= 0) return null
    const multipliers = { m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }
    return amount * multipliers[unit]
}

let handler = async (m, { conn, args }) => {
    if (!global.db.data.capsule) global.db.data.capsule = []

    const input = args.join(' ').trim()
    if (!input) {
        return conn.sendMessage(m.chat, {
            text: `⏳ *CAPSULA DEL TEMPO*
Uso: .capsula <testo> <tempo>
Tempo: *m* minuti, *h* ore, *d* giorni
Esempio: .capsula il bot sara il numero 1 5m`
        }, { quoted: m })
    }

    const timeMatch = input.match(/(\d+[mhd])\s*$/i)
    if (!timeMatch) {
        return conn.sendMessage(m.chat, {
            text: '❌ Tempo non valido. Usa *m* (minuti), *h* (ore) o *d* (giorni).\nEsempio: .capsula messaggio segreto 5m'
        }, { quoted: m })
    }

    const duration = parseTime(timeMatch[1])
    if (!duration) {
        return conn.sendMessage(m.chat, {
            text: '❌ Tempo non valido. Usa *m* (minuti), *h* (ore) o *d* (giorni).'
        }, { quoted: m })
    }

    const text = input.replace(/\d+[mhd]\s*$/i, '').trim()
    if (!text) {
        return conn.sendMessage(m.chat, {
            text: '❌ Scrivi un messaggio da sigillare nella capsula.'
        }, { quoted: m })
    }

    const capsule = {
        id: Date.now(),
        chat: m.chat,
        sender: m.sender,
        text: text,
        sblocco: Date.now() + duration
    }

    global.db.data.capsule.push(capsule)
    if (typeof global.markDbDirty === 'function') global.markDbDirty()

    await conn.sendMessage(m.chat, {
        text: `⏳ *Capsula del tempo sigillata!*
        📝 Contenuto: ${text}
        ⏰ Si sblocchera tra *${timeMatch[1]}*`
    }, { quoted: m })
}

handler.before = async (m, { conn }) => {
    if (!m.isGroup) return false
    if (!global.db || !global.db.data) return false
    if (!global.db.data.capsule || global.db.data.capsule.length === 0) return false

    const now = Date.now()
    const expired = global.db.data.capsule.filter(c => c.chat === m.chat && now >= c.sblocco)
    if (expired.length === 0) return false

    for (const cap of expired) {
        const authorJid = conn.decodeJid(cap.sender)
        await conn.sendMessage(m.chat, {
            text: `⏳ *CAPSULA DEL TEMPO SCADUTA*
        ━━━━━━━━━━━━━━━━━━
        👤 *Autore:* @${authorJid.split('@')[0]}
        📝 *Messaggio:* ${cap.text}
        ━━━━━━━━━━━━━━━━━━
        ⏰ La capsula si e aperta!`,
            mentions: [authorJid]
        })
        global.db.data.capsule = global.db.data.capsule.filter(c => c.id !== cap.id)
    }

    if (typeof global.markDbDirty === 'function') global.markDbDirty()
    return false
}

handler.help = ['capsula <testo> <tempo>']
handler.tags = ['fun']
handler.command = /^capsula$/i
handler.group = true

export default handler
