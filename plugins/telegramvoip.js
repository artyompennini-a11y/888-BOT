let axios, cheerioModule
let ready = false

try {
  axios = (await import('axios')).default
  cheerioModule = await import('cheerio')
  ready = true
} catch (e) {
}
let cacheManager = null
try { cacheManager = await import('../scripts/cacheManager.js') } catch (e) { cacheManager = null }

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

const sites = [
  'https://receive-sms-online.info',
  'https://receive-smss.com',
  'https://www.receivesms.co',
  'https://freephonenum.com',
  'https://receive-sms.cc',
  'https://sms-online.co',
  'https://receiveasms.com',
  'https://sms24.me',
  'https://onlinesim.io',
  'https://quackr.io',
  'https://tempsmss.com',
  'https://anonymsms.com',
  'https://www.receivesmsonline.net',
  'https://www.receivesmsonline.com',
  'https://receive-sms-online.com',
  'https://receive-a-sms.com',
  'https://smsreceivefree.com',
  'https://free-sms-receive.net',
  'https://receive-sms-now.com',
  'https://getfreesmsnumber.com',
  'https://receivefreesms.com',
  'https://sms-online.org',
  'https://receive-sms.org'
]

const countries = [
  { name: 'USA 🇺🇸', prefix: '+1' },
  { name: 'UK 🇬🇧', prefix: '+44' },
  { name: 'Francia 🇫🇷', prefix: '+33' },
  { name: 'Germania 🇩🇪', prefix: '+49' },
  { name: 'Spagna 🇪🇸', prefix: '+34' },
  { name: 'Italia 🇮🇹', prefix: '+39' },
  { name: 'Svezia 🇸🇪', prefix: '+46' },
  { name: 'Canada 🇨🇦', prefix: '+1' },
  { name: 'Paesi Bassi 🇳🇱', prefix: '+31' },
  { name: 'Polonia 🇵🇱', prefix: '+48' },
  { name: 'Russia 🇷🇺', prefix: '+7' },
  { name: 'Ucraina 🇺🇦', prefix: '+380' },
  { name: 'India 🇮🇳', prefix: '+91' },
  { name: 'Indonesia 🇮🇩', prefix: '+62' },
  { name: 'Filippine 🇵🇭', prefix: '+63' }
]

const numbersCache = new Map()
const smsCache = new Map()
const numbersMeta = new Map()
const NUMBERS_TTL = 10 * 60 * 1000
const SMS_TTL = 2 * 60 * 1000

const cacheFilePath = './storage/voip-cache.json'
let _saveTimer = null
let _dirty = false

async function loadCacheFromFile() {
  try {
    const parsed = cacheManager && (await cacheManager.loadCacheFile(cacheFilePath)) || null
    if (!parsed) return
    if (parsed?.numbers) {
      const nums = (parsed.numbers || []).map(o => {
        if (!o) return null
        const n = o.number || o.num || null
        if (!n) return null
        numbersMeta.set(n, { source: o.source || null, ts: o.ts || Date.now() })
        return n
      }).filter(Boolean)
      setCached(numbersCache, 'all', nums)
    }
    if (parsed?.sms && typeof parsed.sms === 'object') {
      for (const [k, v] of Object.entries(parsed.sms)) setCached(smsCache, k, v)
    }
  } catch (e) {}
}

async function saveCacheToFile() {
  if (!_dirty) return
  _dirty = false
  try {
    const current = getCached(numbersCache, 'all', Number.MAX_SAFE_INTEGER) || []
    const obj = { numbers: [], sms: {} }
    for (const n of current) {
      const meta = numbersMeta.get(n) || {}
      obj.numbers.push({ number: n, source: meta.source || null, ts: meta.ts || Date.now() })
    }
    for (const [k, v] of smsCache.entries()) obj.sms[k] = v.data || v
    if (cacheManager && cacheManager.saveCacheFileAtomic) {
 
      try { cacheManager.ensureStorageDirSync && cacheManager.ensureStorageDirSync('storage') } catch (e) {}
      await cacheManager.saveCacheFileAtomic(cacheFilePath, obj)
    } else {

      try {
        const fs = await import('fs')
        const fsp = fs.promises
        const tmp = cacheFilePath + '.tmp'
        await fsp.writeFile(tmp, JSON.stringify(obj, null, 2), 'utf-8')
        await fsp.rename(tmp, cacheFilePath)
      } catch (e) {}
    }
  } catch (e) {}
}

function scheduleCacheSave() {
  _dirty = true
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(saveCacheToFile, 1000)
}

function getCached(map, key, ttl) {
  const entry = map.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > ttl) {
    map.delete(key)
    return null
  }
  return entry.data
}

function setCached(map, key, data) {
  map.set(key, { ts: Date.now(), data })
  scheduleCacheSave()
}

function normalizeNumber(n) {
  if (!n) return ''
  n = String(n).trim()
  const plusMatch = n.match(/\+\d{6,15}/)
  if (plusMatch) return plusMatch[0]
  const digits = n.replace(/[^0-9]/g, '')
  if (digits.length >= 6 && digits.length <= 15) return `+${digits}`
  return n
}

async function puppeteerFetch(url, timeout = 15000) {
  try {
    const puppeteer = (await import('puppeteer')).default
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()
    await page.setUserAgent(headers['User-Agent'])
    await page.setExtraHTTPHeaders({ Accept: headers.Accept })
    await page.setViewport({ width: 1200, height: 800 })
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout })
    const content = await page.content()
    await browser.close()
    return content
  } catch (e) {
    return null
  }
}

async function fetchWithFallback(url, options = { forcePuppeteer: false }) {
  const { forcePuppeteer } = options
  if (forcePuppeteer) {
    const html = await puppeteerFetch(url)
    if (html) return html
  }
  try {
    const res = await axios.get(url, { headers, timeout: 10000 })
    return res.data
  } catch (e) {
    const status = e?.response?.status
    if (status === 403 || status === 401 || String(e?.message || '').toLowerCase().includes('blocked')) {
      const html = await puppeteerFetch(url)
      if (html) return html
    }
    return null
  }
}

async function getNumbers(opts = { forcePuppeteer: false, refresh: false }) {
  const { forcePuppeteer, refresh } = opts
  const cached = getCached(numbersCache, 'all', NUMBERS_TTL)
  if (cached && !refresh) return cached

  let results = []
  const load = (cheerioModule && (cheerioModule.load || cheerioModule.default?.load)) || null

  for (let site of sites) {
    try {
      const data = await fetchWithFallback(site, { forcePuppeteer })
      if (!data || !load) continue
      const $ = load(data)

      const textCandidates = []
      $('a, td, div, span, li, p').each((i, el) => textCandidates.push($(el).text()))
      $('a').each((i, el) => { const href = $(el).attr('href') || ''; if (href) textCandidates.push(href) })

        const raw = textCandidates.join('\n')
        let match = raw.match(/\+\d{6,15}/g) || raw.match(/\b\d{6,15}\b/g) || []
        match = match.map(m => normalizeNumber(m)).filter(Boolean)
        for (const num of match) {
          if (!numbersMeta.has(num)) numbersMeta.set(num, { source: site, ts: Date.now() })
          results.push(num)
        }
    } catch (e) {}
  }


  results = [...new Set(results)].map(n => n.replace(/\s+/g, '')).filter(n => n.startsWith('+') && n.length >= 8 && n.length <= 16)

    for (const k of Array.from(numbersMeta.keys())) if (!results.includes(k)) numbersMeta.delete(k)
  setCached(numbersCache, 'all', results)
  return results
}

async function getSMS(num, opts = { forcePuppeteer: false }) {
  const key = `sms:${num}`
  const cached = getCached(smsCache, key, SMS_TTL)
  if (cached) return cached
  const load = (cheerioModule && (cheerioModule.load || cheerioModule.default?.load)) || null
  const clean = num.replace('+', '')
  const urlPatterns = [
    (s) => `${s}/${clean}`,
    (s) => `${s}/sms/${clean}`,
    (s) => `${s}/number/${clean}`,
    (s) => `${s}/receive-sms/${clean}`,
    (s) => `${s}/incoming-sms/${clean}`,
    (s) => `${s}/?phone=${clean}`
  ]

  for (let site of sites) {
    for (let build of urlPatterns) {
      const url = build(site)
      try {
        const data = await fetchWithFallback(url, { forcePuppeteer: opts.forcePuppeteer })
        if (!data || !load) continue
        const $ = load(data)

        let msgs = []
        $('table tr, .list, .sms, .inbox, .message, .received, .sms-list, article, div').each((i, el) => {
          let text = $(el).text().trim()
          if (text && text.length > 10 && text.length < 600) msgs.push(text.replace(/\s+/g, ' ').trim())
        })

        if (msgs.length === 0) {
          const raw = $('body').text() || ''
          const lines = raw.split(/\n+/).map(l => l.trim()).filter(l => l.length > 10 && l.length < 600)
          msgs.push(...lines.slice(0, 20))
        }

        if (msgs.length > 0) {
          const uniq = [...new Set(msgs)].slice(0, 10)
          setCached(smsCache, key, uniq)
          return uniq
        }
      } catch (e) {
      }
    }
  }

  setCached(smsCache, key, [])
  return []
}

let sessions = {}

try { cacheManager && cacheManager.ensureStorageDirSync && cacheManager.ensureStorageDirSync('storage') } catch (e) {}
loadCacheFromFile()

try {
  const mins = parseInt(process.env.VOIP_REFRESH_MINUTES || process.env.VOIP_REFRESH || '0')
  if (mins > 0) setInterval(() => getNumbers({ forcePuppeteer: false, refresh: true }), mins * 60 * 1000)
} catch (e) {}

let handler = async (m, { conn, args, usedPrefix }) => {
  if (!ready) return m.reply('❌ Librerie mancanti.')

  const user = m.sender

  if (!args[0]) {
    let txt = '🌍 *SCEGLI PAESE*\n\n'
    countries.forEach((c, i) => { txt += `*${i + 1}.* ${c.name}\n` })
    txt += `\nUsa: ${usedPrefix}voip <numero> (es. ${usedPrefix}voip 1)`
    return m.reply(txt)
  }

  if (args[0] === 'refresh' || args[0] === 'scan') {
    const force = args[1] === 'puppeteer' || args.includes('puppeteer')
    await m.reply('🔄 Avvio refresh numeri' + (force ? ' (puppeteer)' : '') + '...')
    const all = await getNumbers({ forcePuppeteer: force, refresh: true })
    return m.reply(`✅ Refresh completato. Numeri disponibili: ${all.length}`)
  }

  if (!isNaN(args[0])) {
    const country = countries[parseInt(args[0]) - 1]
    if (!country) return m.reply('❌ Paese non valido')

    await m.reply('⏳ Sto cercando numeri disponibili...')
    const all = await getNumbers()
    const nums = all.filter(n => n.startsWith(country.prefix))
    if (nums.length === 0) return m.reply('❌ Nessun numero trovato per questo paese')

    sessions[user] = { country, nums, current: 0 }
    const num = nums[0]

    const message = []
    message.push('╭─• *NUMERO DISPONIBILE* •─╮')
    message.push(`🌍 *${country.name}*`)
    message.push(`📲 *${num}*`)
    message.push('')
    message.push('Premi i tasti per cambiare numero o controllare SMS')
    message.push('╰──────────────────────╯')

    return conn.sendMessage(m.chat, {
      text: message.join('\n'),
      buttons: [
        { buttonId: `${usedPrefix}voip next`, buttonText: { displayText: '🔄 Cambia Numero' }, type: 1 },
        { buttonId: `${usedPrefix}voip sms`, buttonText: { displayText: '📩 Controlla SMS' }, type: 1 },
        { buttonId: `${usedPrefix}voip`, buttonText: { displayText: '🌍 Cambia Paese' }, type: 1 }
      ],
      headerType: 1
    })
  }

  if (args[0] === 'next') {
    const session = sessions[user]
    if (!session) return m.reply('❌ Seleziona prima un paese')
    session.current = (session.current + 1) % session.nums.length
    const num = session.nums[session.current]

    const message = []
    message.push('╭─• *NUOVO NUMERO* •─╮')
    message.push(`🌍 *${session.country.name}*`)
    message.push(`📲 *${num}*`)
    message.push('╰────────────────╯')

    return conn.sendMessage(m.chat, {
      text: message.join('\n'),
      buttons: [
        { buttonId: `${usedPrefix}voip next`, buttonText: { displayText: '🔄 Cambia Numero' }, type: 1 },
        { buttonId: `${usedPrefix}voip sms`, buttonText: { displayText: '📩 Controlla SMS' }, type: 1 },
        { buttonId: `${usedPrefix}voip`, buttonText: { displayText: '🌍 Cambia Paese' }, type: 1 }
      ],
      headerType: 1
    })
  }

  if (args[0] === 'sms') {
    const session = sessions[user]
    if (!session) return m.reply('❌ Nessuna sessione attiva')
    const num = session.nums[session.current]
    await m.reply('⏳ Controllo SMS in arrivo...')
    const msgs = await getSMS(num)
    if (msgs.length === 0) return m.reply('❌ Nessun SMS trovato per questo numero')
    let txt = `📩 *SMS ${num}*\n\n`
    msgs.forEach((x, i) => { txt += `*${i + 1}.* ${x}\n────────────\n` })
    return m.reply(txt.trim())
  }
}

handler.help = ['voip']
handler.tags = ['tools']
handler.command = /^(voip)$/i
handler.owner = true

export default handler

if (cacheManager && cacheManager.registerExitHandler) {
  try { cacheManager.registerExitHandler(saveCacheToFile) } catch (e) {}
} else {
  async function _gracefulSave(code = 0) {
    try { await saveCacheToFile() } catch (e) {}
    try { process.exit(code) } catch (e) {}
  }
  process.on('SIGINT', () => { _gracefulSave(0) })
  process.on('SIGTERM', () => { _gracefulSave(0) })
  process.on('beforeExit', async () => { try { await saveCacheToFile() } catch (e) {} })
}
