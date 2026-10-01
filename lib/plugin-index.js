// Plugin by elixir, punisher & 888 staff

let cache = {
  ref: null,
  size: -1,
  map: new Map(),
  wildcard: []
}

const firstCharOf = (prefix) => {
  if (typeof prefix !== 'string') return null
  const ch = prefix[0]
  return ch || null
}

const build = (plugins, fallbackPrefix) => {
  const map = new Map()
  const wildcard = []
  let count = 0

  for (const entry of plugins) {
    const [name, plugin] = entry
    if (!plugin || plugin.disabled) continue
    count++

    const prefix = plugin.customPrefix ?? fallbackPrefix
    const ch = firstCharOf(prefix)

    if (!ch) {
      wildcard.push(entry)
      continue
    }
    if (!map.has(ch)) map.set(ch, [])
    map.get(ch).push(entry)
  }

  return { ref: plugins, size: count, map, wildcard }
}

export const pluginIndex = (plugins, fallbackPrefix = '.') => {
  if (!plugins || typeof plugins !== 'object') {
    return { map: new Map(), wildcard: [] }
  }
  if (cache.ref === plugins && cache.size === Object.keys(plugins).length) {
    return cache
  }
  cache = build(Object.entries(plugins), fallbackPrefix)
  return cache
}

/**
 * Ritorna i plugin candidati per un testo.
 * `exact: true` esclude i plugin con prefisso non stringa
 * (RegExp/array): vanno comunque testati, ma sono rari.
 */
export const candidates = (text, opts = {}) => {
  const idx = opts.index
  if (!idx) return []
  const ch = String(text || '')[0]
  const hit = ch ? idx.map.get(ch) : null
  if (opts.exact) return hit ? hit : []
  return idx.wildcard.length ? [...(hit || []), ...idx.wildcard] : (hit || [])
}

export const resetPluginIndex = () => {
  cache = { ref: null, size: -1, map: new Map(), wildcard: [] }
}

export default { pluginIndex, candidates, resetPluginIndex }
