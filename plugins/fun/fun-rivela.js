let handler = async (m, { conn }) => {
    try {
        if (!m.quoted) {
            throw '『 ⚠️ 』- `Rispondi a un contenuto visualizzabile una volta`'
        }

        const quoted = m.quoted
        let type = quoted.mediaType || quoted.mtype
        let msg = quoted.mediaMessage || null

        if (type === 'viewOnceMessage' || type === 'viewOnceMessageV2') {
            const wrapper = quoted[type] || quoted.message?.[type] || quoted.message || msg?.[type]
            const inner = wrapper?.message
            if (inner) {
                type = Object.keys(inner).find(key => /(?:image|video|audio)Message/.test(key))
                msg = { [type]: inner[type] }
            }
        } else if (quoted.mtype === 'viewOnceMessage' || quoted.mtype === 'viewOnceMessageV2') {
            const wrapper = quoted[quoted.mtype] || quoted.message?.[quoted.mtype] || msg?.[quoted.mtype]
            const inner = wrapper?.message
            if (inner) {
                type = Object.keys(inner).find(key => /(?:image|video|audio)Message/.test(key))
                msg = { [type]: inner[type] }
            }
        } else if (msg && !msg[type]) {
            type = Object.keys(msg).find(key => /(?:image|video|audio)Message/.test(key)) || type
        }

        if (!type && quoted.mtype) type = quoted.mtype
        if (msg && !msg[type] && quoted[type]) msg = { [type]: quoted[type] }

        const isVo = quoted.viewOnce
            || quoted.mediaMessage?.[type]?.viewOnce
            || quoted.message?.[quoted.mtype]?.viewOnce
            || msg?.[type]?.viewOnce
            || quoted.mtype === 'viewOnceMessage'
            || quoted.mtype === 'viewOnceMessageV2'
            || type === 'viewOnceMessage'
            || type === 'viewOnceMessageV2'
        if (!isVo) {
            throw '『 ⚠️ 』- `Questo non è un contenuto visualizzabile una volta`'
        }

        if (!/videoMessage|imageMessage|audioMessage/.test(type)) {
            throw '❌ Formato non supportato o non è un View Once valido'
        }

        let buffer = await quoted.download?.().catch(() => null)
        if (!buffer && typeof conn.downloadMediaMessage === 'function') {
            buffer = await conn.downloadMediaMessage(quoted.vM || {
                key: { remoteJid: quoted.chat, id: quoted.id, fromMe: quoted.fromMe },
                message: msg
            }).catch(() => null)
        }

        if (!buffer || buffer.length === 0) {
            throw '❌ Impossibile scaricare il contenuto, i server WhatsApp potrebbero averlo già rimosso.'
        }

        const caption = msg?.[type]?.caption || m.quoted?.caption || ''
        
        if (/imageMessage/.test(type)) {
            await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m })
        } else if (/videoMessage/.test(type)) {
            await conn.sendMessage(m.chat, { video: buffer, caption: caption }, { quoted: m })
        } else if (/audioMessage/.test(type)) {
            await conn.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mp4',
                ptt: msg?.[type]?.ptt || m.quoted?.ptt || false
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
