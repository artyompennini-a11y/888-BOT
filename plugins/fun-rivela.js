import { downloadContentFromMessage } from '@realvare/baileys'

let handler = async (m, { conn }) => {
    try {
        if (!m.quoted) {
            throw '『 ⚠️ 』- `Rispondi a un contenuto visualizzabile una volta`'
        }

        let type = m.quoted.mtype
        let msg = m.quoted.message

        if (type === 'viewOnceMessage' || type === 'viewOnceMessageV2') {
            msg = msg[type].message
            type = Object.keys(msg)
        }

        const isVo = m.quoted.viewOnce || m.quoted.message?.[m.quoted.mtype]?.viewOnce || msg?.[type]?.viewOnce
        if (!isVo) {
            throw '『 ⚠️ 』- `Questo non è un contenuto visualizzabile una volta`'
        }

        if (!/videoMessage|imageMessage|audioMessage/.test(type)) {
            throw '❌ Formato non supportato o non è un View Once valido'
        }

        const mediaData = msg[type]
        const stream = await downloadContentFromMessage(mediaData, type.replace('Message', ''))
        let buffer = Buffer.from([])
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        if (!buffer || buffer.length === 0) {
            throw '❌ Impossibile scaricare il contenuto, i server WhatsApp potrebbero averlo già rimosso.'
        }

        const caption = mediaData?.caption || m.quoted?.caption || ''

        if (type === 'imageMessage') {
            await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m })
        } else if (type === 'videoMessage') {
            await conn.sendMessage(m.chat, { video: buffer, caption: caption }, { quoted: m })
        } else if (type === 'audioMessage') {
            await conn.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mp4',
                ptt: mediaData?.ptt || m.quoted?.ptt || false
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
handler.group = true
handler.admin = true

export default handler
