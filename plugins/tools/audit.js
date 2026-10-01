// Plugin by elixir, punisher & 888 staff
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const PLUGINS = path.join(ROOT, 'plugins')

const severityBadge = (level) => {
  if (level === 'error') return '\u{1F534}'
  if (level === 'warn') return '\u{1F7E1}'
  return '\u{1F7E2}'
}

const walk = (dir) => {
  const out = []
  let entries = []
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.startsWith('_')) out.push(full)
  }
  return out
}

const collectIssues = () => {
  const issues = []
  const seenCommands = new Map()
  const files = walk(PLUGINS)

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/')
    let src = ''
    try { src = fs.readFileSync(file, 'utf8') } catch { continue }

    const isHelper = !/export\s+(default\s+|async\s+function\s+|function\s+|const\s+|class\s+|let\s+)/.test(src) ||
      /^\s*export\s+default\s+[A-Z_$]/m.test(src) ||
      /^\s*const\s+[A-Z_$][\w$]*\s*=\s*\[/m.test(src) ||
      /export\s+async\s+function\s+\w+/.test(src)

    const isObfuscated = /_0x[0-9a-f]{4,}/i.test(src)

    const hasCommand = /handler\.command\s*=/.test(src) ||
      /\.command\s*=/.test(src) ||
      /handler\[[^\]]+\]\s*=\s*(\[|\/)/.test(src)

    const hasHook = /handler\.(before|after|all)\s*=/.test(src) ||
      /export\s+(async function|const|function)\s+(before|after|all)\b/.test(src) ||
      /export\s+async\s+function\s+all\b/.test(src) ||
      /global\.conn\??\.ev\??\.on\s*\(/.test(src) ||
      /conn\.ev\.on\s*\(/.test(src)

    if (isHelper) {
      issues.push({ file: rel, level: 'ok', msg: 'modulo helper (nessun comando)' })
      continue
    }

    if (isObfuscated) {
      issues.push({ file: rel, level: 'ok', msg: 'offuscato: analisi statica non applicabile' })
      continue
    }

    if (!hasCommand && !hasHook) {
      issues.push({ file: rel, level: 'error', msg: 'nessun comando e nessun hook: mai eseguito' })
    } else if (!hasCommand && hasHook) {
      issues.push({ file: rel, level: 'ok', msg: 'solo hook (nessun comando)' })
    }

    if (!/handler\.help\s*=/.test(src)) {
      issues.push({ file: rel, level: 'warn', msg: 'manca handler.help (nessuna voce nei menu)' })
    }
    if (!/handler\.tags\s*=/.test(src)) {
      issues.push({ file: rel, level: 'warn', msg: 'manca handler.tags' })
    }

    const cmd = src.match(/handler\.command\s*=\s*(.+)/)
    if (cmd) {
      const raw = cmd[1]
      const names = [...raw.matchAll(/['"]([a-zA-Z0-9_]+)['"]/g)].map(x => x[1].toLowerCase())
      for (const n of names) {
        if (!seenCommands.has(n)) seenCommands.set(n, [])
        seenCommands.get(n).push(rel)
      }
    }
  }

  for (const [name, owners] of seenCommands) {
    if (owners.length > 1) {
      issues.push({
        file: owners[0],
        level: 'warn',
        msg: `comando "${name}" duplicato in ${owners.length} plugin: ${owners.join(', ')}`
      })
    }
  }

  return { issues, total: files.length }
}

const handler = async (m) => {
  const { issues, total } = collectIssues()
  const errors = issues.filter(i => i.level === 'error')
  const warns = issues.filter(i => i.level === 'warn')

  const lines = issues
    .filter(i => i.level !== 'ok')
    .slice(0, 40)
    .map(i => `${severityBadge(i.level)} \`${i.file}\`\n   ${i.msg}`)

  const extra = issues.filter(i => i.level !== 'ok').length > 40
    ? `\n\n\u{1F4CB} ...e altre ${issues.filter(i => i.level !== 'ok').length - 40}`
    : ''

  const text = `🔍 *AUDIT 888*

\u{1F4CB} Plugin analizzati: *${total}*
\u{1F534} Problemi gravi: *${errors.length}*
\u{1F7E1} Avvisi: *${warns.length}*
\u{1F7E2} Corretti: *${issues.filter(i => i.level === 'ok').length}*

${lines.join('\n')}${extra}

_\u{1F3AF} Obiettivo: zero \u{1F534} e pochi \u{1F7E1}._`

  if (!lines.length) {
    return m.reply(`✅ *AUDIT 888*\n\n\u{1F4CB} Plugin analizzati: *${total}*\n\u{1F7E2} Nessun problema rilevato.`)
  }

  return m.reply(text)
}

handler.help = ['audit']
handler.tags = ['tools']
handler.command = /^audit$/i
handler.owner = true

export default handler