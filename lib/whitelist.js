// Plugin by elixir, punisher & 888 staff
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')

const FILES = {
    antinuke: path.join(DATA_DIR, 'whitelist-antinuke.json'),
    antibot: path.join(DATA_DIR, 'whitelist-antibot.json')
}

const onlyDigits = (value = '') => String(value ?? '').split('@')[0].split(':')[0].replace(/\D+/g, '')

function sameJid(a, b) {
    const left = String(a ?? '').trim()
    const right = String(b ?? '').trim()
    if (!left || !right) return false
    if (left === right) return true
    const digits = onlyDigits(left)
    return Boolean(digits) && digits === onlyDigits(right)
}

function cleanList(list) {
    if (!Array.isArray(list)) return []
    const out = []
    for (const entry of list) {
        const jid = typeof entry === 'string' ? entry.trim() : ''
        if (!jid || out.some(v => sameJid(v, jid))) continue
        out.push(jid)
    }
    return out
}

function emptyStore() {
    return { global: [], chats: {} }
}

function normalizeStore(raw) {
    const store = emptyStore()
    if (!raw || typeof raw !== 'object') return store
    store.global = cleanList(raw.global)
    const chats = raw.chats && typeof raw.chats === 'object' && !Array.isArray(raw.chats) ? raw.chats : {}
    for (const [chatId, list] of Object.entries(chats)) {
        const clean = cleanList(list)
        if (clean.length) store.chats[chatId] = clean
    }
    return store
}

export function whitelistFile(kind = 'antinuke') {
    return FILES[kind] || FILES.antinuke
}

function loadStore(kind) {
    const key = FILES[kind] ? kind : 'antinuke'
    const file = FILES[key]

    try {
        if (!fs.existsSync(file)) return emptyStore()
        const content = fs.readFileSync(file, 'utf8')
        return normalizeStore(JSON.parse(content))
    } catch {
        return emptyStore()
    }
}

export function saveStore(kind = 'antinuke', store) {
    const key = FILES[kind] ? kind : 'antinuke'
    const file = FILES[key]
    const json = JSON.stringify(store, null, 2)

    try {
        fs.mkdirSync(path.dirname(file), { recursive: true })
        const tmp = `${file}.tmp`
        fs.writeFileSync(tmp, json, 'utf8')
        try {
            fs.renameSync(tmp, file)
        } catch {
            fs.writeFileSync(file, json, 'utf8')
            try { fs.unlinkSync(tmp) } catch { }
        }
        return true
    } catch (e) {
        console.error(`[whitelist] Errore scrittura ${path.basename(file)}:`, e?.message || e)
        return false
    }
}

export function readWhitelist(kind = 'antinuke', chatId = '', globalScope = false) {
    const store = loadStore(kind)
    if (globalScope) return [...store.global]
    return [...(store.chats[chatId] || [])]
}

export function writeWhitelist(kind, chatId, list, globalScope = false) {
    const store = loadStore(kind)
    const clean = cleanList(list)

    if (globalScope) {
        store.global = clean
    } else if (clean.length) {
        store.chats[chatId] = clean
    } else {
        delete store.chats[chatId]
    }

    saveStore(kind, store)
    return [...clean]
}

export function isWhitelistedNumber(kind, chatId, numbers) {
    if (!numbers || typeof numbers.has !== 'function') return false
    const store = loadStore(kind)
    const lists = [store.global, store.chats[chatId] || []]
    for (const list of lists) {
        for (const entry of list) {
            const digits = onlyDigits(entry)
            if (digits && numbers.has(digits)) return true
        }
    }
    return false
}

export function isWhitelistedJid(kind, chatId, jid) {
    const digits = onlyDigits(jid)
    if (!digits) return false
    return isWhitelistedNumber(kind, chatId, new Set([digits]))
}

export function addWhitelistEntry(kind, chatId, jid, globalScope = false, max = 0) {
    const entry = String(jid ?? '').trim()
    if (!entry) return { added: false, reason: 'invalid' }

    const store = loadStore(kind)
    const list = globalScope ? store.global : (store.chats[chatId] || (store.chats[chatId] = []))

    if (list.some(v => sameJid(v, entry))) return { added: false, reason: 'duplicate' }
    if (max > 0 && list.length >= max) return { added: false, reason: 'limit' }

    list.push(entry)
    saveStore(kind, store)
    return { added: true, reason: '', list: [...list] }
}

export function removeWhitelistEntry(kind, chatId, jid, globalScope = false) {
    const entry = String(jid ?? '').trim()
    if (!entry) return { removed: false, reason: 'invalid' }

    const store = loadStore(kind)
    const list = globalScope ? store.global : (store.chats[chatId] || [])
    const index = list.findIndex(v => sameJid(v, entry))
    if (index === -1) return { removed: false, reason: 'absent' }

    list.splice(index, 1)
    if (!globalScope && !list.length) delete store.chats[chatId]
    saveStore(kind, store)
    return { removed: true, reason: '', list: [...list] }
}

export function clearWhitelist(kind, chatId, globalScope = false) {
    const store = loadStore(kind)
    const list = globalScope ? store.global : (store.chats[chatId] || [])
    const cleared = list.length
    if (!cleared) return { cleared: 0 }

    if (globalScope) store.global = []
    else delete store.chats[chatId]
    saveStore(kind, store)
    return { cleared }
}

export default {
    whitelistFile,
    readWhitelist,
    writeWhitelist,
    saveStore,
    isWhitelistedNumber,
    isWhitelistedJid,
    addWhitelistEntry,
    removeWhitelistEntry,
    clearWhitelist
}
