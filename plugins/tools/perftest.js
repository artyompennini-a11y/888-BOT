// Plugin by elixir, punisher & 888 staff
import { performance } from 'perf_hooks'

const records = []
const MAX = 200

const percentile = (arr, p) => {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

const fmt = (ms) => `${ms.toFixed(1)}ms`

const record = (name, ms) => {
  records.push({ name: String(name || 'sconosciuto').slice(0, 40), ms })
  if (records.length > MAX) records.shift()
}

const slowBadge = (ms, budget) => {
  if (ms > budget * 3) return '\u{1F534}'
  if (ms > budget) return '\u{1F7E1}'
  return '\u{1F7E2}'
}

const handler = async (m, { conn, usedPrefix, command, args }) => {
  const sub = String(args?.[0] || '').toLowerCase()

  if (sub === 'reset') {
    records.length = 0
    return m.reply('\u{1F5D1} *PERFTEST*\n\n\u{1F7E2} Cronologia azzerata.')
  }

  if (sub === 'watch' || sub === 'watching') {
    if (!global.__perfWatch) {
      global.__perfWatch = true
      return m.reply(`\u{1F3AF} *PERFTEST*\n\n\u{1F7E2} Modalità attiva: da ora misuro ogni handler.\n\nUsa *${usedPrefix}perftest risultati* per vedere i dati.`)
    }
    global.__perfWatch = false
    return m.reply('\u{1F6D1} *PERFTEST*\n\nMisurazione disattivata.')
  }

  if (!records.length) {
    return m.reply(
`\u{1F3AF} *PERFTEST 888*

Nessuna misurazione ancora.

\u{1F4D6} Misura automatica: *${usedPrefix}perftest watch*
\u{1F4CB} Risultati: *${usedPrefix}perftest risultati*
\u{1F7E2} Azzera: *${usedPrefix}perftest reset*

_\u{1F4A1} Suggerimento: se un comando e lento, il colpevole e spesso la lettura di rete o un'immagine pesante._`
    )
  }

  const byName = new Map()
  for (const r of records) {
    if (!byName.has(r.name)) byName.set(r.name, [])
    byName.get(r.name).push(r.ms)
  }

  const rows = [...byName.entries()]
    .map(([name, arr]) => ({
      name,
      count: arr.length,
      avg: arr.reduce((a, b) => a + b, 0) / arr.length,
      p95: percentile(arr, 95),
      max: Math.max(...arr)
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 20)

  const lines = rows.map(r => {
    const badge = slowBadge(r.avg, 500)
    return `${badge} \`${r.name}\`\n   media ${fmt(r.avg)} · p95 ${fmt(r.p95)} · max ${fmt(r.max)} · ${r.count}x`
  })

  const slowest = rows[0]

  return m.reply(
`\u{1F3AF} *PERFTEST 888*

\u{1F4CA} Misurazioni: *${records.length}*
\u{1F6E0} Comandi distinti: *${byName.size}*

${lines.join('\n')}

${slowest ? `\u{1F4A3} *Più lento:* \`${slowest.name}\` a ${fmt(slowest.avg)} in media` : ''}`
  )
}

handler.before = async function (m) {
  if (!global.__perfWatch) return
  if (m?.fromMe || !m?.text) return
  const name = String(m.text).replace(/^[.!/#]+/, '').split(/\s+/)[0]?.toLowerCase()
  if (!name) return
  m.__perfName = name
  m.__perfAt = performance.now()
}

handler.after = async function (m) {
  if (!global.__perfWatch) return
  if (!m?.__perfName) return
  record(m.__perfName, performance.now() - m.__perfAt)
  delete m.__perfName
  delete m.__perfAt
}

handler.help = ['perftest', 'perftest watch', 'perftest risultati']
handler.tags = ['tools']
handler.command = /^perftest$/i
handler.owner = true

export default handler