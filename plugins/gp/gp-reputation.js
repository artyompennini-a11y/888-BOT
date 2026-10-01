// Plugin by elixir, punisher & 888 staff

const TIERS = [
  { min: 200, name: 'Leggenda', badge: '\u{1F451}' },
  { min: 100, name: 'Veterano', badge: '\u{1F3C6}' },
  { min: 50, name: 'Contribuente', badge: '\u{1F4AA}' },
  { min: 20, name: 'Attivo', badge: '\u{1F4C8}' },
  { min: 5, name: 'Nuovo', badge: '\u{1F311}' },
  { min: 0, name: 'Principiante', badge: '\u{1F331}' }
]

const BADGE = { warn: '-5', mute: '-10', ban: '-30' }

const repStore = () => {
  global.db.data.reputation ??= {}
  return global.db.data.reputation
}

const tierOf = (score) => TIERS.find(t => score >= t.min) || TIERS[TIERS.length - 1]

const handler = async (m, { conn, text, usedPrefix }) => {
  const store = repStore()
  const target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)
  const who = target || m.sender
  const rec = store[who] ??= { score: 0, warns: 0, helps: 0, msgs: 0, at: Date.now() }

  if (!target) rec.msgs = (rec.msgs || 0) + 1

  const tier = tierOf(rec.score)

  if (target) {
    return m.reply(
`⭐ *REPUTAZIONE*

👤 Utente: @${who.split('@')[0]}
📊 Punteggio: *${rec.score}* ${tier.badge} *${tier.name}*

💬 Messaggi: ${rec.msgs || 0}
⚠️ Warn: ${rec.warns || 0}
🤝 Aiuti: ${rec.helps || 0}

_Il punteggio cambia con azioni dello staff._`,
      { mentions: [who] }
    )
  }

  const top = Object.entries(store)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10)

  const mine = `${tier.badge} Il tuo punteggio: *${rec.score}* (${tier.name})`

  if (!top.length) {
    return m.reply(`⭐ *REPUTAZIONE*\n\n${mine}\n\n_Ancora nessun punteggio registrato._`)
  }

  const lines = top.map(([jid, r], i) => {
    const t = tierOf(r.score)
    return `${i + 1}. ${t.badge} @${jid.split('@')[0]} — *${r.score}* (${t.name})`
  })

  return m.reply(`⭐ *CLASSIFICA REPUTAZIONE*\n\n${lines.join('\n')}\n\n${mine}\n\nConsulta: *${usedPrefix}reputation @utente*`)
}

const applyMod = (jid, action) => {
  const store = repStore()
  const rec = store[jid] ??= { score: 0, warns: 0, helps: 0, msgs: 0, at: Date.now() }
  if (action === 'warn') {
    rec.warns = (rec.warns || 0) + 1
    rec.score += Number(BADGE.warn) || -5
  } else if (action === 'mute') {
    rec.score += Number(BADGE.mute) || -10
  } else if (action === 'ban') {
    rec.score += Number(BADGE.ban) || -30
  } else if (action === 'help') {
    rec.helps = (rec.helps || 0) + 1
    rec.score += 2
  }
  global.markDbDirty?.()
  return rec
}

handler.all = async function (m) {
  try {
    if (!m?.isGroup) return
    if (!m?.sender) return
    const store = repStore()
    const rec = store[m.sender]
    if (rec) {
      rec.msgs = (rec.msgs || 0) + 1
    }
  } catch {}
}

handler.after = async function (m) {
  try {
    if (!m?.isGroup) return
    const stub = m?.messageStubType
    const target = m?.messageStubParameters?.[0]
    if (!target) return
    if (stub === 29) applyMod(target, 'help')
    if ([24, 25].includes(stub)) applyMod(target, 'mute')
    if (stub === 26) applyMod(target, 'ban')
  } catch {}
}

handler.help = ['reputation', 'reputation @utente']
handler.tags = ['gruppo', 'info']
handler.command = /^(reputation|reputazione|rep)$/i
handler.group = true

export default handler