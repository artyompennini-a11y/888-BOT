const BAILEYS_PKGS = ['@whiskeysockets/baileys', 'baileys', '@realvare/baileys', '@adiwajshing/baileys']

const loadDownloader = async () => {
    for (const pkg of BAILEYS_PKGS) {
        try {
            const mod = await import(pkg)
            const fn = mod.downloadContentFromMessage || mod.default?.downloadContentFromMessage
            if (fn) return fn
        } catch {}
    }
    return null
}

const unwrap = message => {
    let msg = message
    for (let i = 0; i < 6; i++) {
        const inner =
            msg?.viewOnceMessage?.message ||
            msg?.viewOnceMessageV2?.message ||
            msg?.viewOnceMessageV2Extension?.message ||
            msg?.ephemeralMessage?.message ||
            msg?.documentWithCaptionMessage?.message
        if (!inner) break
        msg = inner
    }
    return msg
}

const streamToBuffer = async stream => {
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    return Buffer.concat(chunks)
}

let handler = async (m, { conn }) => {
    try {
        if (!m.quoted) throw '『 ⚠️ 』- `Rispondi a un contenuto visualizzabile una volta`'

        const raw = m.quoted.fakeObj?.message || m.quoted.message || {}
        const inner = unwrap(raw)
        const type = Object.keys(inner || {}).find(k => /^(image|video|audio)Message$/.test(k))

        if (!type) throw '❌ Formato non supportato o non è un View Once valido'

        const media = inner[type]
        const wasWrapped = inner !== raw
        const isVo = media?.viewOnce || wasWrapped || m.quoted.viewOnce

        if (!isVo) throw '『 ⚠️ 』- `Questo non è un contenuto visualizzabile una volta`'

        let buffer = null

        try {
            const downloadContentFromMessage = await loadDownloader()
            if (downloadContentFromMessage) {
                const stream = await downloadContentFromMessage(media, type.replace('Message', ''))
                buffer = await streamToBuffer(stream)
            }
        } catch (err) {
            console.error('[RIVELA] downloadContentFromMessage:', err)
        }

        if (!buffer?.length) {
            buffer = await m.quoted.download().catch(() => null)
        }

        if (!buffer?.length) {
            throw '❌ Impossibile scaricare il contenuto, i server WhatsApp potrebbero averlo già rimosso.'
        }

        const caption = media?.caption || ''

        if (type === 'imageMessage') {
            await conn.sendMessage(m.chat, { image: buffer, caption }, { quoted: m })
        } else if (type === 'videoMessage') {
            await conn.sendMessage(m.chat, { video: buffer, caption }, { quoted: m })
        } else {
            await conn.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mp4',
                ptt: Boolean(media?.ptt)
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
