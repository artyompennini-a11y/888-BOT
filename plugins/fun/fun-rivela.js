let handler = async (m, { conn }) => {
    try {
        if (!m.quoted) {
            throw '『 ⚠️ 』- `Rispondi a un contenuto visualizzabile una volta`'
        }

        const quoted = m.quoted
        const wrappers = new Set([
            'ephemeralMessage',
            'viewOnceMessage',
            'viewOnceMessageV2',
            'viewOnceMessageV2Extension'
        ])
        const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage']
        let content = { [quoted.mtype]: quoted }
        let type = quoted.mtype
        let isVo = Boolean(quoted.viewOnce)

        while (wrappers.has(type)) {
            if (type.startsWith('viewOnce')) isVo = true
            content = content[type]?.message
            if (!content) break
            type = Object.keys(content).find(key => wrappers.has(key) || mediaTypes.includes(key))
            if (!type) break
        }

        if (!mediaTypes.includes(type)) {
            const extracted = quoted.mediaMessage
            type = quoted.mediaType
            if (extracted && mediaTypes.includes(type)) content = extracted
        }

        const media = content?.[type]
        isVo = isVo || Boolean(media?.viewOnce)
        if (!isVo) {
            throw '『 ⚠️ 』- `Questo non è un contenuto visualizzabile una volta`'
        }

        if (!mediaTypes.includes(type) || !media) {
            throw '❌ Formato non supportato o non è un View Once valido'
        }

        let buffer
        let downloadError
        if (typeof conn.downloadMedia === 'function') {
            try {
                buffer = await conn.downloadMedia(quoted.vM, 'buffer')
            } catch (error) {
                downloadError = error
            }
        }
        if ((!buffer || buffer.length === 0) && typeof conn.downloadM === 'function') {
            try {
                buffer = await conn.downloadM(media, type.replace(/Message$/i, ''))
            } catch (error) {
                downloadError = error
            }
        }
        if ((!buffer || buffer.length === 0) && typeof quoted.download === 'function') {
            try {
                buffer = await quoted.download()
            } catch (error) {
                downloadError = error
            }
        }

        if (!buffer || buffer.length === 0) {
            if (downloadError) console.error('Download View Once fallito:', downloadError)
            if (!media.url && !media.directPath) {
                throw '❌ Il messaggio citato non contiene i dati media scaricabili. Se nei log compare “No matching sessions found for message”, la sessione WhatsApp del bot non ha decifrato il messaggio: ricollega il bot e chiedi di inviare di nuovo il contenuto.'
            }
            throw '❌ Impossibile scaricare il contenuto, i server WhatsApp potrebbero averlo già rimosso.'
        }

        const caption = media.caption || quoted.caption || ''
        
        if (/imageMessage/.test(type)) {
            await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m })
        } else if (/videoMessage/.test(type)) {
            await conn.sendMessage(m.chat, { video: buffer, caption: caption }, { quoted: m })
        } else if (/audioMessage/.test(type)) {
            await conn.sendMessage(m.chat, {
                audio: buffer,
                mimetype: media.mimetype || 'audio/mp4',
                ptt: media.ptt || quoted.ptt || false
            }, { quoted: m })
        }

    } catch (e) {
        console.error(e)
        const errorMessage = typeof e === 'string' ? e : '❌ Si è verificato un errore nel download del View Once.'
        await conn.sendMessage(m.chat, { text: errorMessage }, { quoted: m })
    }
}

handler.help = ['rivela']
handler.tags = ['strumenti']
handler.command = /^(readviewonce|rivela|viewonce)$/i
handler.group = false
handler.admin = false

export default handler



