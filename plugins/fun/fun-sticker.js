// Plugin by Elixir, Punisher & 888 staff
import { sticker } from '../../lib/sticker.js'
import uploadFile from '../../lib/uploadFile.js'
import uploadImage from '../../lib/uploadImage.js'
import { createCanvas } from '@napi-rs/canvas'

const isUrl = (text) => {
    return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png)/, 'gi'))
}

const createTextImage = async (text, packname, author) => {
    try {
        const canvas = createCanvas(500, 300)
        const ctx = canvas.getContext('2d')

        // Sfondo bianco
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 500, 300)

        // Testo principale - grande e centrato
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 40px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Word wrap con margini
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

        // Disegna righe centrate
        const totalHeight = lines.length * lineHeight
        let startY = (300 - totalHeight) / 2

        for (let textLine of lines) {
            ctx.fillText(textLine, 250, startY)
            startY += lineHeight
        }

        // Autore in basso a destra
        ctx.font = 'bold 14px Arial'
        ctx.fillStyle = '#666666'
        ctx.textAlign = 'right'
        ctx.fillText(`By: ${author}`, 480, 285)

        return canvas.toBuffer('image/png')
    } catch (e) {
        console.error('Errore canvas:', e)
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

        // Estrazione testo più robusta: copre più formati di messaggio citato
        let text = q.text
            || q.body
            || q.caption
            || q.conversation
            || q.msg?.conversation
            || q.msg?.text
            || q.msg?.extendedTextMessage?.text
            || q.extendedTextMessage?.text
            || ''

        text = typeof text === 'string' ? text.trim() : ''

        const senderName = m.pushName || m.sender.split('@')[0] || 'Utente'
        const packname = `${senderName}`
        const author = `888 bot`

        if (args[0] && global.screenStickerMap && global.screenStickerMap[args[0]]) {
            m.reply('ⓘ 𝐂𝐫𝐞𝐨 𝐬𝐭𝐢𝐜𝐤𝐞𝐫...')
            try {
                const img = global.screenStickerMap[args[0]]
                delete global.screenStickerMap[args[0]]
                stiker = await sticker(img, false, packname, author)
            } catch (e) {
                console.error(e)
            }
        } else if (/webp|image|video/g.test(mime)) {
            if (/video/g.test(mime) && (q.msg || q).seconds > 9) {
                return m.reply('🚫 Il video è troppo lungo (max 9 secondi).')
            }

            m.reply('ⓘ 𝐂𝐚𝐫𝐢𝐜𝐚𝐦𝐞𝐧𝐭𝐨 ...')
            let img = await q.download?.()
            if (!img) return m.reply('🚫 Impossibile scaricare il media.')

            let out
            try {
                stiker = await sticker(img, false, packname, author)
            } catch (e) {
                console.error(e)
            } finally {
                if (!stiker) {
                    if (/image|webp/g.test(mime)) out = await uploadImage(img)
                    else if (/video/g.test(mime)) out = await uploadFile(img)
                    if (typeof out !== 'string') out = await uploadImage(img)
                    stiker = await sticker(false, out, packname, author)
                }
            }
        } else if (text) {
            // Testo (proprio o citato) - crea immagine da testo
            m.reply('ⓘ 𝐂𝐫𝐞𝐨 𝐬𝐭𝐢𝐜𝐤𝐞𝐫 𝐝𝐚 𝐭𝐞𝐬𝐭𝐨...')
            try {
                const textImage = await createTextImage(text, packname, author)
                if (textImage) {
                    stiker = await sticker(textImage, false, packname, author)
                }
            } catch (e) {
                console.error(e)
            }
        } else if (args[0]) {
            if (isUrl(args[0])) {
                stiker = await sticker(false, args[0], packname, author)
            } else return m.reply('🚫 Formato non valido. Invia un\'immagine, un video breve, un testo o un URL di un\'immagine.')
        } else {
            return m.reply('🚫 Rispondi a un media/testo oppure invia un URL o del testo dopo il comando.')
        }
    } catch (e) {
        console.error(e)
        stiker = false
    } finally {
        if (stiker) conn.sendFile(m.chat, stiker, 'sticker.webp', '', m)
        else return m.reply('❌ Non sono riuscito a creare lo sticker.')
    }
}

handler.help = ['stiker (caption|reply media)', 'stiker <url>', 'stikergif (caption|reply media)', 'stikergif <url>']
handler.tags = ['sticker']
handler.command = /^s(tic?ker)?(gif)?(wm)?$/i

export default handler