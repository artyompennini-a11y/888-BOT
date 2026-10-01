// Plugin by elixir, punisher & 888 staff
import { busStats, busWorst, busReset, DEFAULTS } from '../../lib/bus.js'
import state from '../../lib/state.js'

const handler = async (m, { usedPrefix, args }) => {
  const sub = (args?.[0] || '').toLowerCase()

  if (sub === 'reset') {
    busReset()
    return m.reply('🧹 Statistiche del bus azzerate.')
  }

  if (sub === 'state' || sub === 'stato') {
    const s = state.stats()
    return m.reply(
`💾 *STATO PERSISTENTE*

🔑 Contatori: *${s.counters}*
🛡️ Sezioni di sicurezza: *${s.sections}*
📦 Dimensione: *${s.bytes}* byte
${s.dirty ? '⚠️ Ci sono modifiche non ancora scritte su disco.' : '✅ Tutto scritto su disco.'}

_Il file viene salvato in data/state.json._`
    )
  }

  const all = busStats()
  const worst = busWorst(12)
  const timeouts = all.reduce((a, s) => a + s.timeouts, 0)
  const errors = all.reduce((a, s) => a + s.errors, 0)
  const open = all.filter(s => s.open)

  if (!all.length) {
    return m.reply(
`🚌 *BUS 888*

Nessun plugin ancora eseguito attraverso il bus.

⏱️ Timeout hook: *${DEFAULTS.timeout}ms*
⏱️ Timeout comandi: *${global.busCommandTimeout ?? 30000}ms*
🔌 Soglia circuit breaker: *${DEFAULTS.failureThreshold}* errori`
    )
  }

  const lines = worst.map(s => {
    const badge = s.open ? '🔴' : s.timeouts > 0 ? '🟡' : '🟢'
    const flags = [
      s.timeouts ? `${s.timeouts} timeout` : '',
      s.errors ? `${s.errors} errori` : '',
      s.open ? 'CIRCUITO APERTO' : ''
    ].filter(Boolean).join(' · ')
    return `${badge} \`${s.name}\` — media *${s.avgMs}ms* (${s.calls}x)${flags ? '\n   ' + flags : ''}`
  })

  return m.reply(
`🚌 *BUS 888*

📈 Plugin monitorati: *${all.length}*
⏱️ Timeout totali: *${timeouts}*
❌ Errori totali: *${errors}*
🔴 Circuiti aperti: *${open.length}*

${lines.join('\n')}

_Comandi:_
${usedPrefix}busstat state — stato persistente
${usedPrefix}busstat reset — azzera statistiche`
  )
}

handler.help = ['busstat', 'busstat state']
handler.tags = ['tools']
handler.command = /^busstat$/i
handler.owner = true

export default handler