// Plugin by elixir
const IS_ENABLED = (chat) => Boolean(chat?.antiBot ?? chat?.antibot)

const WRAPPER_TYPES = new Set([
    'viewOnceMessage',
    'viewOnceMessageV2',
    'viewOnceMessageV2Extension',
    'documentWithCaptionMessage',
    'ephemeralMessage',
    'editedMessage',
    'deviceSentMessage'
])

const BOT_ONLY_PAYLOAD_TYPES = new Set([
    'buttonsMessage',
    'buttonsV3Message',
    'listMessage',
    'templateMessage',
    'highlyStructuredMessage',
    'hydratedTemplateMessage',
    'hydratedFourRowTemplate',
    'interactiveMessage',
    'nativeFlowMessage'
])

const USER_RESPONSE_TYPES = new Set([
    'buttonsResponseMessage',
    'listResponseMessage',
    'templateButtonReplyMessage',
    'interactiveResponseMessage'
])

const STRONG_TEXT_SIGNATURES = [
    { tag: 'baileys', re: /baileys/i },
    { tag: 'powered_by', re: /powered\s*by/i },
    { tag: 'whatsapp_bot', re: /whats?app[\s._-]*bot/i },
    { tag: 'bot_whatsapp', re: /\bbot[\s._-]*(?:whats?app|wa)\b/i },
    { tag: 'clona_888', re: /888[\s._-]*(?:bot|community)/i },
    { tag: 'script_by', re: /(?:script|plugin|sorgente)\s+(?:by|di)\s*[:@]/i },
    { tag: 'copyright', re: /(?:©|copyright)\s*(?:19|20)\d{2}/i },
    { tag: 'prefix_info', re: /(?:prefisso|prefissi|prefix)\s*[:=]\s*[!.\/#$]/i }
]

const WEAK_TEXT_SIGNATURES = [
    { tag: 'jid_esposto', re: /@s\.whatsapp\.net/i },
    { tag: 'menu', re: /(?:^|\n)\s*(?:menu|comandi|lista\s+comandi|help)\s*(?:[:⤵↓➜]|\.\.\.)/i }
]

const BOX_DRAWING = /[┌┏╭╔┐┓╮╗└┘╰╯╚╝├┤┣┫┬┴┼│┃║─━═]/g

const UNOFFICIAL_ID_REGEX = /^(?:3EB0[0-9a-f]{8}|3EB0[0-9a-f]{16}|3EB0[0-9a-f]{36}|(?:false|true)_)/

const BARE_TRIGGERS = /^(?:menu|ping|aiuto|help|bot|comandi)$/i

const WINDOW_MS = 10 * 60 * 1000
const LOOP_WINDOW_MS = 90 * 1000
const REPEAT_WINDOW_MS = 8 * 1000
const QUICK_REPLY_MS = 6000
const BURST_WINDOW_MS = 4000
const BURST_COUNT = 6
const PRUNE_AFTER_MS = 30 * 60 * 1000
const WARN_SCORE = 4
const KICK_SCORE = 8
const MAX_WARNS = 2

const SIGNAL_LABELS = {
    unofficial_payload: 'messaggio interattivo non inviabile da utenti normali',
    bot_signature: 'firme tipiche di un bot',
    legacy_id: 'ID messaggio di libreria non ufficiale',
    web_device: 'sessione web/desktop collegata',
    repeat: 'messaggi identici ripetuti',
    burst: 'raffica di messaggi automatici',
    self_loop: 'risposte automatiche a se stesso',
    cmd_reply_loop: 'risposte automatiche ai comandi',
    weak_signature: 'indizi generici di bot'
}

const trackers = {}
const lastMessage = {}
let ticks = 0

function toNumber(jid = '') {
    return String(jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '')
}

function normalizeJid(jid = '') {
    const number = toNumber(jid)
    return number ? number + '@s.whatsapp.net' : ''
}

function decodeAuthor(conn, jid = '') {
    if (!jid) return ''
    try {
        const decoded = typeof conn?.decodeJid === 'function' ? conn.decodeJid(jid) : jid
        return normalizeJid(decoded)
    } catch {
        return normalizeJid(jid)
    }
}

function getText(m) {
    const chunks = []
    const add = (v) => { if (typeof v === 'string' && v.trim()) chunks.push(v) }
    add(m.text)
    add(m.caption)
    const msg = m.msg
    if (msg && typeof msg === 'object') {
        add(msg.text)
        add(msg.caption)
        add(msg.conversation)
        add(msg.contentText)
        add(msg.selectedDisplayText)
    }
    return chunks.join('\n').trim()
}

function unwrapMessage(message, depth = 0) {
    if (!message || typeof message !== 'object' || depth > 4) return message
    const keys = Object.keys(message).filter(k => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage')
    const key = keys[0]
    if (key && WRAPPER_TYPES.has(key)) {
        const inner = message[key]?.message || message[key]
        return unwrapMessage(inner, depth + 1)
    }
    return message
}

function getPayloadTypes(m) {
    const types = new Set()
    const addAll = (obj) => {
        if (!obj || typeof obj !== 'object') return
        for (const key of Object.keys(obj)) {
            if (key === 'messageContextInfo' || key === 'senderKeyDistributionMessage') continue
            types.add(key)
        }
    }
    if (m.mtype) types.add(m.mtype)
    addAll(unwrapMessage(m.message))
    return types
}

function detectUnofficialPayload(m) {
    const types = getPayloadTypes(m)
    for (const type of types) {
        if (USER_RESPONSE_TYPES.has(type)) return null
    }
    for (const type of types) {
        if (BOT_ONLY_PAYLOAD_TYPES.has(type)) return type
    }
    return null
}

function analyzeText(text) {
    const strong = []
    const weak = []
    if (!text || text.length < 2) return { strong, weak, box: false }
    for (const { tag, re } of STRONG_TEXT_SIGNATURES) {
        if (re.test(text)) strong.push(tag)
    }
    const boxCount = (text.match(BOX_DRAWING) || []).length
    const box = boxCount >= 6 && text.length >= 15
    if (!strong.length) {
        for (const { tag, re } of WEAK_TEXT_SIGNATURES) {
            if (re.test(text)) weak.push(tag)
        }
    }
    return { strong, weak, box }
}

function isCommandText(text) {
    const line = String(text || '').trim().split('\n')[0].trim()
    if (line.length < 2 || line.length > 60) return false
    if (BARE_TRIGGERS.test(line)) return true
    try {
        if (global.prefix instanceof RegExp) {
            global.prefix.lastIndex = 0
            if (global.prefix.test(line)) return true
        }
    } catch { }
    const first = line.split(/\s+/)[0]
    return /^[!.\/#$][a-zA-Z][\w-]{1,20}$/.test(first)
}

function isUnofficialMessageId(id) {
    if (!id || typeof id !== 'string') return false
    return UNOFFICIAL_ID_REGEX.test(id)
}

function isKnownBotConnection(sender) {
    try {
        const target = toNumber(sender)
        if (!target) return false
        return (global.conns || []).some(sock => {
            const id = sock?.user?.id || sock?.user?.jid || ''
            return id && toNumber(id) === target
        })
    } catch {
        return false
    }
}

function isWhitelisted(chat, sender) {
    try {
        const target = toNumber(sender)
        if (!target) return false
        const lists = [chat?.antibotWhitelist, chat?.antiBotWhitelist].filter(Array.isArray)
        return lists.some(list => list.some(entry => toNumber(entry) === target))
    } catch {
        return false
    }
}

function detectLinkedDevice(chatUpdate, m, rec) {
    try {
        const raw = Array.isArray(chatUpdate?.messages)
            ? chatUpdate.messages.find(entry => entry?.key?.id && entry.key.id === m.key?.id)
            : null
        const participant = String(raw?.key?.participant || '')
        const match = /:(\d+)@/.exec(participant)
        if (!match) return false
        rec.device.total += 1
        if (Number(match[1]) > 0) rec.device.linked += 1

        return rec.device.total >= 3 && rec.device.linked === rec.device.total
    } catch {
        return false
    }
}

function createRecord(now) {
    return {
        windowAt: now,
        score: 0,
        hard: false,
        signals: new Set(),
        details: [],
        lastTextNorm: '',
        lastTextAt: 0,
        textIds: [],
        repeats: 0,
        msgs: [],
        selfQuotes: [],
        commandReplies: [],
        device: { total: 0, linked: 0 }
    }
}

function resetRecord(rec, now) {
    rec.windowAt = now
    rec.score = 0
    rec.hard = false
    rec.signals = new Set()
    rec.details = []
    rec.lastTextNorm = ''
    rec.lastTextAt = 0
    rec.textIds = []
    rec.repeats = 0
    rec.msgs = []
    rec.selfQuotes = []
    rec.commandReplies = []
}

function getRecord(chatId, sender, now) {
    if (!trackers[chatId]) trackers[chatId] = {}
    const rec = trackers[chatId][sender] || (trackers[chatId][sender] = createRecord(now))
    if (now - rec.windowAt > WINDOW_MS) resetRecord(rec, now)
    return rec
}

function addSignal(rec, tag, points, hard = false, detail = '') {
    if (!rec.signals.has(tag)) {
        rec.signals.add(tag)
        rec.score += points
    }
    if (hard) rec.hard = true
    if (detail && !rec.details.includes(detail)) rec.details.push(detail)
}

function normalizeText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function pushWindow(list, now, size) {
    list.push(now)
    while (list.length && now - list[0] > size) list.shift()
    return list
}

function detectRepeats(rec, text, id, now) {
    const normalized = normalizeText(text)
    const duplicates = []
    if (normalized && normalized === rec.lastTextNorm && now - rec.lastTextAt <= REPEAT_WINDOW_MS) {
        rec.repeats += 1
        duplicates.push(...rec.textIds.slice(-2))
    } else {
        rec.repeats = 0
        rec.textIds = []
    }
    rec.lastTextNorm = normalized
    rec.lastTextAt = now
    if (normalized) {
        rec.textIds.push(id)
        if (rec.textIds.length > 4) rec.textIds.shift()
    }
    if (rec.repeats >= 2) {
        rec.repeats = 0
        rec.textIds = []
        return [...new Set(duplicates.filter(Boolean))]
    }
    return []
}

function detectBurst(rec, now, text) {
    if (!text || text.length < 6) return false
    pushWindow(rec.msgs, now, BURST_WINDOW_MS)
    return rec.msgs.length >= BURST_COUNT
}

function rememberLastMessage(m, now) {
    const previous = lastMessage[m.chat] || null
    try {
        lastMessage[m.chat] = {
            sender: m.sender,
            at: now,
            text: getText(m),
            fromMe: Boolean(m.fromMe)
        }
    } catch { }
    return previous
}

function pruneTrackers(now) {
    for (const chatId of Object.keys(trackers)) {
        const chatTrackers = trackers[chatId]
        for (const sender of Object.keys(chatTrackers)) {
            if (now - (chatTrackers[sender]?.windowAt || 0) > PRUNE_AFTER_MS) delete chatTrackers[sender]
        }
        if (!Object.keys(chatTrackers).length) delete trackers[chatId]
    }
    for (const chatId of Object.keys(lastMessage)) {
        if (now - (lastMessage[chatId]?.at || 0) > PRUNE_AFTER_MS) delete lastMessage[chatId]
    }
}

function describeRecord(rec) {
    const labels = [...rec.signals].map(tag => SIGNAL_LABELS[tag]).filter(Boolean)
    const unique = [...new Set([...labels, ...rec.details].filter(Boolean))]
    if (!unique.length) return 'comportamento automatico'
    const text = unique.join(' • ')
    return text.length > 260 ? text.slice(0, 257) + '...' : text
}

async function deleteMessages(conn, chat, sender, ids) {
    for (const id of [...new Set(ids.filter(Boolean))]) {
        try {
            await conn.sendMessage(chat, {
                delete: { remoteJid: chat, fromMe: false, id, participant: sender }
            })
        } catch (e) {
            console.error('[antiBot] Errore eliminazione messaggio:', e?.message || e)
        }
    }
}

async function notifyGroup(conn, chat, sender, reason, kicked, warns) {
    const tag = `@${toNumber(sender)}`
    const text = kicked
        ? `🤖 *AntiBot attivato*\n\n👤 Utente: ${tag}\n📝 Motivo: ${reason}\n⚡ Azione: utente *espulso* dal gruppo`
        : `🤖 *AntiBot attivato*\n\n👤 Utente: ${tag}\n📝 Motivo: ${reason}\n⚠️ Avviso: ${warns}/${MAX_WARNS} — al prossimo avviso verrai espulso`
    await conn.sendMessage(chat, { text, mentions: [sender] })
}

async function removeMember(conn, chat, sender) {
    const candidates = [...new Set([sender, normalizeJid(sender)])].filter(Boolean)
    for (const jid of candidates) {
        try {
            await conn.groupParticipantsUpdate(chat, [jid], 'remove')
            return true
        } catch (e) {
            console.error('[antiBot] Errore rimozione partecipante:', e?.message || e)
        }
    }
    return false
}

function ensureUser(sender) {
    if (!global.db?.data) return null
    if (!global.db.data.users) global.db.data.users = {}
    return global.db.data.users[sender] || (global.db.data.users[sender] = {})
}

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, isMods, chatUpdate }) {
    if (!m || !m.message) return false
    if (m.fromMe || (m.isBaileys && m.fromMe)) return true
    if (!m.isGroup) return false

    const now = Date.now()
    if (++ticks % 100 === 0) pruneTrackers(now)

    const previous = rememberLastMessage(m, now)

    const chat = global.db?.data?.chats?.[m.chat]
    if (!chat || chat.isBanned) return true
    if (!IS_ENABLED(chat)) return true

    if (isAdmin || isOwner || isROwner || isMods) return true

    if (!isBotAdmin) return true

    const sender = m.sender
    if (!sender || !sender.endsWith('@s.whatsapp.net')) return true
    if (isWhitelisted(chat, sender)) return true
    if (isKnownBotConnection(sender)) return true

    const text = getText(m)
    const rec = getRecord(m.chat, sender, now)

    const payloadType = detectUnofficialPayload(m)
    if (payloadType) addSignal(rec, 'unofficial_payload', 5, true, payloadType)

    const analysis = analyzeText(text)
    if (analysis.strong.length || analysis.box) {
        const details = [...analysis.strong, ...(analysis.box ? ['menu ASCII'] : [])]
        addSignal(rec, 'bot_signature', Math.min(6, details.length * 2), true, details.join(', '))
    } else if (analysis.weak.length) {
        addSignal(rec, 'weak_signature', 2, false, analysis.weak.join(', '))
    }

    if (isUnofficialMessageId(m.key?.id)) {
        addSignal(rec, 'legacy_id', 2, true, `id: ${String(m.key.id).slice(0, 10)}`)
    }

    if (detectLinkedDevice(chatUpdate, m, rec)) addSignal(rec, 'web_device', 1, false)

    const duplicates = detectRepeats(rec, text, m.key?.id, now)
    if (duplicates.length) {
        addSignal(rec, 'repeat', 3, false, `${duplicates.length + 1} messaggi identici`)
    }

    if (detectBurst(rec, now, text)) addSignal(rec, 'burst', 2, false)

    const contextInfo = m.msg?.contextInfo
    const quotedAuthor = decodeAuthor(conn, contextInfo?.participant)
    const quotedText = typeof m.quoted?.text === 'string' ? m.quoted.text : ''
    if (contextInfo?.quotedMessage && quotedAuthor === sender) {

        pushWindow(rec.selfQuotes, now, LOOP_WINDOW_MS)
        if (rec.selfQuotes.length >= 2) addSignal(rec, 'self_loop', 4, true)
        else addSignal(rec, 'self_quote', 1)
    }

    const repliedToPreviousCommand = Boolean(text) && Boolean(previous) &&
        previous.sender !== sender && !previous.fromMe &&
        (now - previous.at) <= QUICK_REPLY_MS && isCommandText(previous.text)
    const repliedToQuotedCommand = !repliedToPreviousCommand && Boolean(text) &&
        Boolean(contextInfo?.quotedMessage) && quotedAuthor !== '' && quotedAuthor !== sender &&
        isCommandText(quotedText)

    if (repliedToPreviousCommand || repliedToQuotedCommand) {

        const looksAutomated = repliedToQuotedCommand ||
            analysis.strong.length > 0 || analysis.box || text.length >= 30
        pushWindow(rec.commandReplies, now, LOOP_WINDOW_MS)
        if (rec.commandReplies.length >= 3 && looksAutomated) addSignal(rec, 'cmd_reply_loop', 4, true)
        else addSignal(rec, 'quick_cmd_reply', 1)
    }

    if (!rec.hard || rec.score < WARN_SCORE) return true

    const attackNow = rec.score >= KICK_SCORE ||
        (rec.signals.has('unofficial_payload') && (rec.signals.has('self_loop') || rec.signals.has('cmd_reply_loop')))

    const reason = describeRecord(rec)

    if (chat.antibotDryRun === true) {
        console.log(`[antiBot][dry-run] ${sender} in ${m.chat} | score ${rec.score} | ${reason}`)
        resetRecord(rec, now)
        return true
    }

    const user = ensureUser(sender)
    if (user) user.antibot = (user.antibot || 0) + 1
    const warns = user?.antibot || 1
    const kicked = attackNow || warns >= MAX_WARNS

    console.log(`[antiBot] ${kicked ? 'ESPULSIONE' : 'AVVISO'} | ${sender} | chat ${m.chat} | score ${rec.score} | ${reason}`)

    if (chat.antibotDelete !== false) {
        await deleteMessages(conn, m.chat, sender, [m.key?.id, ...duplicates])
    }

    const removed = kicked ? await removeMember(conn, m.chat, sender) : false

    await notifyGroup(conn, m.chat, sender, reason, kicked && removed, warns)
        .catch(e => console.error('[antiBot] Errore notifica:', e?.message || e))

    if (kicked) {
        if (removed && user) user.antibot = 0
        if (trackers[m.chat]) delete trackers[m.chat][sender]
        if (!removed) {
            await conn.sendMessage(m.chat, {
                text: `⚠️ Non sono riuscito a rimuovere @${toNumber(sender)}: permessi insufficienti.`,
                mentions: [sender]
            }).catch(() => { })
        }
    } else {
        resetRecord(rec, now)
    }

    global.markDbDirty?.()
    return true
}

export const disabled = false
