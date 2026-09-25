// Blacklist Database by elixir & punisher
export function blacklistStore() {
  global.db.data.blacklist ??= {}
  return global.db.data.blacklist
}

export function getBlacklist() {
  return blacklistStore()
}

export function isBlacklisted(jid = '') {
  if (!jid) return false
  return Boolean(blacklistStore()[jid])
}

export function addBlacklist(jid = '', { reason = '', addedBy = '' } = {}) {
  if (!jid) return null
  const store = blacklistStore()
  const entry = {
    reason: String(reason || 'Nessun motivo specificato'),
    addedBy: String(addedBy || '').split('@')[0],
    date: new Date().toLocaleString('it-IT')
  }
  store[jid] = entry
  global.markDbDirty?.()
  return entry
}

export function removeBlacklist(jid = '') {
  const store = blacklistStore()
  if (!store[jid]) return false
  delete store[jid]
  global.markDbDirty?.()
  return true
}

export function blacklistCount() {
  return Object.keys(blacklistStore()).length
}

export default {
  blacklistStore,
  getBlacklist,
  isBlacklisted,
  addBlacklist,
  removeBlacklist,
  blacklistCount
}
