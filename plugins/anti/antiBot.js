// Plugin by elixir, punisher & 888 staff
import fs from 'fs'
import { isWhitelistedNumber } from '../../lib/whitelist.js'

const IS_ENABLED = (chat) => chat?.antibot !== false

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
    'nativeFlowMessage',
    'requestPaymentMessage',
    'sendPaymentMessage',
    'declinePaymentRequestMessage',
    'cancelPaymentRequestMessage',
    'paymentInviteMessage'
])

const USER_RESPONSE_TYPES = new Set([
    'buttonsResponseMessage',
    'listResponseMessage',
    'templateButtonReplyMessage',
    'interactiveResponseMessage'
])

const BARE_TRIGGERS = /^(?:menu|ping|aiuto|help|bot|comandi)$/i

const REPEAT_WINDOW_MS = 5 * 1000
const BURST_WINDOW_MS = 3000
const BURST_COUNT = 8
const PRUNE_AFTER_MS = 30 * 60 * 1000
const GROUP_CACHE_MS = 60 * 1000
const WINDOW_MS = 10 * 60 * 1000
const WARN_SCORE = 4
const KICK_SCORE = 8
const MAX_WARNS = 4
const WARN_RESET_MS = 24 * 60 * 60 * 1000
const DEVICE_MIN_MESSAGES = 3

const AUTORIZZATI_FILE = '/storage/autorizzati-antinuke.json'
const AUTORIZZATI_CACHE_MS = 30 * 1000

const SIGNAL_LABELS = {
    unofficial_payload: 'messaggio interattivo non inviabile da utenti normali',
    legacy_id: 'ID messaggio generato da libreria bot (Baileys)',
    web_device: 'scrive solo da dispositivo collegato (WhatsApp Web o bot)',
    repeat: 'messaggi identici ripetuti',
    burst: 'raffica di messaggi automatici'
}

const trackers = {}
const lastMessage = {}
const groupCache = new Map()
let ticks = 0

let autorizzatiCache = { at: 0, list: [] }

function toNumber(jid = '') {
    return String(jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '')
}

function cleanJid(jid = '') {
    return String(jid || '').replace(/:\d+@/, '@')
}

const isValidUserJid = (jid = '') => /@(?:s\.whatsapp\.net|lid)$/.test(String(jid))

async function getParticipants(conn, chatId) {
    const now = Date.now()
    const hit = groupCache.get(chatId)
    if (hit && now - hit.at < GROUP_CACHE_MS) return hit.list
    try {
        const list = (await conn.groupMetadata(chatId))?.participants || []
        groupCache.set(chatId, { at: now, list })
        return list
    } catch {
        return hit?.list || []
    }
}

const idsOf = (p) => [p?.id, p?.lid, p?.jid, p?.phoneNumber].filter(Boolean)

function findParticipant(participants, jid) {
    const target = toNumber(jid)
    if (!target) return null
    return participants.find(p => idsOf(p).some(v => toNumber(v) === target)) || null
}

function identityNumbers(sender, participants) {
    const set = new Set([toNumber(sender)])
    const p = findParticipant(participants, sender)
    if (p) idsOf(p).forEach(v => set.add(toNumber(v)))
    set.delete('')
    return set
}

function realJidOf(sender, participants) {
    const p = findParticipant(participants, sender)
    const real = p?.phoneNumber || p?.jid || (String(p?.id || '').endsWith('@s.whatsapp.net') ? p.id : '')
    return real ? cleanJid(real) : ''
}

function isAutorizzato(numbers) {
    const now = Date.now()
    if (now - autorizzatiCache.at > AUTORIZZATI_CACHE_MS) {
        try {
            const raw = fs.readFileSync(AUTORIZZATI_FILE, 'utf-8')
            const parsed = JSON.parse(raw)
            autorizzatiCache = {
                at: now,
                list: Array.isArray(parsed)
                    ? parsed
                    : (Array.isArray(parsed?.autorizzati) ? parsed.autorizzati : [])
            }
        } catch {
            autorizzatiCache = { at: now, list: [] }
        }
    }
    return autorizzatiCache.list.some(entry => numbers.has(toNumber(entry)))
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

function detectBotMessageId(id) {
    if (!id || typeof id !== 'string') return null
    if (/^BAE5[0-9A-F]{12}$/i.test(id)) return 'BAE5…'
    if (/^3EB0[0-9A-F]{16}$/i.test(id)) return '3EB0…(20)'
    if (/^3EB0[0-9A-F]{18}$/i.test(id)) return '3EB0…(22)'
    return null
}

function isKnownBotConnection(numbers) {
    try {
        return (global.conns || []).some(sock => {
            const id = sock?.user?.id || sock?.user?.jid || ''
            const lid = sock?.user?.lid || ''
            return (id && numbers.has(toNumber(id))) || (lid && numbers.has(toNumber(lid)))
        })
    } catch {
        return false
    }
}

function readDevice(chatUpdate, m) {
    try {
        const arr = Array.isArray(chatUpdate?.messages) ? chatUpdate.messages : []
        const raw = arr.find(e => e?.key?.id && e.key.id === m.key?.id)
        const key = raw?.key || {}
        const candidates = [
            key.participant,
            key.participantAlt,
            raw?.participant,
            m.key?.participant,
            m.key?.participantAlt,
            m.participant
        ].filter(v => typeof v === 'string' && v.includes('@'))

        if (!candidates.length) return null

        for (const c of candidates) {
            const match = /:(\d+)@/.exec(c)
            if (match) return Number(match[1])
        }
        return 0
    } catch {
        return null
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
    rec.device = { total: 0, linked: 0 }
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
    if (normalized.length < 15 || normalized.split(' ').length < 3) {
        rec.lastTextNorm = normalized
        rec.lastTextAt = now
        return []
    }
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
    if (!text || text.length < 10) return false
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
    for (const [chatId, v] of groupCache) {
        if (now - v.at > PRUNE_AFTER_MS) groupCache.delete(chatId)
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

async function removeMember(conn, chat, sender, realJid) {
    const candidates = [...new Set([sender, realJid])].filter(Boolean)
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

    rememberLastMessage(m, now)

    const chat = global.db?.data?.chats?.[m.chat]
    if (!chat || chat.isBanned) return true
    if (!IS_ENABLED(chat)) return true

    if (isOwner || isROwner || isMods) return true

    const sender = m.sender
    if (!sender || !isValidUserJid(sender)) return true

    const participants = await getParticipants(conn, m.chat)
    const numbers = identityNumbers(sender, participants)

    const senderParticipant = findParticipant(participants, sender)
    if (isAdmin || senderParticipant?.admin) return true

    const botNumbers = new Set([toNumber(conn.user?.id), toNumber(conn.user?.lid), toNumber(conn.user?.jid)].filter(Boolean))
    const botIsAdmin = isBotAdmin || participants.some(p => p.admin && idsOf(p).some(v => botNumbers.has(toNumber(v))))
    if (!botIsAdmin) return true

    if (isAutorizzato(numbers)) return true
    if (isKnownBotConnection(numbers)) return true
    if (isWhitelistedNumber('antibot', m.chat, numbers)) return true

    const text = getText(m)
    const rec = getRecord(m.chat, sender, now)

    const payloadType = detectUnofficialPayload(m)

    if (payloadType && chat.antibotDryRun !== true) {
        console.log(`[antiBot] ESPULSIONE IMMEDIATA | ${sender} | chat ${m.chat} | payload: ${payloadType}`)

        if (chat.antibotDelete !== false) {
            await deleteMessages(conn, m.chat, sender, [m.key?.id])
        }

        const removed = await removeMember(conn, m.chat, sender, realJidOf(sender, participants))

        await notifyGroup(conn, m.chat, sender, `${SIGNAL_LABELS.unofficial_payload}: ${payloadType}`, removed, 1)
            .catch(e => console.error('[antiBot] Errore notifica:', e?.message || e))

        if (trackers[m.chat]) delete trackers[m.chat][sender]

        if (!removed) {
            await conn.sendMessage(m.chat, {
                text: `⚠️ Non sono riuscito a rimuovere @${toNumber(sender)}: permessi insufficienti.`,
                mentions: [sender]
            }).catch(() => { })
        }

        global.markDbDirty?.()
        return true
    }

    if (payloadType) addSignal(rec, 'unofficial_payload', 5, true, payloadType)

    const botId = detectBotMessageId(m.key?.id)
    if (botId) {
        const combined = Boolean(payloadType)
        addSignal(rec, 'legacy_id', 2, combined, `id ${botId}${combined ? ' + payload interattivo' : ''}`)
    }

    if (chat.antibotWeb !== false) {
        const device = readDevice(chatUpdate, m)
        if (device !== null) {
            rec.device.total += 1
            if (device > 0) rec.device.linked += 1
        }
        if (rec.device.total >= DEVICE_MIN_MESSAGES && rec.device.linked === rec.device.total) {
            addSignal(rec, 'web_device', 4, true, `dispositivo collegato (${rec.device.linked}/${rec.device.total} messaggi)`)
        }
    }

    const duplicates = detectRepeats(rec, text, m.key?.id, now)
    if (duplicates.length) {
        addSignal(rec, 'repeat', 2, false, `${duplicates.length + 1} messaggi identici`)
    }

    if (detectBurst(rec, now, text)) addSignal(rec, 'burst', 1, false)

    if (!rec.hard || rec.score < WARN_SCORE) return true

    const attackNow = rec.score >= KICK_SCORE

    const reason = describeRecord(rec)

    if (chat.antibotDryRun === true) {
        console.log(`[antiBot][dry-run] ${sender} in ${m.chat} | score ${rec.score} | ${reason}`)
        resetRecord(rec, now)
        return true
    }

    const user = ensureUser(sender)
    if (user) {
        if (user.antibotAt && now - user.antibotAt > WARN_RESET_MS) {
            user.antibot = 0
        }
        user.antibot = (user.antibot || 0) + 1
        user.antibotAt = now
    }
    const warns = user?.antibot || 1
    const kicked = attackNow || warns >= MAX_WARNS

    console.log(`[antiBot] ${kicked ? 'ESPULSIONE' : 'AVVISO'} | ${sender} | chat ${m.chat} | score ${rec.score} | ${reason}`)

    if (chat.antibotDelete !== false) {
        await deleteMessages(conn, m.chat, sender, [m.key?.id, ...duplicates])
    }

    const removed = kicked ? await removeMember(conn, m.chat, sender, realJidOf(sender, participants)) : false

    await notifyGroup(conn, m.chat, sender, reason, kicked && removed, warns)
        .catch(e => console.error('[antiBot] Errore notifica:', e?.message || e))

    if (kicked) {
        if (removed && user) {
            user.antibot = 0
            user.antibotAt = 0
        }
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