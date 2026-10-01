// Plugin by elixir, punisher & 888 staff
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.join(__dirname, '..', 'data')
const FILE = path.join(DIR, 'state.json')
const TMP = path.join(DIR, 'state.json.tmp')

const DEFAULTS = {
  flushDelay: 1500,
  maxEntries: 20000
}

const cache = { data: null, dirty: false, timer: null, writing: false, pending: false }

const empty = () => ({ v: 1, at: Date.now(), security: {}, counters: {} })

function ensureDir() {
  try {
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true })
  } catch {}
}

export function read() {
  if (cache.data) return cache.data
  ensureDir()
  try {
    const raw = fs.readFileSync(FILE, 'utf8')
    const parsed = JSON.parse(raw)
    cache.data = { ...empty(), ...parsed }
  } catch {
    cache.data = empty()
  }
  return cache.data
}

export function get(path, fallback = null) {
  const data = read()
  const parts = String(path).split('.')
  let cur = data
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return fallback
    cur = cur[part]
  }
  return cur === undefined ? fallback : cur
}

export function set(path, value) {
  const data = read()
  const parts = String(path).split('.')
  let cur = data
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {}
    cur = cur[k]
  }
  cur[parts[parts.length - 1]] = value
  prune(data)
  markDirty()
  return value
}

export function del(path) {
  const parts = String(path).split('.')
  const data = read()
  let cur = data
  for (let i = 0; i < parts.length - 1; i++) {
    cur = cur?.[parts[i]]
    if (cur == null) return false
  }
  delete cur[parts[parts.length - 1]]
  markDirty()
  return true
}

function prune(data) {
  if (data.counters && typeof data.counters === 'object') {
    const keys = Object.keys(data.counters)
    if (keys.length > DEFAULTS.maxEntries) {
      for (const k of keys.slice(0, keys.length - DEFAULTS.maxEntries)) delete data.counters[k]
    }
  }
}

export function incr(path, by = 1, ttlMs = 0) {
  const key = ttlMs ? `${path}:${Math.floor(Date.now() / ttlMs)}` : path
  const cur = get(`counters.${key}`, 0) || 0
  const next = cur + by
  set(`counters.${key}`, next)
  return next
}

export function markDirty() {
  cache.dirty = true
  if (cache.timer) return
  cache.timer = setTimeout(() => {
    cache.timer = null
    flush().catch(() => {})
  }, DEFAULTS.flushDelay)
  cache.timer.unref?.()
}

export async function flush({ force = false } = {}) {
  if (cache.writing) {
    cache.pending = true
    return false
  }
  if (!force && !cache.dirty) return false
  const data = cache.data || empty()
  data.at = Date.now()

  cache.writing = true
  try {
    ensureDir()
    const json = JSON.stringify(data, null, 0)
    fs.writeFileSync(TMP, json)
    fs.renameSync(TMP, FILE)
    cache.dirty = false
    return true
  } catch (e) {
    console.error('[state] scrittura fallita:', e?.message || e)
    return false
  } finally {
    cache.writing = false
    if (cache.pending) {
      cache.pending = false
      flush({ force: true }).catch(() => {})
    }
  }
}

export function section(name) {
  return get(`security.${name}`, {}) || {}
}

export function setSection(name, value) {
  return set(`security.${name}`, value)
}

export function stats() {
  const data = read()
  return {
    counters: Object.keys(data.counters || {}).length,
    sections: Object.keys(data.security || {}).length,
    dirty: cache.dirty,
    bytes: (() => {
      try { return fs.statSync(FILE).size } catch { return 0 }
    })()
  }
}

export function reset() {
  cache.data = empty()
  cache.dirty = true
  return flush({ force: true })
}

export function setInterval(fn, ms) {
  const t = globalThis.setInterval(fn, ms)
  return t
}

export default { read, get, set, del, incr, flush, section, setSection, stats, reset, markDirty, setInterval }