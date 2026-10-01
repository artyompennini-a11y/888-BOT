// Plugin by elixir, punisher & 888 staff
import { importCanvas } from '../../lib/canvas-fallback.js'

let unoSession = {}

const coloriHex = {
    'Rosso': '#FF3B30',
    'Blu': '#007AFF',
    'Giallo': '#FFCC00',
    'Verde': '#4CD964',
    'Jolly': '#1C1C1E'
}

const CANVAS_W = 1000
const CANVAS_H = 600

const gameButtons = () => [{
    buttonId: 'pesca', buttonText: { displayText: '📥 𝐏𝐄𝐒𝐂𝐀' }, type: 1
}, {
    buttonId: 'enduno', buttonText: { displayText: '🛑 𝐀𝐁𝐁𝐀𝐍𝐃𝐎𝐍𝐀' }, type: 1
}]


function roundRectPath(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath()
        ctx.roundRect(x, y, w, h, r)
        return
    }
    const rad = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rad, y)
    ctx.lineTo(x + w - rad, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad)
    ctx.lineTo(x + w, y + h - rad)
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
    ctx.lineTo(x + rad, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad)
    ctx.lineTo(x, y + rad)
    ctx.quadraticCurveTo(x, y, x + rad, y)
    ctx.closePath()
}


function centeredStart(n, itemW, gap, total = CANVAS_W) {
    if (n <= 0) return total / 2
    const blockW = itemW + (n - 1) * gap
    return Math.round((total - blockW) / 2)
}

async function generaGrafica(s) {
    const { createCanvas } = await importCanvas()
    if (typeof createCanvas !== 'function') {
                return null
    }

    const canvas = createCanvas(CANVAS_W, CANVAS_H)
    const ctx = canvas.getContext('2d')

    const gradiente = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H)
    gradiente.addColorStop(0, '#1e1e24')
    gradiente.addColorStop(1, '#09090b')

    ctx.fillStyle = gradiente
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'

    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.font = 'bold 120px Arial'
    ctx.fillText('888 BOT', CANVAS_W / 2, 150)

    const drawCard = (x, y, label, color, hidden = false, scale = 1) => {
        const w = 80 * scale
        const h = 120 * scale

        ctx.shadowColor = 'rgba(0,0,0,0.4)'
        ctx.shadowBlur = 10

        ctx.fillStyle = '#fff'
        roundRectPath(ctx, x, y, w, h, 12 * scale)
        ctx.fill()

        ctx.shadowBlur = 0

        if (hidden) {
            ctx.fillStyle = '#1c1c1e'
            roundRectPath(ctx, x + 4, y + 4, w - 8, h - 8, 8 * scale)
            ctx.fill()

            ctx.fillStyle = '#fff'
            ctx.font = `bold ${16 * scale}px Arial`
            ctx.textAlign = 'center'
            ctx.fillText('888', x + (w / 2), y + (h / 2) + 6 * scale)
        } else {
            ctx.fillStyle = color
            roundRectPath(ctx, x + 4, y + 4, w - 8, h - 8, 8 * scale)
            ctx.fill()

                        const parts = String(label || '').split(' ')
            const colore = parts[0] || ''
            const valore = parts.slice(1).join(' ') || ''

            ctx.fillStyle = 'rgba(0,0,0,0.55)'
            ctx.font = `bold ${12 * scale}px Arial`
            ctx.textAlign = 'center'
            ctx.fillText(colore.toUpperCase(), x + (w / 2), y + (22 * scale))

            ctx.fillStyle = '#fff'
            ctx.font = `bold ${valore ? 30 * scale : 16 * scale}px Arial`
            ctx.fillText(valore || 'JOLLY', x + (w / 2), y + (h / 2) + 11 * scale)
        }
    }

        drawCard(50, 250, '', '#3a3a3c', true, 0.9)

        const botVisible = s.botHand.slice(0, 12)
    const botW = 80 * 0.7
    const botGap = 22
    const botStart = centeredStart(botVisible.length, botW, botGap)
    botVisible.forEach((_, i) => {
        drawCard(botStart + (i * botGap), 40, '', '', true, 0.7)
    })

    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`888 BOT (${s.botHand.length})`, CANVAS_W / 2, 145)

        const tColore = coloriHex[s.currentColor] || coloriHex['Jolly']
    ctx.shadowColor = tColore
    ctx.shadowBlur = 25
    drawCard(CANVAS_W / 2 - 48, 250, s.tableCard, tColore, false, 1.2)
    ctx.shadowBlur = 0

    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('CARTA DI TAVOLO', CANVAS_W / 2, 425)

        const pW = 80
    const pGap = 88
    const pStart = centeredStart(s.playerHand.length, pW, pGap)
    s.playerHand.forEach((c, i) => {
        const col = coloriHex[c.split(' ')[0]] || coloriHex['Jolly']
        const x = pStart + (i * pGap)
        drawCard(x, 450, c, col, false, 1)

        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.font = 'bold 15px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`${i + 1}`, x + (pW / 2), 590)
    })

    return canvas.toBuffer('image/jpeg', { quality: 90 })
}

function creaMazzo() {
    let colori = ['Rosso', 'Blu', 'Giallo', 'Verde']
    let mazzo = []

    colori.forEach(c => {
        mazzo.push(`${c} 0`)

        for (let v = 1; v <= 9; v++) {
            mazzo.push(`${c} ${v}`)
            mazzo.push(`${c} ${v}`)
        }

        for (let i = 0; i < 2; i++) {
            mazzo.push(`${c} +2`)
        }
    })

    for (let i = 0; i < 4; i++) {
        mazzo.push('Jolly')
        mazzo.push('Jolly +4')
    }

    return mazzo.sort(() => Math.random() - 0.5)
}


function pesca(s) {
    if (!s.mazzo || s.mazzo.length === 0) s.mazzo = creaMazzo()
    return s.mazzo.shift()
}

function puoGiocare(carta, tavolo, coloreScelto) {
    if (!carta || !tavolo) return false
    if (carta.includes('Jolly')) return true

    let [c_c, v_c] = carta.split(' ')
    let [c_t, v_t] = tavolo.split(' ')

    return c_c === coloreScelto || v_c === v_t
}


function botTurno(s, depth = 0) {
    const MAX_DEPTH = 5
    let mosse = s.botHand.filter(c =>
        puoGiocare(c, s.tableCard, s.currentColor)
    )

    if (mosse.length > 0 && depth < MAX_DEPTH) {
        let scelta = mosse.find(c => !c.includes('Jolly')) || mosse[0]

        s.botHand.splice(s.botHand.indexOf(scelta), 1)

        s.tableCard = scelta

        s.currentColor = scelta.includes('Jolly')
            ? ['Rosso', 'Blu', 'Verde', 'Giallo'][Math.floor(Math.random() * 4)]
            : scelta.split(' ')[0]

        let res = `🤖 888 BOT mette: *${scelta}*`

        if (scelta.includes('+2')) {
            for (let i = 0; i < 2; i++) s.playerHand.push(pesca(s))
            res += `\n⚠️ Prendi +2!`
            res += '\n' + botTurno(s, depth + 1)
        }
        else if (scelta.includes('+4')) {
            for (let i = 0; i < 4; i++) s.playerHand.push(pesca(s))
            res += `\n🔥 Prendi +4!`
            res += '\n' + botTurno(s, depth + 1)
        }

        return res
    }

        const nuova = pesca(s)
    if (!nuova) return `🤖 888 BOT non ha carte.`
    s.botHand.push(nuova)
    return `🤖 888 BOT pesca.`
}

let handler = async (m, { conn }) => {
    let chat = m.chat

    const session = {
        player: m.sender,
        mazzo: creaMazzo(),
        playerHand: [],
        botHand: [],
        tableCard: null,
        currentColor: ''
    }

        session.playerHand = session.mazzo.splice(0, 7)
    session.botHand = session.mazzo.splice(0, 7)

                const idxTavolo = session.mazzo.findIndex(c =>
        !c.includes('Jolly') && !c.includes('+')
    )
    session.tableCard = idxTavolo >= 0
        ? session.mazzo.splice(idxTavolo, 1)[0]
        : (session.mazzo.shift() || 'Rosso 0')

    session.currentColor = session.tableCard.split(' ')[0]

    unoSession[chat] = session

    const caption = `🃏 *UNO MATCH - 888 BOT*
🎨 Colore attuale: *${session.currentColor}*
━━━━━━━━━━━━━━━━━━━━━━━━━
🖐️ Le tue carte: ${session.playerHand.length}
🤖 888 BOT: ${session.botHand.length}
📦 Mazzo: ${session.mazzo.length}

📥 *pesca* per prendere una carta
🎴 scrivi il *numero* della carta da giocare
🛑 *enduno* per uscire`

    const img = await generaGrafica(session)

    if (img) {
        await conn.sendMessage(chat, {
            image: img,
            mimetype: 'image/jpeg',
            fileName: 'uno.jpg',
            caption
        }, { quoted: m })
    } else {
                await conn.sendMessage(chat, { text: caption }, { quoted: m })
    }

    await conn.sendMessage(chat, {
        text: `🎮 *Azioni disponibili*
━━━━━━━━━━━━━━━━━━━━━━━━━
📥 Premi il bottone per pescare
🛑 Premi il bottone per uscire
🎴 Oppure scrivi il numero della carta`,
        buttons: gameButtons(),
        headerType: 1
    }, { quoted: m })
}

handler.before = async (m, { conn }) => {
    let chat = m.chat
    let s = unoSession[chat]

    if (!s || s.player !== m.sender) return

        let msgText = (m.text || m.body || '').trim().toLowerCase()

    if (m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
        try {
            const params = JSON.parse(
                m.message.interactiveResponseMessage
                .nativeFlowResponseMessage.paramsJson
            )

            msgText = params.id.toLowerCase()
        } catch {}
    }

    if (m.message?.buttonsResponseMessage?.selectedButtonId) {
        msgText = m.message.buttonsResponseMessage.selectedButtonId.toLowerCase()
    }

    if (msgText === '.uno' || msgText === 'uno') return

    if (msgText === 'enduno') {
        delete unoSession[chat]
        return m.reply(
`🛑 *Partita terminata*
Hai abbandonato la partita.`
        )
    }

    let report = ''

    if (msgText === 'pesca') {
        if (s.mazzo.length === 0) {
            s.mazzo = creaMazzo()
        }

        let p = pesca(s)

        if (!p) return m.reply('❌ Il mazzo è vuoto, rimescola in corso...')
        s.playerHand.push(p)

        report = `📥 Hai pescato: *${p}*`

        if (!puoGiocare(p, s.tableCard, s.currentColor)) {
            report += `\n❌ Non giocabile.`
            report += `\n${botTurno(s)}`
        }
    }

    else {
        let idx = parseInt(msgText, 10) - 1

        if (isNaN(idx) || idx < 0 || idx >= s.playerHand.length) {
            return m.reply(`🎳 *Carta non valida*🎳🎳🎳🎳🎳🎳🎳🎳🎳🎳🎳🎳🎳🎳🎳
Inserisci un numero da 1 a ${s.playerHand.length}.`)
        }

        let carta = s.playerHand[idx]

        if (!puoGiocare(carta, s.tableCard, s.currentColor)) {
            return m.reply(
`❌ *Carta non valida*
Non puoi giocare questa carta.`
            )
        }

        s.playerHand.splice(idx, 1)

        s.tableCard = carta

        s.currentColor = carta.includes('Jolly')
            ? s.currentColor
            : carta.split(' ')[0]

        report = `✅ Hai giocato: *${carta}*`

        if (carta.includes('+2')) {
            for (let i = 0; i < 2; i++) {
                const c = pesca(s)
                if (c) s.botHand.push(c)
            }

            report += `\n⚠️ Il bot prende +2`
        }

        else if (carta.includes('+4')) {
            for (let i = 0; i < 4; i++) {
                const c = pesca(s)
                if (c) s.botHand.push(c)
            }

            report += `\n🔥 Il bot prende +4`
        }

        else {
            report += `\n${botTurno(s)}`
        }
    }

    if (s.playerHand.length === 0) {
        delete unoSession[chat]
        return m.reply(
`🏆 *Vittoria!*
Hai finito le carte, complimenti!`
        )
    }

    if (s.botHand.length === 0) {
        delete unoSession[chat]
        return m.reply(
`💀 *Sconfitta*
888 BOT ha finito le carte.`
        )
    }

    let img = await generaGrafica(s)

    await conn.sendMessage(chat, {
        image: img,
        mimetype: 'image/jpeg',
        fileName: 'uno_update.jpg',
        caption:
`🃏 *UNO MATCH*
${report}

🎨 Colore attuale: *${s.currentColor}*`
    }, { quoted: m })

    await conn.sendMessage(chat, {
        text:
`🎮 *Tocca a te*
━━━━━━━━━━━━━━━━━━━━━━
Premi un bottone oppure
scrivi il numero della carta.`,
        buttons: gameButtons(),
        headerType: 1
    }, { quoted: m })
}

handler.command = /^(uno)$/i

export default handler