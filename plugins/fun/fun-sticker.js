import { sticker } from '../../lib/sticker.js'
import uploadFile from '../../lib/uploadFile.js'
import uploadImage from '../../lib/uploadImage.js'
import { createCanvas } from '@napi-rs/canvas'

const isUrl = (text) => {
    if (!text || typeof text !== 'string') return false
    try {
        new URL(text)
        return true
    } catch {
        return false
    }
}

const createTextImage = async (text, packname, author) => {
    try {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return null
        }

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
        const words = text.trim().split(' ')

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
        let startY = Math.max(30, (300 - totalHeight) / 2)

        for (let textLine of lines) {
            ctx.fillText(textLine, 250, startY)
            startY += lineHeight
        }

        ctx.font = 'bold 14px Arial'
        ctx.fillStyle = '#666666'
        ctx.textAlign = 'right'
        ctx.fillText(`By: ${author}`, 480, 285)

        return canvas.toBuffer('image/png')
    } catch (e) {
        console.error('Errore createTextImage:', e)
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

        let text = ''
        
        if (q.text) text = q.text
        else if (q.body) text = q.body
        else if (q.caption) text = q.caption
        else if (q.conversation) text = q.conversation
        else if (q.msg?.conversation) text = q.msg.conversation
        else if (q.msg?.text) text = q.msg.text
        else if (q.msg?.extendedTextMessage?.text) text = q.msg.extendedTextMessage.text
        else if (q.message?.conversation) text = q.message.conversation
        else if (q.message?.extendedTextMessage?.text) text = q.message.extendedTextMessage.text
        else if (q.quoted?.text) text = q.quoted.text
        else if (q.quoted?.body) text = q.quoted.body
        else if (q.quoted?.caption) text = q.quoted.caption
        else if (q.quoted?.conversation) text = q.quoted.conversation
        else if (q.quoted?.message?.extendedTextMessage?.text) text = q.quoted.message.extendedTextMessage.text
        else if (q.quoted?.msg?.text) text = q.quoted.msg.text
        else if (q.quoted?.msg?.extendedTextMessage?.text) text = q.quoted.msg.extendedTextMessage.text

        text = typeof text === 'string' ? text.trim() : ''

        const senderName = m.pushName || m.sender.split('@')[0] || 'Utente'
        const packname = `${senderName}`
        const author = `888 bot`

        if (args[0] && global.screenStickerMap && global.screenStickerMap[args[0]]) {
            try {
                const img = global.screenStickerMap[args[0]]
                delete global.screenStickerMap[args[0]]
                stiker = await sticker(img, false, packname, author)
            } catch {}
        } else if (/webp|image|video/g.test(mime)) {
            if (/video/g.test(mime) && (q.msg || q).seconds > 9)
                return m.reply('🚫 Il video è troppo lungo (max 9 secondi).')

            let img = await q.download?.()
            if (!img) return m.reply('🚫 Impossibile scaricare il media.')

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
        } else if (text && text.length > 0) {
            try {
                const textImage = await createTextImage(text, packname, author)
                if (textImage) {
                    stiker = await sticker(textImage, false, packname, author)
                }
            } catch (e) {
                console.error('Errore sticker da testo quotato:', e)
            }
        } else if (args[0]) {
            if (isUrl(args[0])) {
                stiker = await sticker(false, args[0], packname, author)
            } else {
                try {
                    const textImage = await createTextImage(args[0], packname, author)
                    if (textImage) {
                        stiker = await sticker(textImage, false, packname, author)
                    }
                } catch (e) {
                    console.error('Errore sticker da args:', e)
                }
            }
        } else {
            return m.reply('🚫 Rispondi a un media/testo oppure invia un URL o del testo dopo il comando.')
        }
    } catch (e) {
        console.error('Errore generale:', e)
        stiker = false
    } finally {
        if (stiker) conn.sendFile(m.chat, stiker, 'sticker.webp', '', m)
        else return m.reply('❌ Non sono riuscito a creare lo sticker.')
    }
}

handler.help = ['stiker', 'stikergif']
handler.tags = ['sticker']
handler.command = /^(s|stiker|sticker|stikergif|stickergif)$/i

export default handler