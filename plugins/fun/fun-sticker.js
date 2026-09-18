import { sticker } from '../../lib/sticker.js'
import uploadFile from '../../lib/uploadFile.js'
import uploadImage from '../../lib/uploadImage.js'
import { createCanvas } from '@napi-rs/canvas'

const isUrl = (t) => t.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif)/i)

const createTextImage = async (text, packname, author) => {
    try {
        const canvas = createCanvas(500, 300)
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, 500, 300)

        ctx.fillStyle = '#000'
        ctx.font = 'bold 40px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const maxWidth = 450
        const lineHeight = 50
        const words = text.split(' ')
        const lines = []
        let line = ''

        for (let w of words) {
            const test = line ? line + ' ' + w : w
            if (ctx.measureText(test).width > maxWidth) {
                lines.push(line)
                line = w
            } else line = test
        }
        if (line) lines.push(line)

        const totalHeight = lines.length * lineHeight
        let y = (300 - totalHeight) / 2

        for (let l of lines) {
            ctx.fillText(l, 250, y)
            y += lineHeight
        }

        ctx.font = 'bold 14px Arial'
        ctx.fillStyle = '#666'
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

        if (q.viewOnce || q.msg?.viewOnce) return m.reply('🚫 Foto a visualizzazione singola non supportata.')

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

        const senderName = m.pushName || m.sender.split('@')[0]
        const packname = senderName
        const author = '888 bot'

        if (args[0] && global.screenStickerMap?.[args[0]]) {
            const img = global.screenStickerMap[args[0]]
            delete global.screenStickerMap[args[0]]
            stiker = await sticker(img, false, packname, author)
        }

        else if (/webp|image|video/g.test(mime)) {
            if (/video/g.test(mime) && (q.msg || q).seconds > 9)
                return m.reply('🚫 Video troppo lungo (max 9s).')

            let img = await q.download?.()
            if (!img) return m.reply('🚫 Impossibile scaricare il media.')

            try {
                stiker = await sticker(img, false, packname, author)
            } catch {
                let out
                if (/image|webp/g.test(mime)) out = await uploadImage(img)
                else out = await uploadFile(img)
                if (typeof out !== 'string') out = await uploadImage(img)
                stiker = await sticker(false, out, packname, author)
            }
        }

        else if (text) {
            const textImage = await createTextImage(text, packname, author)
            if (!textImage) return m.reply('❌ Errore nella generazione immagine testo.')
            stiker = await sticker(textImage, false, packname, author)
        }

        else if (args[0]) {
            if (isUrl(args[0])) stiker = await sticker(false, args[0], packname, author)
            else return m.reply('🚫 Invia un media, testo o URL valido.')
        }

        else return m.reply('🚫 Rispondi a un media/testo oppure invia un URL.')
    } catch {
        stiker = false
    } finally {
        if (stiker) conn.sendFile(m.chat, stiker, 'sticker.webp', '', m)
        else m.reply('❌ Non sono riuscito a creare lo sticker.')
    }
}

handler.help = ['stiker', 'stikergif']
handler.tags = ['sticker']
handler.command = /^s(tic?ker)?(gif)?$/i

export default handler