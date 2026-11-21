const BAILEYS_PKGS = ['@whiskeysockets/baileys', 'baileys', '@realvare/baileys', '@adiwajshing/baileys']
const MAX_ITEMS = 30
const TTL = 60 * 60 * 1000 // 1 ora

// id messaggio -> { buffer, type, caption, ptt, ts }
const viewOnceCache = new Map()

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

const cleanup = () => {
    const now = Date.now()
    for (const [id, item] of viewOnceCache) {
        if (now - item.ts > TTL) viewOnceCache.delete(id)
    }
    while (viewOnceCache.size > MAX_ITEMS) {
        viewOnceCache.delete(viewOnceCache.keys().next().value)
    }
}

let handler = async (m, { conn }) => {
    try {
        if (!m.quoted) throw '『 ⚠️ 』- `Rispondi a un contenuto visualizzabile una volta`'

        const quotedId =
            m.quoted.id ||
            m.quoted.key?.id ||
            m.quoted.fakeObj?.key?.id ||
            m.msg?.contextInfo?.stanzaId

        const cached = quotedId ? viewOnceCache.get(quotedId) : null

        if (!cached) {
            throw '❌ Non ho questo contenuto in memoria. Il bot può rivelare solo i View Once ricevuti mentre era attivo (ultima ora).'
        }

        const { buffer, type, caption, ptt } = cached

        if (type === 'imageMessage') {
            await conn.sendMessage(m.chat, { image: buffer, caption }, { quoted: m })
        } else if (type === 'videoMessage') {
            await conn.sendMessage(m.chat, { video: buffer, caption }, { quoted: m })
        } else {
            await conn.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mp4',
                ptt: Boolean(ptt)
            }, { quoted: m })
        }
    } catch (e) {
        console.error(e)
        const errorMessage = typeof e === 'string' ? e : '❌ Si è verificato un errore nel recupero del View Once.'
        await conn.sendMessage(m.chat, { text: errorMessage }, { quoted: m })
    }
}

// Cattura i View Once appena arrivano, quando la chiave media è ancora presente
handler.before = async function (m, { conn }) {
    try {
        const raw = m.message
        if (!raw) return

        const inner = unwrap(raw)
        const type = Object.keys(inner || {}).find(k => /^(image|video|audio)Message$/.test(k))
        if (!type) return

        const media = inner[type]
        const isVo = media?.viewOnce || inner !== raw
        if (!isVo) return

        const id = m.key?.id || m.id
        if (!id || viewOnceCache.has(id)) return

        let buffer = null

        try {
            const downloadContentFromMessage = await loadDownloader()
            if (downloadContentFromMessage && media?.mediaKey) {
                const stream = await downloadContentFromMessage(media, type.replace('Message', ''))
                buffer = await streamToBuffer(stream)
            }
        } catch (err) {
            console.error('[RIVELA] download su arrivo:', err?.message || err)
        }

        if (!buffer?.length && typeof m.download === 'function') {
            buffer = await m.download().catch(() => null)
        }

        if (!buffer?.length) return

        viewOnceCache.set(id, {
            buffer,
            type,
            caption: media?.caption || '',
            ptt: media?.ptt || false,
            ts: Date.now()
        })
        cleanup()
    } catch (e) {
        console.error('[RIVELA] before:', e?.message || e)
    }
}

handler.help = ['rivela']
handler.tags = ['strumenti']
handler.command = /^(readviewonce|rivela|viewonce)$/i
handler.group = false
handler.admin = false

export default handler
