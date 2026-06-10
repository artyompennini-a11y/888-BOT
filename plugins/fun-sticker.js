import { sticker } from '../lib/sticker.js'
import uploadFile from '../lib/uploadFile.js'
import uploadImage from '../lib/uploadImage.js'
import { createCanvas } from '@napi-rs/canvas'

const isUrl = (text) => {
    return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png|webp)/, 'gi'))
}

const createTextImage = async (text, author) => {
    try {
        const canvas = createCanvas(500, 500) 
        const ctx = canvas.getContext('2d')
        
        
        ctx.clearRect(0, 0, 500, 500)
        
        
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 36px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        const maxWidth = 420
        const lineHeight = 46
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
        let startY = (500 - totalHeight) / 2 + (lineHeight / 2)
        
        for (let textLine of lines) {
            ctx.fillText(textLine, 250, startY)
            startY += lineHeight
        }
        
        
        ctx.font = 'bold 16px Arial'
        ctx.fillStyle = '#666666'
        ctx.textAlign = 'center'
        ctx.fillText(`By: ${author}`, 250, 460)
        
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
        let text = q.text || q.body || q.caption || ''

        const senderName = m.pushName || m.sender.split('@')[0] || 'Utente'
        const packname = `${senderName}`
        const author = `𝟴𝟴𝟴 𝗕𝗢𝗧`

        // Gestione mappa sticker temporanea
        if (args[0] && global.screenStickerMap && global.screenStickerMap[args[0]]) {
            m.reply('ⓘ 𝐂𝐫𝐞𝐨 𝐬𝐭𝐢𝐜𝐤𝐞𝐫...')
            try {
                const img = global.screenStickerMap[args[0]]
                delete global.screenStickerMap[args[0]]
                stiker = await sticker(img, false, packname, author)
            } catch (e) {
                console.error(e)
            }
        } 
        
        else if (/webp|image|video/g.test(mime)) {
            if (/video/g.test(mime) && (q.msg || q).seconds > 9) {
                return m.reply('⚠️ Il video non deve superare i 9 secondi.')
            }

            m.reply('ⓘ 𝐂𝐚𝐫𝐢𝐜𝐚𝐦𝐞𝐧𝐭𝐨 ...')
            let img = await q.download?.()
            if (!img) return m.reply('❌ Impossibile scaricare il media.')

            try {
                stiker = await sticker(img, false, packname, author)
            } catch (e) {
                console.error(e)
            } finally {
                if (!stiker) {
                    let out
                    if (/image|webp/g.test
