// Plugin by elixir, punisher & 888 staff
import state from './state.js'

const KEY = (k) => {
  const v = global.APIKeys?.[k]
  return v && v !== '888' && v.length > 10 ? v : ''
}

const PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq',
    key: () => KEY('groq'),
    url: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
    auth: (k) => ({ 'Authorization': 'Bearer ' + k }),
    limits: '30 RPM / 1000 al giorno'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    key: () => KEY('gemini'),
    url: 'https://generativelanguage.googleapis.com/v1beta/models/',
    models: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'],
    auth: (k) => ({ 'x-goog-api-key': k }),
    limits: '15 RPM / 1500 al giorno'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    key: () => KEY('openrouter'),
    url: 'https://openrouter.ai/api/v1/chat/completions',
    models: [
      'qwen/qwen3-coder:free',
      'deepseek/deepseek-chat-v3-0324:free',
      'meta-llama/llama-3.3-70b-instruct:free'
    ],
    auth: (k) => ({ 'Authorization': 'Bearer ' + k }),
    limits: '50-1000 al giorno (modelli :free)'
  }
]

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const pick = (p, model) => p.models.includes(model) ? model : p.models[0]

async function callOpenAIish(p, model, messages, opts) {
  const key = p.key()
  if (!key) throw new Error('chiave assente')
  const res = await fetch(p.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...p.auth(key),
      ...(p.id === 'openrouter' ? { 'HTTP-Referer': 'https://888bot.netlify.app', 'X-Title': '888 BOT' } : {})
    },
    body: JSON.stringify({
      model: pick(p, model),
      messages,
      max_tokens: opts.maxTokens ?? 2000,
      temperature: opts.temperature ?? 0.2
    })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const e = new Error(err?.error?.message || ('HTTP ' + res.status))
    e.status = res.status
    e.provider = p.id
    throw e
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callGemini(model, messages, opts) {
  const key = KEY('gemini')
  if (!key) throw new Error('chiave assente')
  const sys = messages.filter(m => m.role === 'system').map(m => m.content).join('\n')
  const user = messages.filter(m => m.role !== 'system').map(m => m.content).join('\n')
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    pick(PROVIDERS[1], model) + ':generateContent?key=' + key
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: sys ? { parts: [{ text: sys }] } : undefined,
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        maxOutputTokens: opts.maxTokens ?? 2000,
        temperature: opts.temperature ?? 0.2
      }
    })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const e = new Error(err?.error?.message || ('HTTP ' + res.status))
    e.status = res.status
    e.provider = 'gemini'
    throw e
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
}
export const available = () =>
  PROVIDERS.filter(p => { try { return Boolean(p.key()) } catch { return false } })
    .map(p => ({ id: p.id, name: p.name, models: p.models, limits: p.limits }))

const CACHE_PREFIX = 'ai.cache.'
const CACHE_TTL = 30 * 60 * 1000

const cacheGet = (id) => {
  const rec = state.get(CACHE_PREFIX + id)
  if (rec && Date.now() - rec.at < CACHE_TTL) return rec.text
  return null
}

const cacheSet = (id, text) => {
  state.set(CACHE_PREFIX + id, { text, at: Date.now() })
}

export async function ask(messages, opts = {}) {
  const providers = opts.providers
    ? PROVIDERS.filter(p => opts.providers.includes(p.id))
    : PROVIDERS

  if (!providers.length) {
    throw new Error('nessuna API IA configurata (imposta almeno groq, gemini o openrouter in config.js)')
  }

  const cacheId = opts.cacheId
  if (cacheId && !opts.noCache) {
    const hit = cacheGet(cacheId)
    if (hit) return { text: hit, cached: true, provider: 'cache' }
  }

  const errors = []
  for (const p of providers) {
    for (const model of p.models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const text = p.id === 'gemini'
            ? await callGemini(model, messages, opts)
            : await callOpenAIish(p, model, messages, opts)
          if (text && text.trim()) {
            if (cacheId) cacheSet(cacheId, text)
            return { text: text.trim(), cached: false, provider: p.id + '/' + model }
          }
          errors.push(p.id + '/' + model + ': risposta vuota')
          break
        } catch (e) {
          errors.push(p.id + '/' + model + ': ' + (e?.message || e))
          const retryable = e?.status === 429 || e?.status === 503 || (e?.status >= 500)
          if (!retryable || attempt === 1) break
          await sleep(1200)
        }
      }
    }
  }
  const err = new Error('tutti i provider IA hanno fallito:\n' + errors.slice(0, 4).join('\n'))
  err.detail = errors
  throw err
}

export const clearCache = () => {
  const all = state.get('ai.cache.') || {}
  for (const k of Object.keys(all)) state.del(CACHE_PREFIX + k)
}

export default { ask, available, clearCache, PROVIDERS }