// Plugin by elixir, punisher & 888 staff
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const FILE_PATH = path.join(DATA_DIR, 'blacklist.json')

function loadStore() {
  try {
    if (!fs.existsSync(FILE_PATH)) return {}
    const data = fs.readFileSync(FILE_PATH, 'utf8')
    return JSON.parse(data) || {}
  } catch (error) {
    console.error('[blacklist] Errore di lettura:', error)
    return {}
  }
}

function saveStore(store) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    const tmp = `${FILE_PATH}.tmp`
    const json = JSON.stringify(store, null, 2)
    fs.writeFileSync(tmp, json, 'utf8')
    try {
      fs.renameSync(tmp, FILE_PATH)
    } catch {
      fs.writeFileSync(FILE_PATH, json, 'utf8')
      try { fs.unlinkSync(tmp) } catch {}
    }
    return true
  } catch (error) {
    console.error('[blacklist] Errore di scrittura:', error)
    return false
  }
}

export function blacklistStore() {
  return loadStore()
}

export function getBlacklist() {
  return loadStore()
}

export function isBlacklisted(jid = '') {
  if (!jid) return false
  const store = loadStore()
  return Boolean(store[jid])
}

export function addBlacklist(jid = '', { reason = '', addedBy = '' } = {}) {
  if (!jid) return null
  const store = loadStore()
  const entry = {
    reason: String(reason || 'Nessun motivo specificato'),
    addedBy: String(addedBy || '').split('@')[0],
    date: new Date().toLocaleString('it-IT')
  }
  store[jid] = entry
  saveStore(store)
  return entry
}

export function removeBlacklist(jid = '') {
  const store = loadStore()
  if (!store[jid]) return false
  delete store[jid]
  saveStore(store)
  return true
}

export function blacklistCount() {
  return Object.keys(loadStore()).length
}

export default {
  blacklistStore,
  getBlacklist,
  isBlacklisted,
  addBlacklist,
  removeBlacklist,
  blacklistCount
}
