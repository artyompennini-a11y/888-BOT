// Plugin by elixir, punisher & 888 staff
const getState = () => {
  global.afkState = global.afkState || {}
  return global.afkState
}

const digitsOf = (jid = '') => String(jid ?? '').split('@')[0].split(':')[0].replace(/\D+/g, '')


export const getAfkEntry = (jid) => {
  const state = getState()
  const direct = state[jid]
  if (direct) return direct

  const target = digitsOf(jid)
  if (!target) return undefined

  for (const [key, entry] of Object.entries(state)) {
    if (entry && digitsOf(key) === target) return entry
  }
  return undefined
}


export const isAfk = (jid, chat = '') => {
  const entry = getAfkEntry(jid)
  if (!entry) return false
  if (entry.scope === 'all') return true
  return Boolean(chat) && entry.chat === chat
}


export const isParticipantAfk = (participant, chat = '') => {
  if (!participant) return false
  const ids = [
    participant.id,
    participant.jid,
    participant.lid,
    participant.phoneNumber,
    participant.participant
  ].filter(Boolean)

  if (!ids.length) return false

  const state = getState()
  if (!Object.keys(state).length) return false

    for (const id of ids) {
    const entry = getAfkEntry(id)
    if (!entry) continue
    if (entry.scope === 'all') return true
    if (chat && entry.chat === chat) return true
  }
  return false
}


export const withoutAfk = (jids = [], chat = '', skipped = { count: 0 }) => {
  const out = []
  for (const jid of jids) {
    if (isAfk(jid, chat)) skipped.count++
    else out.push(jid)
  }
  return out
}

export const afkReason = (jid) => getAfkEntry(jid)?.reason || ''

export default { getAfkEntry, isAfk, isParticipantAfk, withoutAfk, afkReason }
