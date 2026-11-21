const BAILEYS_PKGS = ['@whiskeysockets/baileys', 'baileys', '@realvare/baileys', '@adiwajshing/baileys']
const MAX_ITEMS = 30
const TTL = 60 * 60 * 1000 // 1 ora
const FALLBACK_WINDOW = 10 * 60 * 1000 // 10 minuti
const DEBUG = true

// id messaggio -> { buffer, type, caption, ptt, chat, ts }
const viewOnceCache = new Map()
const inProgress = new Set()

const log = (...args) => DEBUG && console.log('[RIVELA]', ...args)

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

// Cattura i View Once appena arrivano, quando la chiave media e' ancora presente
const capture = async m => {
    try {
        const raw = m.message
        if (!raw) return

        const inner = unwrap(raw)
        const type = Object.keys(inner || {}).find(k => /^(image|video|audio)Message$/.test(k))
        if (!type) return

        const media = inner[type]
        const isVo = Boolean(media?.viewOnce || inner !== raw || m.msg?.viewOnce || m.viewOnce)
        const id = m.key?.id || m.id

        log('media ricevuto:', { type, id, viewOnce: isVo, mediaKey: Boolean(media?.mediaKey), wrapped: inner !== raw })

        if (!isVo || !id) return
        if (viewOnceCache.has(id) || inProgress.has(id)) return
        inProgress.add(id)

        try {
            let buffer = null

            try {
                const downloadContentFromMessage = await loadDownloader()
                if (downloadContentFromMessage && media?.mediaKey) {
                    const stream = await downloadContentFromMessage(media, type.replace('Message', ''))
                    buffer = await streamToBuffer(stream)
                }
            } catch (err) {
                log('download diretto fallito:', err?.message || err)
            }

            if (!buffer?.length && typeof m.download === 'function') {
                buffer = await m.download().catch(err => {
                    log('m.download fallito:', err?.message || err)
                    return null
                })
            }

            if (!buffer?.length) {
                log('nessun buffer ottenuto per', id)
                return
            }

            viewOnceCache.set(id, {
                buffer,
                type,
                caption: media?.caption || '',
                ptt: media?.ptt || false,
                chat: m.chat || m.key?.remoteJid,
                ts: Date.now()
            })
            log('salvato in cache:', id, buffer.length, 'byte')
            cleanup()
        } finally {
            inProgress.delete(id)
        }
    } catch (e) {
        log('errore capture:', e?.message || e)
    }
}

let handler = async (m, { conn }) => {
    try {
        if (!m.quoted) throw '『 ⚠️ 』- `Rispondi a un contenuto visualizzabile una volta`'

        const candidates = [
            m.quoted.id,
            m.quoted.key?.id,
            m.quoted.fakeObj?.key?.id,
            m.quoted.stanzaId,
            m.msg?.contextInfo?.stanzaId
        ].filter(Boolean)

        log('cerco id:', candidates, '| in cache:', [...viewOnceCache.keys()])

        let cached = null
        for (const id of candidates) {
            if (viewOnceCache.has(id)) {
                cached = viewOnceCache.get(id)
                break
            }
        }

        // Fallback: ultimo View Once catturato in questa chat negli ultimi minuti
        if (!cached) {
            const now = Date.now()
            const inChat = [...viewOnceCache.values()]
                .filter(item => item.chat === m.chat && now - item.ts < FALLBACK_WINDOW)
            cached = inChat[inChat.length - 1] || null
            if (cached) log('uso fallback: ultimo View Once della chat')
        }

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

// Registrato su entrambi gli hook: il primo che scatta cattura, l'altro viene ignorato
handler.before = async function (m) {
    await capture(m)
}
handler.all = async function (m) {
    await capture(m)
}

handler.help = ['rivela']
handler.tags = ['strumenti']
handler.command = /^(readviewonce|rivela|viewonce)$/i
handler.group = false
handler.admin = false

export default handler
