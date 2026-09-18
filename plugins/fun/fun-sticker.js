import { sticker } from '../../lib/sticker.js'
import uploadFile from '../../lib/uploadFile.js'
import uploadImage from '../../lib/uploadImage.js'
import { createCanvas } from '@napi-rs/canvas'

const isUrl = (text) => {
    return text.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png)/gi)
}

const createTextImage = async (text, packname, author) => {
    try {
        const canvas = createCanvas(500, 300)
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 500, 300)

        ctx.fillStyle = '#000000'
        ctx.font = 'bold 50px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const maxWidth = 450
        const lineHeight = 60
        const lines = []
        let line = ''
        const words = text.split(' ')

        for (let word of words) {
            const testLine = line + (line ? ' ' : '') + word
            const metrics = ctx.measureText(testLine)
            if (metrics.width > maxWidth && line) {
                lines.push(line)
                line = word
            } else {
                line = testLine
            }
        }
        if (line) lines.push(line)

        const totalHeight = lines.length * lineHeight
        let startY = (300 - totalHeight) / 2 + 30

        for (let textLine of lines) {
            ctx.fillText(textLine, 250, startY)
            startY += lineHeight
        }

        ctx.font = 'bold 16px Arial'
        ctx.fillStyle = '#999999'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'bottom'
        ctx.fillText(`By: ${author}`, 480, 295)

        return canvas.toBuffer('image/png')
    } catch (error) {
        console.error('Errore creazione immagine:', error)
        return null
    }
}

let handler = async (m, { conn, args }) => {
    let stiker = false

    try {
        let q = m.quoted ? m.quoted : m

        if (q.viewOnce || q.msg?.viewOnce || q.ephemeralExpiration || m.viewOnce || m.msg?.viewOnce)
            return m.reply('🚫 Impossibile fare sticker alle foto a una visualizzazione.')

        let mime = (q.msg || q).mimetype || q.mediaType || ''

        let quotedText = (
            q.text ||
            q.body ||
            q.caption ||
            q.conversation ||
            q.msg?.conversation ||
            q.msg?.text ||
            q.msg?.extendedTextMessage?.text ||
            q.message?.conversation ||
            q.message?.extendedTextMessage?.text ||
            ''
        ).trim()

        let argsText = args.join(' ').trim()

        const senderName = m.pushName || m.sender.split('@')[0] || 'Utente'
        const packname = `${senderName}`
        const author = `888 bot`

        if (args[0] && global.screenStickerMap && global.screenStickerMap[args[0]]) {
            try {
                const img = global.screenStickerMap[args[0]]
                delete global.screenStickerMap[args[0]]
                stiker = await sticker(img, false, packname, author)
            } catch (error) {
                console.error('Errore scratchpad:', error)
            }
        } else if (/webp|image|video/g.test(mime)) {
            if (/video/g.test(mime) && (q.msg || q).seconds > 9)
                return m.reply('🚫 Il video è troppo lungo (max 9 secondi).')

            let img = await q.download?.()
            if (!img) return m.reply('🚫 Impossibile scaricare il media.')

            try {
                stiker = await sticker(img, false, packname, author)
            } catch (error) {
                let out
                try {
                    if (/image|webp/g.test(mime)) out = await uploadImage(img)
                    else if (/video/g.test(mime)) out = await uploadFile(img)
                    if (typeof out !== 'string') out = await uploadImage(img)
                    stiker = await sticker(false, out, packname, author)
                } catch (uploadError) {
                    console.error('Errore upload:', uploadError)
                }
            }
        } else if (quotedText && quotedText.length > 0) {
            try {
                const textImage = await createTextImage(quotedText, packname, author)
                if (textImage) {
                    stiker = await sticker(textImage, false, packname, author)
                }
            } catch (error) {
                console.error('Errore creazione sticker da testo quotato:', error)
            }
        } else if (argsText && argsText.length > 0 && !isUrl(argsText)) {
            try {
                const textImage = await createTextImage(argsText, packname, author)
                if (textImage) {
                    stiker = await sticker(textImage, false, packname, author)
                }
            } catch (error) {
                console.error('Errore creazione sticker da args:', error)
            }
        } else if (argsText && isUrl(argsText)) {
            try {
                stiker = await sticker(false, argsText, packname, author)
            } catch (error) {
                console.error('Errore sticker da URL:', error)
            }
        } else {
            return m.reply('🚫 Rispondi a un media/testo oppure invia un URL o del testo dopo il comando.')
        }
    } catch (error) {
        console.error('Errore generale:', error)
        stiker = false
    } finally {
        if (stiker) {
            conn.sendFile(m.chat, stiker, 'sticker.webp', '', m)
        } else {
            return m.reply('❌ Non sono riuscito a creare lo sticker.')
        }
    }
}

handler.help = ['s', 'stiker', 'stikergif']
handler.tags = ['sticker']
handler.command = /^(omo|stiker|sticker|stikergif|stickergif)$/i

export default handler