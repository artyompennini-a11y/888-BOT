import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const pluginPath = path.join(repoRoot, 'plugins', 'owner', 'owner-setpfpbot.js')

// Import jimp to check which version is available
const jimp = await import('jimp')
const JimpClass = jimp.Jimp || jimp.default || jimp
const legacy =
  typeof JimpClass.MIME_PNG === 'string' ||
  typeof JimpClass.FONT_SANS_16_WHITE !== 'undefined'

// Import the plugin
const { default: handler } = await import(pathToFileURL(pluginPath).href)

// ── helpers ──
const newImage = (w, h, color) =>
  legacy
    ? new JimpClass(w, h, color)
    : new JimpClass({ width: w, height: h, color })

const toPng = async (img) =>
  legacy ? img.getBufferAsync('image/png') : await img.getBuffer('image/png')

const bmpSize = (img) => ({
  width: img.bitmap.width || img.width,
  height: img.bitmap.height || img.height,
})

const pixelAt = (img, x, y) => {
  const w = img.bitmap.width || img.width
  const i = (y * w + x) * 4
  const d = img.bitmap.data
  return { r: d[i], g: d[i + 1], b: d[i + 2] }
}

// ── test media ──
async function stripes(w = 900, h = 400) {
  const img = newImage(w, h, 0x000000ff)
  const d = img.bitmap.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const third = x < w / 3 ? 0 : x < (2 * w) / 3 ? 1 : 2
      d[i] = third === 0 ? 255 : 0
      d[i + 1] = third === 1 ? 255 : 0
      d[i + 2] = third === 2 ? 255 : 0
      d[i + 3] = 255
    }
  }
  return toPng(img)
}

const solid = async (w, h, color) =>
  toPng(newImage(w, h, color))

const fakeWebp = () =>
  Buffer.concat([
    Buffer.from('RIFF'),
    Buffer.from([0x1a, 0, 0, 0]),
    Buffer.from('WEBPVP8 '),
    Buffer.alloc(24),
  ])

// ── harness ──
const ownerJid = '1111111111@s.whatsapp.net'
let failUpdate = null

global.owner = [
  ['1111111111', 'primo', true],
  ['2222222222', 'secondo', true],
]

function makeCtx() {
  const state = { updates: [], sent: [] }
  const conn = {
    user: { jid: '9999999999:3@s.whatsapp.net', id: '9999999999:3@s.whatsapp.net' },
    sendMessage: async (chat, payload) => {
      state.sent.push(payload)
      return { key: {} }
    },
    updateProfilePicture: async (jid, buffer) => {
      if (failUpdate) throw new Error(failUpdate)
      state.updates.push({ jid, buffer })
    },
  }
  return { conn, state }
}

const textOf = (state) =>
  state.sent.map((p) => p.text || p.caption || '').join(' \n ')

async function run(m, extra = {}) {
  const { conn, state } = makeCtx()
  const message = {
    chat: '123@g.us',
    sender: extra.sender || ownerJid,
    key: { id: 'X' },
    ...m,
  }
  try {
    await handler(message, {
      conn,
      text: extra.text || '',
      usedPrefix: '.',
      command: 'setppbot',
      ...extra.flags,
    })
  } catch (e) {
    console.error('handler ha lanciato:', e.message)
  }
  return state
}

// ── tests ──
const results = []
const check = (name, ok, extra = '') => {
  results.push(!!ok)
  console.log(`${ok ? 'PASS' : 'FAIL'} \u2014 ${name}${extra ? ' :: ' + extra : ''}`)
}

// 1) rispondendo a un'immagine 900x400 -> crop centrato + JPEG
{
  const buffer = await stripes(900, 400)
  const state = await run({
    quoted: {
      mediaMessage: true,
      mediaType: 'imageMessage',
      mtype: 'imageMessage',
      download: async () => buffer,
    },
  })
  const upd = state.updates[0]
  const img = await JimpClass.read(upd.buffer)
  const s = bmpSize(img)
  const left = pixelAt(img, 2, s.height / 2)
  const right = pixelAt(img, s.width - 3, s.height / 2)

  check('citata 900x400 -> 400x400', s.width === 400 && s.height === 400, `${s.width}x${s.height}`)
  check('crop CENTRATO (rosso a sx, blu a dx)', left.r === 254 && right.b === 254, `L=${JSON.stringify(left)} R=${JSON.stringify(right)}`)
  check('output JPEG', upd.buffer.slice(0, 3).toString('hex') === 'ffd8ff', `header=${upd.buffer.slice(0, 3).toString('hex')}`)
  check('conferma con anteprima + dimensioni', state.sent.length === 1)
}

// 2) allegata PNG 1000x1000 -> 640x640
{
  const buffer = await solid(1000, 1000, 0xff0000ff)
  const state = await run({
    mediaMessage: true,
    mediaType: 'imageMessage',
    mtype: 'imageMessage',
    download: async () => buffer,
  })
  const upd = state.updates[0]
  const s = upd ? bmpSize(await JimpClass.read(upd.buffer)) : {}
  check('allegata 1000x1000 -> 640x640', upd && s.width === 640 && s.height === 640, `${s.width}x${s.height}`)
}

// 3) piccola immagine (120x60) -> non ingrandita, crop quadrato
{
  const buffer = await solid(120, 60, 0x00ff00ff)
  const state = await run({
    mediaMessage: true,
    mediaType: 'imageMessage',
    mtype: 'imageMessage',
    download: async () => buffer,
  })
  const upd = state.updates[0]
  const s = upd ? bmpSize(await JimpClass.read(upd.buffer)) : {}
  check('piccola 120x60 -> 60x60 (no upscale)', upd && s.width === 60 && s.height === 60, `${s.width}x${s.height}`)
}

// 4) nessun media -> guida d'uso
{
  const state = await run({})
  check("nessun media -> guida d'uso", /Imposta la foto profilo/.test(textOf(state)), '')
}

// 5) video citato -> errore chiaro
{
  const state = await run({
    quoted: { mediaMessage: true, mediaType: 'videoMessage' },
  })
  check('video -> errore chiaro', /non è un'immagine/.test(textOf(state)), textOf(state).slice(0, 50))
}

// 6) link immagine
{
  const state = await run(
    {},
    {
      text: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    }
  )
  const upd = state.updates[0]
  const s = upd ? bmpSize(await JimpClass.read(upd.buffer)) : {}
  check('link immagine -> avatar quadrato', !!upd && s.width === s.height && s.width > 10, `${s.width}x${s.height}`)
}

// 7) non-owner -> rifiuto esplicito
{
  const state = await run(
    {
      mediaMessage: true,
      mediaType: 'imageMessage',
      download: async () => solid(50, 50, 0xffffffff),
    },
    { sender: '3333333333@s.whatsapp.net' }
  )
  check('non owner -> rifiuto esplicito', /riservato agli owner/.test(textOf(state)) && state.updates.length === 0, '')
}

// 8) secondo owner della lista
{
  const state = await run(
    {
      mediaMessage: true,
      mediaType: 'imageMessage',
      download: async () => solid(50, 50, 0xffffffff),
    },
    { sender: '2222222222@s.whatsapp.net' }
  )
  check('secondo owner autorizzato', state.updates.length === 1, `updates=${state.updates.length}`)
}

// 9) flag isOwner -> autorizzato
{
  const state = await run(
    {
      mediaMessage: true,
      mediaType: 'imageMessage',
      download: async () => solid(50, 50, 0xffffffff),
    },
    { sender: '4444444444@s.whatsapp.net', flags: { isOwner: true } }
  )
  check('flag isOwner -> autorizzato', state.updates.length === 1, `updates=${state.updates.length}`)
}

// 10) errore jimp realistico (reading 'read') -> causa probabile + rimedio
{
  failUpdate = "Cannot read properties of undefined (reading 'read')"
  const state = await run({
    mediaMessage: true,
    mediaType: 'imageMessage',
    download: async () => solid(50, 50, 0xffffffff),
  })
  failUpdate = null
  const text = textOf(state)
  check('errore jimp (reading read) -> causa probabile + rimedio', /Causa probabile/.test(text) && /jimp@0\.22\.12/.test(text), '')
}

// 10b) errore jimp con virgolette doppie
{
  failUpdate = 'Cannot read properties of undefined (reading "read")'
  const state = await run({
    mediaMessage: true,
    mediaType: 'imageMessage',
    download: async () => solid(50, 50, 0xffffffff),
  })
  failUpdate = null
  const text = textOf(state)
  check('errore jimp (reading "read", vv) -> causa probabile', /Causa probabile/.test(text) && /jimp@0\.22\.12/.test(text), '')
}


// 10c) errore jimp con backtick
{
  failUpdate = 'Cannot read properties of undefined (reading `read`)'
  const state = await run({
    mediaMessage: true,
    mediaType: 'imageMessage',
    download: async () => solid(50, 50, 0xffffffff),
  })
  failUpdate = null
  const text = textOf(state)
  check('errore jimp (reading backtick) -> causa probabile', /Causa probabile/.test(text) && /jimp@0.22.12/.test(text), '')
}
// 10c) errore jimp con altra proprieta (bitmap)
{
  failUpdate = "Cannot read properties of undefined (reading 'bitmap')"
  const state = await run({
    mediaMessage: true,
    mediaType: 'imageMessage',
    download: async () => solid(50, 50, 0xffffffff),
  })
  failUpdate = null
  const text = textOf(state)
  check('errore jimp (reading bitmap) -> causa probabile', /Causa probabile/.test(text) && /jimp@0\.22\.12/.test(text), '')
}

// 10d) errore WhatsApp generico -> suggerimento generico
{
  failUpdate = 'IQ error 400: bad-request'
  const state = await run({
    mediaMessage: true,
    mediaType: 'imageMessage',
    download: async () => solid(50, 50, 0xffffffff),
  })
  failUpdate = null
  const text = textOf(state)
  check('errore WhatsApp generico -> rimedio mostrato', /bad-request/.test(text) && /jimp@0\.22\.12/.test(text), '')
}

// 11) sticker webp -> messaggio chiaro
{
  const state = await run({
    quoted: {
      mediaMessage: true,
      mediaType: 'stickerMessage',
      download: async () => fakeWebp(),
    },
  })
  check('sticker webp -> messaggio chiaro', state.updates.length === 0 && /Sticker non convertibile|non è un'immagine|Immagine non leggibile/.test(textOf(state)), textOf(state).slice(0, 60))
}

// 12) file non-immagine (PDF) -> errore chiaro
{
  const pdf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(60)])
  const state = await run({
    quoted: {
      mediaMessage: true,
      mediaType: 'documentMessage',
      download: async () => pdf,
    },
  })
  check("PDF -> non è un'immagine", state.updates.length === 0 && /non è un'immagine/.test(textOf(state)), textOf(state).slice(0, 50))
}

console.log('')
console.log(`TOTALE: ${results.filter(Boolean).length}/${results.length} PASS — jimp ${legacy ? 'v0' : 'v1'}`)

if (results.some((r) => !r)) {
  process.exit(1)
}
