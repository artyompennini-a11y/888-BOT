// Plugin by Elixir, Punisher & 888 staff

let handler = async (m, { conn }) => {
    try {
        if (!m.quoted) {
            throw '『 ⚠️ 』- `Rispondi a un contenuto visualizzabile una volta`'
        }

        let type = m.quoted.mtype
        let msg = m.quoted.message

        if (type === 'viewOnceMessage' || type === 'viewOnceMessageV2') {
            msg = msg[type].message
            type = Object.keys(msg)[0]
        }

        const isVo = m.quoted.viewOnce || m.quoted.message?.[m.quoted.mtype]?.viewOnce || msg?.[type]?.viewOnce
        if (!isVo) {
            throw '『 ⚠️ 』- `Questo non è un contenuto visualizzabile una volta`'
        }

        if (!/videoMessage|imageMessage|audioMessage/.test(type)) {
            throw '❌ Formato non supportato o non è un View Once valido'
        }

        const buffer = await m.quoted.download().catch(() => null)

        if (!buffer || buffer.length === 0) {
            throw '❌ Impossibile scaricare il contenuto, i server WhatsApp potrebbero averlo già rimosso.'
        }

        const caption = msg?.[type]?.caption || m.quoted?.caption || ''
        
        if (/videoMessage/.test(type)) {
            await conn.sendFile(m.chat, buffer, 'video.mp4', caption, m)
        } else if (/imageMessage/.test(type)) {
            await conn.sendFile(m.chat, buffer, 'image.jpg', caption, m)
        } else if (/audioMessage/.test(type)) {
            await conn.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mp4',
                ptt: msg?.[type]?.ptt || m.quoted?.ptt || false
            }, { quoted: m })
        }

    } catch (e) {
        console.error('Errore nel rivelare view once:', e)
        const errorMessage = typeof e === 'string' ? e : '❌ Si è verificato un errore nel download del View Once.'
        await m.reply(errorMessage)
    }
}

handler.help = ['rivela']
handler.tags = ['strumenti']
handler.command = /^(readviewonce|rivela|viewonce)$/i
handler.group = true
handler.admin = true

export default handler
