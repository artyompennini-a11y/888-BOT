import { sticker } from '../../lib/sticker.js'
import uploadFile from '../../lib/uploadFile.js'
import uploadImage from '../../lib/uploadImage.js'
import { createCanvas } from '@napi-rs/canvas'

const isUrl = (text) => {
    return text.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif)/gi)
}

const createTextImage = async (text, packname, author) => {
    try {
        const canvas = createCanvas(500, 300)
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 500, 300)

        ctx.fillStyle = '#000000'
        ctx.font = 'bold 40px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const maxWidth = 450
        const lineHeight = 50
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
        let startY = (300 - totalHeight) / 2

        for (let textLine of lines) {
            ctx.fillText(textLine, 250, startY)
            startY += lineHeight
        }

        ctx.font = 'bold 14px Arial'
        ctx.fillStyle = '#666666'
        ctx.textAlign = 'right'
        ctx.fillText(`By: ${author}`, 480, 285)

        return canvas.toBuffer('image/png')
    } catch {
        return null
    }
}

let handler = async (m, { conn, args }) => {
    let stiker = false
    try {
        let q = m.quoted ? m.quoted : m

        if (q.viewOnce || q.msg?.viewOnce || q.ephemeralExpiration || m.viewOnce || m.msg?.viewOnce) {
            return m.reply('🚫 Impossibile fare sticker alle foto a una visualizzazione.')
        }

        let mime = (q.msg || q).mimetype || q.mediaType || ''

        let text =
            q.text ||
            q.body ||
            q.caption ||
            q.conversation ||
            q.msg?.conversation ||
            q.msg?.text ||
            q.msg?.extendedTextMessage?.text ||
            q.extendedTextMessage?.text ||
            ''

        text = typeof text === 'string' ? text.trim() : ''

        const senderName = m.pushName || m.sender.split('@')[0] || 'Utente'
        const packname = senderName
        const author = '888-BOT'

        if (args[0] && global.screenStickerMap && global.screenStickerMap[args[0]]) {
            m.reply('ⓘ Creo sticker...')
            try {
                const img = global.screenStickerMap[args[0]]
                delete global.screenStickerMap[args[0]]
                stiker = await sticker(img, false, packname, author)
            } catch {}
        } else if (/webp|image|video/g.test(mime)) {
            if (/video/g.test(mime) && (q.msg || q).seconds > 9) return

            m.reply('ⓘ Caricamento...')
            let img = await q.download?.()
            if (!img) return

            let out
            try {
                stiker = await sticker(img, false, packname, author)
            } catch {
            } finally {
                if (!stiker) {
                    if (/image|webp/g.test(mime)) out = await uploadImage(img)
                    else if (/video/g.test(mime)) out = await uploadFile(img)
                    if (typeof out !== 'string') out = await uploadImage(img)
                    stiker = await sticker(false, out, packname, author)
                }
            }
        } else if (text && !mime) {
            m.reply('ⓘ Creo sticker da testo...')
            try {
                const textImage = await createTextImage(text, packname, author)
                if (textImage) stiker = await sticker(textImage, false, packname, author)
            } catch {}
        } else if (args[0]) {
            if (isUrl(args[0])) {
                stiker = await sticker(false, args[0], packname, author)
            } else return
        }
    } catch {
        stiker = false
    } finally {
        if (stiker) conn.sendFile(m.chat, stiker, 'sticker.webp', '', m)
    }
}

handler.help = ['stiker', 'stikergif']
handler.tags = ['sticker']
handler.command = /^s(tic?ker)?(gif)?(wm)?$/i

export default handler