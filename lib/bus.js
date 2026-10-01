// Plugin by elixir, punisher & 888 staff

const DEFAULTS = {
  timeout: 2000,
  failureThreshold: 3,
  cooldown: 60000
}

const stats = new Map()

const now = () => Date.now()

const keyOf = (name) => String(name)

const getStat = (name) => {
  if (!stats.has(keyOf(name))) {
    stats.set(keyOf(name), { calls: 0, errors: 0, timeouts: 0, fails: 0, openedAt: 0, totalMs: 0 })
  }
  return stats.get(keyOf(name))
}

const isOpen = (name) => {
  const s = stats.get(keyOf(name))
  if (!s || !s.openedAt) return false
  if (now() - s.openedAt >= DEFAULTS.cooldown) {
    s.openedAt = 0
    s.fails = 0
    return false
  }
  return true
}

export function circuitOpen(name) {
  return isOpen(name)
}

function recordSuccess(name, ms) {
  const s = getStat(name)
  s.calls++
  s.totalMs += ms
  s.fails = 0
}

function recordFailure(name, kind) {
  const s = getStat(name)
  s.calls++
  if (kind === 'timeout') s.timeouts++
  else s.errors++
  s.fails++
  if (s.fails >= DEFAULTS.failureThreshold) {
    s.openedAt = now()
    console.error(`[bus] CIRCUITO APERTO per "${name}" dopo ${s.fails} errori. Pausa ${Math.round(DEFAULTS.cooldown / 1000)}s.`)
  }
}

export function withTimeout(promise, ms, name = 'anonymous') {
  let timer
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`timeout dopo ${ms}ms`)
      err.code = 'BUS_TIMEOUT'
      reject(err)
    }, ms)
    if (timer.unref) timer.unref()
  })
  return Promise.race([Promise.resolve(promise), guard]).finally(() => clearTimeout(timer))
}

export function busStats() {
  return [...stats.entries()].map(([name, s]) => ({
    name,
    calls: s.calls,
    errors: s.errors,
    timeouts: s.timeouts,
    fails: s.fails,
    open: Boolean(s.openedAt),
    avgMs: s.calls ? +(s.totalMs / s.calls).toFixed(1) : 0
  }))
}

export function busReset() {
  stats.clear()
}

export function busWorst(limit = 10) {
  return busStats()
    .filter(s => s.calls > 0)
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, limit)
}

export async function runGuarded(name, fn, { timeout = DEFAULTS.timeout } = {}) {
  if (isOpen(name)) return { status: 'open' }
  const started = Date.now()
  try {
    const value = await withTimeout(fn(), timeout, name)
    recordSuccess(name, Date.now() - started)
    return { status: 'ok', value }
  } catch (e) {
    recordFailure(name, e?.code === 'BUS_TIMEOUT' ? 'timeout' : 'error')
    if (e?.code !== 'BUS_TIMEOUT') {
      console.error(`[bus] errore in "${name}":`, e?.message || e)
    }
    return { status: e?.code === 'BUS_TIMEOUT' ? 'timeout' : 'error', error: e }
  }
}

export async function runAllGuarded(entries, { timeout = DEFAULTS.timeout } = {}) {
  const started = Date.now()
  const results = await Promise.all(
    entries.map(([name, fn]) => runGuarded(name, fn, { timeout }))
  )
  return { results, ms: Date.now() - started }
}

export async function runBeforeAll(entries, { timeout = 500 } = {}) {
  const results = await Promise.all(
    entries.map(([name, fn]) => runGuarded(name, fn, { timeout }))
  )
  let blocked = false
  let by = null
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'ok' && results[i].value) {
      blocked = true
      if (!by) by = entries[i][0]
    }
  }
  return { blocked, by, results }
}

export { DEFAULTS }