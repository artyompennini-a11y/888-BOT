// Plugin by elixir, punisher & 888 staff
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import os from 'os'
import { fileURLToPath } from 'url'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { builtinModules } from 'module'

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(path.join(__dirname, '..', '..'))
const NL = String.fromCharCode(10)

const IGNORE_DIRS = new Set(['node_modules', '.git', 'temp', 'tmp', '.cache', 'data', 'storage', 'media', 'icone', 'img'])
const SKIP_PREFIXES = ['lib/minigames/', 'lib\\minigames\\']
const MAX_DEPTH = 6
const MAX_FILE_BYTES = 800 * 1024
const CONCURRENCY = Math.max(4, Math.min(8, (typeof os.cpus === 'function' ? (os.cpus()?.length || 4) : 4)))

const BUILTIN = new Set([
  ...builtinModules,
  ...builtinModules.map((m) => 'node:' + m),
  'fs/promises', 'stream/promises', 'timers/promises', 'dns/promises',
  'readline/promises', 'util/types', 'path/posix', 'path/win32'
])

const listFiles = (dir, depth = 0, out = [], seen = null) => {
  if (depth > MAX_DEPTH) return out
  seen = seen || new Set()
  let real = ''
  try { real = fs.realpathSync(dir) } catch { real = String(dir) }
  if (seen.has(real)) return out
  seen.add(real)
  let entries = []
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    if (!e || !e.name || (e.name.startsWith('.') && e.name !== '.')) continue
    const full = path.join(dir, e.name)
    let isDir = false
    let isFile = false
    try {
      isDir = e.isDirectory()
      isFile = e.isFile()
      if (!isDir && !isFile) {
        const st = fs.statSync(full)
        isDir = st.isDirectory()
        isFile = st.isFile()
      }
    } catch { continue }
    if (isDir) {
      if (IGNORE_DIRS.has(e.name)) continue
      listFiles(full, depth + 1, out, seen)
    } else if (isFile && /\.(js|mjs|cjs)$/.test(e.name) && !e.name.startsWith('_')) {
      out.push(full)
    }
  }
  return out
}

let DECLARED = null
const pkgName = (spec) => BUILTIN.has(spec) ? spec : (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0])

const loadDeclared = () => {
  if (DECLARED) return DECLARED
  DECLARED = new Set()
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
    const all = Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.devDependencies || {}))
    for (const d of all) {
      DECLARED.add(d)
      if (d.startsWith('@') && d.includes('/')) DECLARED.add(d.split('/')[1])
    }
  } catch {}
  return DECLARED
}

const roots = () => {
  const files = []
  for (const dir of ['plugins', 'lib']) {
    const full = path.join(ROOT, dir)
    if (fs.existsSync(full)) files.push(...listFiles(full))
  }
  for (const f of ['handler.js', '888.js', 'index.js', 'config.js']) {
    const full = path.join(ROOT, f)
    if (fs.existsSync(full)) files.push(full)
  }
  // La libreria vendored di Baileys (migliaia di file generati) falserebbe
  // tempi e report: si esclude dalla scansione statica.
  return [...new Set(files)].filter((f) => {
    const r = rel(f)
    return !SKIP_PREFIXES.some((p) => r === p.slice(0, -1) || r.startsWith(p) || r.startsWith(p.replace(/\//g, '\\')))
  })
}

const safeRel = (f) => {
  try {
    if (!f) return '(sconosciuto)'
    const s = String(f)
    if (path.isAbsolute(s)) {
      const r = path.relative(ROOT, s).replace(/\\/g, '/')
      if (r && !r.startsWith('..')) return r
      return path.basename(s)
    }
    return s.replace(/\\/g, '/')
  } catch { return '(sconosciuto)' }
}
const rel = safeRel

// Su Windows path.join produce backslash, quindi il confronto con
// '/plugins/' era SEMPRE falso: i plugin non venivano neanche analizzati.
const isPluginPath = (f) => rel(f).startsWith('plugins/')
const parseNodeError = (stderr) => {
  const raw = String(stderr || '')
  const out = raw.replace(/\u001b\[[0-9;]*m/g, '')
  let file = null
  let line = null
  const matches = [...out.matchAll(/([A-Za-z]:[^\n]*?|\S[^\n]*?)\.(js|mjs|cjs):(\d+)(?::(\d+))?/g)]
  if (matches.length) {
    const last = matches[matches.length - 1]
    file = (last[1] + '.' + last[2]).trim().replace(/^[( "'“”‘’]+/, '').replace(/[) "'“”‘’;,.]+$/, '')
    line = Number(last[3])
    if (!Number.isFinite(line)) line = null
  } else {
    const alt = out.match(/:(\d+):\d+/)
    if (alt) line = Number(alt[1])
  }
  const lines = out.split(NL).map((l) => l.trim()).filter(Boolean)
  const msg = lines.find((l) => /error/i.test(l) && !/^\s*at\s/.test(l))
    || lines.find((l) => !/^\s*at\s/.test(l) && !/^\^+$/.test(l) && !/^\s*\|\s*$/.test(l))
    || out.split(NL)[0]
    || 'errore sconosciuto'
  const clean = String(msg)
    .replace(/^(SyntaxError|TypeError|ReferenceError|Error)\s*:\s*/i, '')
    .replace(/\s*\(.*:\d+:\d+\)\s*$/, '')
    .trim()
    .slice(0, 400) || 'errore sconosciuto'
  return { file, line, message: clean }
}

// spawnSync lanciava ~400 processi Node in sequenza bloccando l'event loop
// per circa 24 secondi: durante .debug il bot non rispondeva a nulla.
// Qui i controlli girano in parallelo e l'event loop resta libero.

const checkOne = async (file) => {
  let size = 0
  try { size = fs.statSync(file).size } catch { return { file, level: 'warn', message: 'file illeggibile' } }
  if (size > MAX_FILE_BYTES) return { file, level: 'warn', message: 'file troppo grande per l\u2019analisi (' + Math.round(size / 1024) + 'KB)' }
  try {
    await execFileAsync(process.execPath, ['--check', file], {
      timeout: 15000,
      windowsHide: true,
      maxBuffer: 1024 * 1024
    })
    return null
  } catch (e) {
    if (e && (e.killed || e.signal)) {
      return { file, level: 'warn', message: 'timeout nell\u2019analisi (15s)' }
    }
    const code = e && typeof e.code === 'number' ? e.code : null
    // node --check ritorna 1 solo per errore di sintassi; altri codici
    // (per es. file illeggibile) non sono errori reali del plugin.
    if (code !== null && code !== 1) {
      return { file, level: 'warn', message: 'impossibile analizzare (exit ' + code + ')' }
    }
    const err = parseNodeError((e && (e.stderr || e.stdout)) || (e && e.message) || '')
    if (!err.message || /Command failed/i.test(err.message)) {
      return { file, level: 'warn', message: 'impossibile analizzare: ' + (e.message || e) }
    }
    return { file, level: 'error', line: err.line, message: err.message }
  }
}

const syntaxCheckAll = async (files) => {
  const out = new Array(files.length).fill(null)
  if (!files.length) return out
  const queue = files.map((_, i) => i)
  const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, async () => {
    while (queue.length) {
      const i = queue.shift()
      if (i === undefined) return
      try {
        out[i] = await checkOne(files[i])
      } catch (e) {
        out[i] = { file: files[i], level: 'warn', message: 'analisi fallita: ' + (e?.message || e) }
      }
    }
  })
  await Promise.all(workers)
  return out
}
const STRIP_STRINGS = (src) => String(src || '')
  .replace(/`(?:\\.|[^`\\])*`/g, ' `` ')
  .replace(/'(?:\\.|[^'\\\n])*'/g, " '' ")
  .replace(/"(?:\\.|[^"\\\n])*"/g, ' "" ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:/])\/\/[^\n]*/g, '$1 ')

const analyse = (file, src) => {
  const issues = []
  // Per i controlli strutturali si guarda il sorgente grezzo: i plugin
  // offuscati usano handler['command'] e le stringhe verrebbero cancellate.
  const raw = String(src || '')
  // serve per i controlli che devono ignorare i falsi positivi
  // dentro stringhe e commenti (require/process.exit)
  const code = STRIP_STRINGS(raw)
  const add = (level, message, fix) => issues.push({ file, level, message, fix })

  const isPlugin = isPluginPath(file)

  if (isPlugin) {
    const codeNoComments = String(code || '')
    const exportsSomething =
      /export\s+default\b/.test(codeNoComments) ||
      /export\s*\{[^}]*\bdefault\b/.test(raw) ||
      /export\s+(async\s+)?function\b/.test(codeNoComments) ||
      /export\s+const\b/.test(codeNoComments) ||
      /export\s+class\b/.test(codeNoComments) ||
      /export\s+async\s+function\b/.test(codeNoComments)
    if (!exportsSomething) {
      // File senza export: NON e' un plugin valido. Il loader fa
      // global.plugins[x] = module.default || module, quindi un file senza
      // export carica un namespace vuoto e puo rompere il dispatch.
      // Ma alcuni file in plugins/ sono snippet/dati (es. fun-minigiochi.js):
      // se il file non sembra un handler, resta un warn e non un error.
      const looksLikeHandler = /handler|conn|m\.reply|usedPrefix|command/i.test(raw.slice(0, 4000))
      add(looksLikeHandler ? 'error' : 'warn', 'nessun export: il file non puo funzionare come plugin (spostalo fuori da plugins/ se e uno snippet)')
    }

    // Riconosce handler.command = ... e handler['command'] = ... (offuscati).
    // Basta il punto davanti: "recommend =" non ha il punto quindi e' escluso.
    const hasCommand = /\.\s*command\s*=/.test(codeNoComments) ||
      /\[\s*['"]command['"]\s*\]\s*=/.test(raw)
    const hasHook = /\.\s*(before|after|all)\s*=/.test(codeNoComments) ||
      /\[\s*['"](before|after|all)['"]\s*\]\s*=/.test(raw) ||
      /export\s+(async\s+)?function\s+(before|after|all)\b/.test(codeNoComments) ||
      /\.\s*ev\s*\.\s*on\s*\(/.test(codeNoComments) ||
      /\bconn\s*\.\s*ev\s*\.\s*on\s*\(/.test(codeNoComments)

    // Un export default che non e' un handler e' un helper: non serve un command.
    // Prima bastava "export default function" per essere helper, quindi i
    // plugin anonimi (export default async (m, {...}) => ...) venivano saltati.
    const defaultMatch = codeNoComments.match(/export\s+default\s+([^\n;({]*)/)
    const defHead = (defaultMatch ? defaultMatch[1] : '').trim()
    const isAnonymousHandler = /^async\s*\(/.test(defHead) || /^\(/.test(defHead) || defHead === '' || /^(async\s+)?\([^)]*\)\s*=>/.test(defHead)
    const isHelper = (!isAnonymousHandler && (
      /^[A-Z_$]/.test(defHead) ||
      /^(async\s+)?function\b/.test(defHead) ||
      /^class\b/.test(defHead) ||
      /^\{/.test(defHead) ||
      /^\[/.test(defHead) ||
      /^[0-9'"]/.test(defHead)
    )) || /export\s+default\s*\{/.test(codeNoComments)

    if (exportsSomething && !isHelper && !hasCommand && !hasHook) {
      add('warn', 'nessun command e nessun hook: probabilmente non verra mai eseguito')
    }

    if (hasCommand) {
      const firstImport = code.search(/^\s*import\b/m)
      const cmdPos = codeNoComments.search(/\.\s*command\s*=/)
      if (firstImport > -1 && cmdPos > -1 && cmdPos < firstImport) {
        add('warn', 'handler.command appare prima di qualsiasi import')
      }
    }
  }

  const isCore = /^(handler|888|main|index|config)\.js$/.test(path.basename(String(file || '')))
  if (!isCore && /\brequire\s*\(/.test(code) && /^\s*import\b/m.test(code)) {
    add('warn', 'usa require e import insieme: probabilmente un refuso')
  }

  if (/\bprocess\.exit\s*\(/.test(code) && !/restart|offusca|shutdown|debug/i.test(String(file || ''))) {
    add('warn', 'chiama process.exit: puo spegnere tutto il bot')
  }

  return issues
}
const IMPORT_RE = /(?:^|[;\n}])\s*import\s+(?:[^'";]*?from\s+)?['"]([^'"]+)['"]/g
const REQUIRE_RE = /(^|[^\w$.])require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
const DYNAMIC_IMPORT_RE = /(^|[^\w$.])import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
const nodeModulesExists = () => {
  try { return fs.existsSync(path.join(ROOT, 'node_modules')) } catch { return false }
}
const hasNodeModules = nodeModulesExists()
const checkOneSpec = (file, spec, issues, seen) => {
  const key = spec
  if (seen.has(key)) return
  seen.add(key)
  if (!spec || spec.startsWith('data:') || spec.startsWith('http://') || spec.startsWith('https://')) return
  if (spec.startsWith('.')) {
    const base = path.resolve(path.dirname(file), spec)
    const cands = [base, base + '.js', base + '.mjs', base + '.cjs', base + '.json', path.join(base, 'index.js')]
    if (!cands.some((c) => { try { return fs.existsSync(c) } catch { return false } })) {
      issues.push({ file, level: 'error', message: "import non risolto: '" + spec + "'" })
    }
    return
  }
  if (BUILTIN.has(spec) || spec.startsWith('node:') || spec === '@whiskeysockets/baileys' || spec.startsWith('@whiskeysockets/baileys/')) return
  if (!hasNodeModules) return
  const top = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
  let ok = false
  try {
    ok = fs.existsSync(path.join(ROOT, 'node_modules', top)) ||
      fs.existsSync(path.join(ROOT, 'node_modules', spec)) ||
      fs.existsSync(path.join(ROOT, 'node_modules', spec + '.js'))
  } catch { ok = false }
  const declared = loadDeclared().has(top) || loadDeclared().has(spec)
  if (!ok && !declared) {
    issues.push({ file, level: 'warn', message: "pacchetto non installato e non in package.json: '" + spec + "'" })
  } else if (!ok && declared) {
    issues.push({ file, level: 'warn', message: "pacchetto dichiarato in package.json ma non installato: '" + spec + "' (npm install?)" })
  }
}
const checkImports = (file, src) => {
  const issues = []
  const text = STRIP_STRINGS(String(src || ''))
  const seen = new Set()
  let m
  IMPORT_RE.lastIndex = 0
  while ((m = IMPORT_RE.exec(text)) !== null) checkOneSpec(file, m[1], issues, seen)
  REQUIRE_RE.lastIndex = 0
  while ((m = REQUIRE_RE.exec(text)) !== null) checkOneSpec(file, m[2], issues, seen)
  DYNAMIC_IMPORT_RE.lastIndex = 0
  while ((m = DYNAMIC_IMPORT_RE.exec(text)) !== null) checkOneSpec(file, m[2], issues, seen)
  return issues
}

// Estrae i nomi dei comandi sia da array/stringhe sia da RegExp.
// Prima leggeva solo le stringhe quotate: tutti i comandi /^(x)$/i
// (la maggior parte dei plugin) risultavano invisibili.
const extractBalanced = (src, startIdx) => {
  let i = startIdx
  let depth = 0
  let inS = null
  let inLine = false
  let inBlock = false
  for (; i < src.length; i++) {
    const c = src[i]
    const n = src[i + 1]
    if (inLine) { if (c === '\n') inLine = false; continue }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++ } continue }
    if (inS) {
      if (c === '\\') { i++; continue }
      if (c === inS) inS = null
      continue
    }
    if (c === '/' && n === '/') { inLine = true; i++; continue }
    if (c === '/' && n === '*') { inBlock = true; i++; continue }
    if (c === "'" || c === '"' || c === '`') { inS = c; continue }
    if (c === '[') depth++
    else if (c === ']') {
      depth--
      if (depth === 0) return src.slice(startIdx, i + 1)
    }
  }
  return src.slice(startIdx, Math.min(src.length, startIdx + 2000))
}
const commandNames = (src) => {
  const text = String(src || '')
  const m = text.match(/\.\s*command\s*=\s*/)
  if (!m) {
    const alt = text.match(/\[\s*['"]command['"]\s*\]\s*=\s*([\s\S]{1,2000})/)
    if (!alt) return []
    return namesFromExpr(alt[1])
  }
  const eq = m.index + m[0].length
  let raw = text.slice(eq, eq + 2000)
  const t = raw.trimStart()
  let expr = raw
  if (t.startsWith('[')) {
    const off = raw.indexOf('[')
    expr = extractBalanced(raw, off)
  } else {
    const line = raw.split('\n')[0]
    expr = line.split(';')[0]
  }
  return namesFromExpr(expr)
}
const namesFromExpr = (expr) => {
  const raw = String(expr || '').slice(0, 2000)
  const names = new Set()
  for (const mm of raw.matchAll(/['"]([a-zA-Z0-9_]+)['"]/g)) names.add(mm[1].toLowerCase())
  for (const mm of raw.matchAll(/\/((?:\\.|[^/\\]){1,200})\/[gimsuy]*/g)) {
    const body = mm[1]
    if (/[.?*+{}\\]/.test(body.replace(/\([^()]*\)/g, '')) && !/\([^()]*\|[^()]*\)/.test(body)) continue
    for (const alt of body.matchAll(/\(([^()]*)\)/g)) {
      for (const name of alt[1].split('|')) {
        const clean = name.trim().replace(/^\^/, '').replace(/\$$/, '').replace(/[?+*].*$/, '')
        if (/^[a-zA-Z0-9_]{1,40}$/.test(clean)) names.add(clean.toLowerCase())
      }
    }
    if (!names.size) {
      const plain = body.replace(/^\^/, '').replace(/\$$/, '')
      if (/^[a-zA-Z0-9_]{1,40}$/.test(plain)) names.add(plain.toLowerCase())
    }
  }
  return [...names]
}

const duplicateCommands = (files) => {
  const map = new Map()
  for (const f of files) {
    if (!isPluginPath(f)) continue
    let src = ''
    try { src = fs.readFileSync(f, 'utf8') } catch { continue }
    for (const n of commandNames(src)) {
      if (!map.has(n)) map.set(n, [])
      map.get(n).push(f)
    }
  }
  const out = []
  for (const [name, owners] of map) {
    const uniq = [...new Set(owners)]
    if (uniq.length > 1) {
      out.push({ level: 'warn', message: 'comando "' + name + '" in ' + uniq.length + ' plugin: ' + uniq.map(f => path.basename(f)).join(', ') })
    }
  }
  return out
}
const CACHE = { sig: null, data: null }

// Prima usava la lunghezza della stringa: due mtime diversi producevano
// la stessa "firma", quindi la cache restava valida dopo una modifica.
const signature = (files) =>
  crypto.createHash('sha1')
    .update(files.map((f) => {
      let st = ''
      try {
        const s = fs.statSync(f)
        st = s.mtimeMs + ':' + s.size
      } catch {}
      return f + '=' + st
    }).join('|'))
    .digest('hex')

const runScan = async (useCache = true) => {
  const files = roots()
  const sig = signature(files)
  if (useCache && CACHE.sig === sig && CACHE.data) {
    return { ...CACHE.data, files: [...CACHE.data.files], errors: [...CACHE.data.errors], warnings: [...CACHE.data.warnings], cached: true }
  }

  const errors = []
  const warnings = []

  const syntax = await syntaxCheckAll(files)

  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    const e = syntax[i]
    if (e) {
      ;(e.level === 'error' ? errors : warnings).push(e)
      continue
    }
    let src = ''
    try {
      const st = fs.statSync(f)
      if (!st.isFile() || st.size > MAX_FILE_BYTES) {
        if (st.size > MAX_FILE_BYTES) warnings.push({ file: f, level: 'warn', message: 'file troppo grande per l\u2019analisi statica' })
        continue
      }
      src = fs.readFileSync(f, 'utf8')
    } catch { continue }
    for (const i2 of analyse(f, src)) (i2.level === 'error' ? errors : warnings).push(i2)
    for (const i2 of checkImports(f, src)) (i2.level === 'error' ? errors : warnings).push(i2)
  }

  for (const d of duplicateCommands(files)) warnings.push(d)
  const data = { files, errors, warnings, cached: false }
  CACHE.sig = sig
  CACHE.data = { files: [...files], errors: [...errors], warnings: [...warnings] }
  return data
}

const MAX_WA = 3500
const chunkForWA = (text) => {
  const t = String(text || '')
  if (t.length <= MAX_WA) return [t]
  const parts = []
  let rest = t
  while (rest.length > MAX_WA) {
    let cut = rest.lastIndexOf(NL, MAX_WA)
    if (cut < MAX_WA * 0.5) cut = MAX_WA
    parts.push(rest.slice(0, cut))
    rest = rest.slice(cut).replace(/^\n+/, '')
  }
  if (rest) parts.push(rest)
  return parts
}
const renderReport = ({ files, errors, warnings, cached }, ms) => {
  const L = []
  L.push('*DEBUG 888*' + (cached ? ' (cache)' : ''))
  L.push('')
  L.push('File analizzati: ' + files.length)
  L.push('Errori reali: ' + errors.length)
  L.push('Avvisi: ' + warnings.length)
  L.push('Tempo: ' + ms + 'ms')
  L.push('')
  if (!errors.length && !warnings.length) {
    L.push('Nessun problema rilevato.')
    return L.join(NL)
  }
  if (errors.length) {
    L.push('*ERRORI:*')
    for (const e of errors.slice(0, 25)) {
      L.push(' - ' + rel(e.file) + (Number.isFinite(e.line) && e.line ? ':' + e.line : '') + ' -> ' + e.message)
    }
    if (errors.length > 25) L.push(' ...e altri ' + (errors.length - 25))
    L.push('')
  }
  if (warnings.length) {
    L.push('*AVVISI:*')
    for (const w of warnings.slice(0, 20)) {
      L.push(' - ' + (w.file ? rel(w.file) + ' -> ' : '') + w.message)
    }
    if (warnings.length > 20) L.push(' ...e altri ' + (warnings.length - 20))
  }
  return L.join(NL)
}
const AI_SYSTEM = [
  'Sei un revisore di codice JavaScript esperto.',
  'Ricevi il contenuto di UN file di plugin di un bot WhatsApp (Baileys).',
  'Analizzalo e segnala SOLO problemi reali e verificabili.',
  'Non segnalare stile, formattazione o preferenze personali.',
  'Non inventare problemi: se il codice e corretto, rispondi OK',
  '',
  'Rispondi in JSON valido con questa forma:',
  '{"ok":true,"problemi":[{"riga":12,"tipo":"bug","descrizione":"...","correzione":"..."}]}',
  'Se non ci sono problemi: {"ok":true,"problemi":[]}'
].join(NL)

const extractJSON = (text) => {
  const t = String(text || '')
  const start = t.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inS = null
  for (let i = start; i < t.length; i++) {
    const c = t[i]
    if (inS) {
      if (c === '\\') { i++; continue }
      if (c === inS) inS = null
      continue
    }
    if (c === '"' || c === "'") { inS = c; continue }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        try { return JSON.parse(t.slice(start, i + 1)) } catch { return null }
      }
    }
  }
  return null
}
const lazyAI = async () => {
  try {
    const mod = await import('../../lib/ai.js')
    return mod.default || mod
  } catch (e) {
    throw new Error('modulo IA non disponibile')
  }
}
const askAI = async (code) => {
  const ai = await lazyAI()
  const res = await ai.ask(
    [
      { role: 'system', content: AI_SYSTEM },
      { role: 'user', content: code }
    ],
    { maxTokens: 1200, temperature: 0.1 }
  )
  const text = res && typeof res.text === 'string' ? res.text : ''
  if (/^\s*OK\s*$/i.test(text.trim())) return { ok: true, problemi: [] }
  const parsed = extractJSON(text)
  if (!parsed || typeof parsed !== 'object') throw new Error('no-JSON')
  if (!Array.isArray(parsed.problemi)) parsed.problemi = []
  parsed.problemi = parsed.problemi.filter((p) => p && typeof p === 'object').slice(0, 20)
  return parsed
}

const safeErr = (e) => {
  try { return String(e?.message || e || 'errore').slice(0, 500) } catch { return 'errore' }
}
const handler = async (m, { args, usedPrefix } = {}) => {
  try {
    const sub = String(args?.[0] || '').toLowerCase().trim()

  if (sub === 'api' || sub === 'provider') {
    let av = []
    try { av = (await lazyAI()).available() } catch (e) { return m.reply('IA non disponibile: ' + safeErr(e)) }
    if (!av.length) {
      return m.reply('Nessuna API IA configurata. Inserisci groq, gemini o openrouter in config.js.')
    }
    const lines = av.map(p =>
      p.name + ' (' + p.id + ')' + NL + '  modelli: ' + (p.models || []).slice(0, 3).join(', ')
    )
    return m.reply('API IA DISPONIBILI' + NL + NL + lines.join(NL + NL))
  }

  if (sub === 'ia' || sub === 'ai') {
    let aiMod = null
    try { aiMod = await lazyAI() } catch (e) { return m.reply('IA non disponibile: ' + safeErr(e)) }
    let av = []
    try { av = aiMod.available() } catch { av = [] }
    if (!av.length) {
      return m.reply('Nessuna API IA configurata. Usa ' + usedPrefix + 'debug api.')
    }
    const target = String(args?.[1] || '').trim().replace(/^["']|["']$/g, '')
    if (!target) {
      return m.reply('Specifica il file, es. ' + usedPrefix + 'debug ia plugins/tools/ping.js')
    }
    if (/[<>|&$`]/.test(target)) return m.reply('Percorso non valido.')
    const norm = String(target).split(/[\\/]/).join('/')
    if (norm.split('/').includes('..')) return m.reply('Percorso non valido.')
    const file = path.isAbsolute(target) ? path.normalize(target) : path.normalize(path.join(ROOT, target))
    if (!file.startsWith(ROOT + path.sep) && file !== ROOT) return m.reply('Resta dentro il bot.')
    let stat = null
    try { stat = fs.statSync(file) } catch { stat = null }
    if (!stat || !stat.isFile()) return m.reply('File non trovato: ' + target)
    if (!/\.(js|mjs|cjs)$/.test(file)) return m.reply('Solo file .js.')
    if (stat.size > MAX_FILE_BYTES) return m.reply('File troppo grande.')
    let code = ''
    try { code = fs.readFileSync(file, 'utf8') } catch (e) { return m.reply('Lettura fallita: ' + safeErr(e)) }
    if (code.length > 18000) code = code.slice(0, 18000) + NL + '// ...troncato'

    await m.reply('Analisi IA in corso...')
    try {
      const r = await askAI(code)
      if (r.ok && (!r.problemi || !r.problemi.length)) {
        return m.reply('IA: nessun problema in ' + rel(file))
      }
      const probs = Array.isArray(r.problemi) ? r.problemi : []
      const L = ['IA: ' + probs.length + ' problema/i in ' + rel(file), '']
      probs.slice(0, 12).forEach(p => {
        L.push(' Riga ' + (p.riga || '?') + ' [' + (p.tipo || 'bug') + ']')
        L.push('  ' + (p.descrizione || ''))
        if (p.correzione) L.push('  -> ' + p.correzione)
        L.push('')
      })
      const out = L.join(NL)
      for (const part of chunkForWA(out)) await m.reply(part)
      return
    } catch (e) {
      return m.reply('Analisi IA fallita: ' + safeErr(e))
    }
  }

  // 'forza'/'refresh' scarta la cache: senza, dopo aver corretto un file
  // il report continuava a mostrare il vecchio risultato.
  const rest = Array.isArray(args) ? args.slice(1) : []
  const wantsRefresh = sub === 'forza' || sub === 'refresh' ||
    rest.some(a => /^(forza|refresh|nocache|reload)$/i.test(String(a || '').trim()))

  const t0 = Date.now()
  let result = null
  try { result = await runScan(!wantsRefresh) } catch (e) { return m.reply('Scan fallita: ' + safeErr(e)) }
  const report = renderReport(result, Date.now() - t0)
  for (const part of chunkForWA(report)) await m.reply(part)
  if (result.errors.length) {
    const detail = result.errors.slice(0, 5).map(e =>
      '*DEBUG 888*' + NL + rel(e.file) + NL + e.message
    ).join(NL + NL)
    for (const part of chunkForWA(detail)) await m.reply(part)
  }
  } catch (e) {
    try { await m.reply('Debug fallito: ' + safeErr(e)) } catch {}
  }
}

handler.help = ['debug', 'debug forza', 'debug ia <file>', 'debug api']
handler.tags = ['tools']
handler.command = /^debug$/i
handler.owner = true

export { runScan, renderReport }
export default handler