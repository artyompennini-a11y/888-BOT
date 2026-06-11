// Plugin by Elixir, Punisher & 888 staff
import { sticker } from '../lib/sticker.js'
import uploadFile from '../lib/uploadFile.js'
import uploadImage from '../lib/uploadImage.js'

let handler = async (m, { conn }) => {
    let stiker = false
    try {
        let q = m.quoted ? m.quoted : m

        if (q.viewOnce || q.msg?.viewOnce || q.ephemeralExpiration || m.viewOnce || m.msg?.viewOnce) {
            return m.reply('🚫 Impossibile fare sticker alle foto a una visualizzazione.')
        }

        let mime = (q.msg || q).mimetype || q.mediaType || ''

    
        if (/webp|image|video/g.test(mime)) {
            if (/video/g.test(mime) && (q.msg || q).seconds > 9) {
                return m.reply('⚠️ Il video non deve superare i 9 secondi.')
            }

            m.reply('ⓘ 𝐂𝐚𝐫𝐢𝐜𝐚𝐦𝐞𝐧𝐭𝐨 ...')
            let img = await q.download?.()
            if (!img) return m.reply('❌ Impossibile scaricare il media.')

            const senderName = m.pushName || m.sender.split('@')[0] || 'Utente'
            const packname = `${senderName}`
            const author = `888 bot`

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
        } else {
            return m.reply('⚠️ Rispondi a un\'immagine o a un video per creare lo sticker.')
        }
    } catch (e) {
        console.error(e)
        if (!stiker) stiker = e
    } finally {
        if (stiker) conn.sendFile(m.chat, stiker, 'sticker.webp', '', m)
    }
}

handler.help = ['stiker (reply media)']
handler.tags = ['sticker']
handler.command = /^s(tic?ker)?(gif)?(wm)?$/i

export default handler
