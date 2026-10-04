// Plugin by elixir & Axtral_WiZaRd
import fs from 'fs'
import path from 'path'

const handler = async (m, { conn, usedPrefix }) => {
    const sessionDir = './' + (global.authFile || 'sessioni')

    const invia = async (testo) => {
        await conn.sendMessage(m.chat, { text: testo }, { quoted: m })
    }

    if (!fs.existsSync(sessionDir)) {
        return invia("❌ 𝐋𝐚 𝐜𝐚𝐫𝐭𝐞𝐥𝐥𝐚 𝐬𝐞𝐬𝐬𝐢𝐨𝐧𝐢 𝐧𝐨𝐧 𝐞𝐬𝐢𝐬𝐭𝐞.")
    }

    const files = fs.readdirSync(sessionDir)

    const eliminabili = ['pre-key', 'sender-key', 'session']
    const daTenere = ['lid-mapping', 'identity-key', 'device-list', 'app-state-sync-key', 'app-state-sync-version', 'creds', 'tctoken']

    const conteggio = {}
    let totale = 0
    let totalSize = 0

    for (const file of files) {
        totale++
        let tipo

        if (file === 'creds.json') {
            tipo = 'creds'
        } else if (file.startsWith('app-state-sync-key-')) {
            tipo = 'app-state-sync-key'
        } else if (file.startsWith('app-state-sync-version-')) {
            tipo = 'app-state-sync-version'
        } else if (file.startsWith('lid-mapping-')) {
            tipo = 'lid-mapping'
        } else if (file.startsWith('identity-key-')) {
            tipo = 'identity-key'
        } else if (file.startsWith('device-list-')) {
            tipo = 'device-list'
        } else if (file.startsWith('pre-key-')) {
            tipo = 'pre-key'
        } else if (file.startsWith('sender-key-')) {
            tipo = 'sender-key'
        } else if (file.startsWith('session-')) {
            tipo = 'session'
        } else if (file.startsWith('tctoken-')) {
            tipo = 'tctoken'
        } else if (file.startsWith('app-state-sync-')) {
            tipo = 'app-state-sync'
        } else {
            const match = file.match(/^([a-zA-Z0-9_-]+?)(?:-\d|\.json)/)
            tipo = match ? match[1] : file
        }

        conteggio[tipo] = (conteggio[tipo] || 0) + 1

        try { totalSize += fs.statSync(path.join(sessionDir, file)).size } catch {}
    }

    const ordinati = Object.entries(conteggio).sort((a, b) => {
        const aP = eliminabili.includes(a[0]) ? 0 : 1
        const bP = eliminabili.includes(b[0]) ? 0 : 1
        if (aP !== bP) return aP - bP
        return b[1] - a[1]
    })

    let testo = `📊 𝐒𝐓𝐀𝐓𝐈𝐒𝐓𝐈𝐂𝐇𝐄 𝐒𝐄𝐒𝐒𝐈𝐎𝐍𝐈\n`
    testo += `━━━━━━━━━━━━━━━━━━━━\n`
    testo += `📁 𝐓𝐨𝐭𝐚𝐥𝐞 𝐟𝐢𝐥𝐞: ${totale}\n`
    testo += `💾 𝐃𝐢𝐦𝐞𝐧𝐬𝐢𝐨𝐧𝐞: ${(totalSize / 1024 / 1024).toFixed(2)} 𝐌𝐁\n\n`

    testo += `📊 𝐃𝐄𝐓𝐓𝐀𝐆𝐋𝐈𝐎 𝐏𝐄𝐑 𝐓𝐈𝐏𝐎\n`
    testo += `━━━━━━━━━━━━━━━━━━━━\n\n`

    for (const [tipo, num] of ordinati) {
        let stato
        if (eliminabili.includes(tipo)) stato = '🗑️'
        else if (daTenere.includes(tipo)) stato = '🔒'
        else stato = '❓'

        testo += `${stato} *${tipo}*: ${num}\n`
    }

    testo += `\n━━━━━━━━━━━━━━━━━━━━\n`
    testo += `🗑️ = 𝐄𝐥𝐢𝐦𝐢𝐧𝐚𝐛𝐢𝐥𝐢 (purgeSession)\n`
    testo += `🔒 = 𝐃𝐚 𝐭𝐞𝐧𝐞𝐫𝐞 (𝐦𝐚𝐢 𝐭𝐨𝐜𝐜𝐚𝐫𝐞)\n`
    testo += `❓ = 𝐀𝐥𝐭𝐫𝐨 (𝐜𝐨𝐧𝐭𝐫𝐨𝐥𝐥𝐚𝐫𝐞)\n\n`

    let prunableTot = 0
    for (const tipo of eliminabili) {
        prunableTot += conteggio[tipo] || 0
    }

    testo += `📌 𝐅𝐢𝐥𝐞 𝐞𝐥𝐢𝐦𝐢𝐧𝐚𝐛𝐢𝐥𝐢: ${prunableTot}\n`
    testo += prunableTot > 50
        ? `⚠️ 𝐒𝐨𝐩𝐫𝐚 𝐥𝐚 𝐬𝐨𝐠𝐥𝐢𝐚 (500) — 𝐩𝐮𝐥𝐢𝐳𝐢𝐚 𝐚𝐭𝐭𝐢𝐯𝐚`
        : `✅ 𝐒𝐨𝐭𝐭𝐨 𝐥𝐚 𝐬𝐨𝐠𝐥𝐢𝐚 (500) — 𝐧𝐞𝐬𝐬𝐮𝐧𝐚 𝐩𝐮𝐥𝐢𝐳𝐢𝐚`

    testo += `\n\n> ⓘ 𝐀𝐩𝐩𝐞𝐧𝐚 𝐢 𝐟𝐢𝐥𝐞 𝐞𝐥𝐢𝐦𝐢𝐧𝐚𝐛𝐢𝐥𝐢 𝐫𝐚𝐠𝐠𝐢𝐮𝐧𝐠𝐨𝐧𝐨 𝟓𝟎𝟎, 𝐯𝐞𝐧𝐠𝐨𝐧𝐨 𝐞𝐥𝐢𝐦𝐢𝐧𝐚𝐭𝐢 𝐚𝐮𝐭𝐨𝐦𝐚𝐭𝐢𝐜𝐚𝐦𝐞𝐧𝐭𝐞 𝐝𝐚𝐥 𝐬𝐢𝐬𝐭𝐞𝐦𝐚.`

    await invia(testo)
}

handler.command = /^(sessionstats|statsess|ss)$/i
handler.owner = true

export default handler
