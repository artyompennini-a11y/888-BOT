// Plugin by 888
// Card Last.fm generata con JIMP (nessuna dipendenza nativa: funziona su Termux)

import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import yts from 'yt-search'

const DB_PATH = path.join(process.cwd(), 'db.json')

let db = { users: {}, likes: {}, favorites: {} }
if (fs.existsSync(DB_PATH)) {
  try {
    const fileData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
    db = {
      users: fileData.users || {},
      likes: fileData.likes || {},
      favorites: fileData.favorites || {}
    }
  } catch (e) {
    console.error('Errore nel caricamento del database Last.fm, resetto...', e)
  }
}

function saveDB() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

const invalidateRecentCache = (username) => {}
const generateSongId = (username, artist, song) =>
  `${username}_${artist}_${song}`.toLowerCase().replace(/\s+/g, '')

const addSongLike = (songId, sender) => {
  if (!db.likes[songId]) db.likes[songId] = []
  if (db.likes[songId].includes(sender)) return { alreadyLiked: true }
  db.likes[songId].push(sender)
  saveDB()
  return { alreadyLiked: false }
}

const addFavorite = (userId, artist, song) => {
  if (!db.favorites[userId]) db.favorites[userId] = []
  const dup = db.favorites[userId].some(
    (f) => f.artist.toLowerCase() === artist.toLowerCase() && f.song.toLowerCase() === song.toLowerCase()
  )
  if (dup) return { alreadyFav: true }
  db.favorites[userId].push({ artist, song, at: Date.now() })
  saveDB()
  return { alreadyFav: false }
}

const getFavorites = (userId) => db.favorites[userId] || []
const getUsernameFromId = (id) => db.users[id] || id

const formatFavoriteList = (userId, label) => {
  const favorites = getFavorites(userId)
  if (!favorites.length) {
    return `❤️ *Nessun brano nei preferiti*${label ? ` di ${label}` : ''}.\n\n👉 Aggiungine uno premendo il bottone *❤️ Preferito* sotto una card.`
  }

  const list = favorites
    .slice()
    .reverse()
    .slice(0, 8)
    .map((item, index) => `${index + 1}. *${item.song}* — *${item.artist}*`)
    .join('\n')

  const extra = favorites.length > 8 ? `\n\n… e altri ${favorites.length - 8} brani` : ''
  return `❤️ *Preferiti${label ? ` di ${label}` : ''}*\n\n${list}${extra}`
}

const LASTFM_API_KEY = '36f859a1fc4121e7f0e931806507d5f9'

const execPromise = (cmd) => new Promise((resolve, reject) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) return reject(error)
    resolve({ stdout, stderr })
  })
})

async function downloadAudioFromQuery(query) {
  let outputPath
  try {
    const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(query)
    const vid = isUrl ? { url: query, title: query } : (await yts(query))?.videos?.[0]
    if (!vid?.url) return null

    const tmpDir = os.tmpdir()
    const fileName = `cur_audio_${Date.now()}`
    outputPath = path.join(tmpDir, `${fileName}.mp3`)

    await execPromise(`yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${vid.url}"`)

    if (!fs.existsSync(outputPath)) return null

    const buffer = fs.readFileSync(outputPath)
    return {
      buffer,
      title: vid.title,
      url: vid.url
    }
  } catch (e) {
    console.error('[cur-download] errore:', e.message)
    return null
  } finally {
    if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
  }
}

async function getRecentTrack(username) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    return json?.recenttracks?.track?.[0] || null
  } catch {
    return null
  }
}

async function getTopArtists(username) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${encodeURIComponent(username)}&api_key=${LASTFM_API_KEY}&format=json&period=7day&limit=3`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    return json?.topartists?.artist || null
  } catch {
    return null
  }
}

async function getTrackInfo(artist, track, username) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&username=${encodeURIComponent(username || '')}&api_key=${LASTFM_API_KEY}&format=json&autocorrect=1`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    return json?.track || null
  } catch {
    return null
  }
}

async function getArtistInfo(artist) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json&autocorrect=1`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    return json?.artist || null
  } catch {
    return null
  }
}

const formatCount = (n) => {
  const num = parseInt(n, 10) || 0
  if (num >= 1e6) return `${(num / 1e6).toFixed(num >= 1e7 ? 0 : 1)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(num >= 1e5 ? 0 : 1)}k`
  return String(num)
}

// ────────────────────────────────────────────────────────────────
//  Card Last.fm generata con JIMP
//  Serve solo il pacchetto jimp (`npm i jimp`): nessuna dipendenza
//  nativa, quindi il rendering funziona anche su Termux/Android.
//  Canvas e puppeteer non vengono più usati.
// ────────────────────────────────────────────────────────────────

const CARD_W = 800
const CARD_H = 400
const COVER_BOX = { x: 30, y: 30, size: 340, radius: 14 }
const INFO_X = 400
const INFO_W = 370
const ART_PLACEHOLDER =
  'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png'

const ACCENT_PLAYING = [29, 185, 84]
const ACCENT_IDLE = [136, 136, 136]
const COL_TITLE = [255, 255, 255]
const COL_ARTIST = [206, 206, 206]
const COL_ALBUM = [128, 128, 128]
const COL_USER = [155, 155, 155]
const COL_LOGO = [224, 0, 0]

let jimpCtx = null
const jimpFontCache = new Map()

// Carica jimp una sola volta. È compatibile sia con la v0.x (API
// statica "legacy": Jimp.loadFont, Jimp.MIME_PNG, ...) sia con la
// v1.x (API modulare: mod.Jimp, mod.loadFont, 'jimp/fonts').
async function getJimp () {
  if (jimpCtx) return jimpCtx

  const mod = await import('jimp')
  const JimpClass = mod.Jimp || mod.default || mod
  const legacy =
    typeof JimpClass.FONT_SANS_16_WHITE !== 'undefined' ||
    typeof JimpClass.MIME_PNG === 'string'

  jimpCtx = { mod, JimpClass, legacy }
  return jimpCtx
}

// A parità di distanza preferisce il font più grande (più leggibile).
function nearestFontSize (sizes, wanted) {
  return sizes
    .slice()
    .sort((a, b) => Math.abs(a - wanted) - Math.abs(b - wanted) || b - a)[0]
}

async function getFont (size) {
  const cacheKey = String(size)
  if (jimpFontCache.has(cacheKey)) return jimpFontCache.get(cacheKey)

  const { mod, JimpClass, legacy } = await getJimp()
  let font

  if (legacy) {
    const sizes = [8, 10, 12, 14, 16, 32, 64, 128].filter(
      (s) => JimpClass[`FONT_SANS_${s}_WHITE`] !== undefined
    )
    if (!sizes.length) throw new Error('font bitmap di jimp non disponibili')
    font = await JimpClass.loadFont(JimpClass[`FONT_SANS_${nearestFontSize(sizes, size)}_WHITE`])
  } else {
    const fonts = await import('jimp/fonts')
    const sizes = Object.keys(fonts)
      .filter((k) => /^SANS_\d+_WHITE$/.test(k))
      .map((k) => parseInt(k.slice(5), 10))
    if (!sizes.length) throw new Error('font bitmap di jimp non disponibili')
    // In jimp v1 loadFont restituisce una Promise
    font = await mod.loadFont(fonts[`SANS_${nearestFontSize(sizes, size)}_WHITE`])
  }

  jimpFontCache.set(cacheKey, font)
  return font
}

function textWidth (ctx, font, text) {
  const measure = ctx.JimpClass.measureText || ctx.mod.measureText
  if (typeof measure === 'function') return measure(font, String(text))
  return String(text).length * 10
}

function newImage (ctx, width, height, color) {
  return ctx.legacy
    ? new ctx.JimpClass(width, height, color)
    : new ctx.JimpClass({ width, height, color })
}

function resizeTo (ctx, image, width, height) {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  if (ctx.legacy) image.resize(w, h)
  else image.resize({ w, h })
  return image
}

function cropTo (ctx, image, x, y, width, height) {
  if (ctx.legacy) image.crop(x, y, width, height)
  else image.crop({ x, y, w: width, h: height })
  return image
}

function bitmapOf (image) {
  const bitmap = image.bitmap
  return {
    data: bitmap.data,
    width: bitmap.width || image.width,
    height: bitmap.height || image.height
  }
}

// Ridimensiona mantenendo le proporzioni e ritaglia al centro
// (equivalente di object-fit: cover del CSS).
function coverResize (ctx, image, width, height) {
  const { width: sourceW, height: sourceH } = bitmapOf(image)
  const scale = Math.max(width / sourceW, height / sourceH)
  const scaledW = Math.max(width, Math.round(sourceW * scale))
  const scaledH = Math.max(height, Math.round(sourceH * scale))
  resizeTo(ctx, image, scaledW, scaledH)
  return cropTo(
    ctx,
    image,
    Math.floor((scaledW - width) / 2),
    Math.floor((scaledH - height) / 2),
    width,
    height
  )
}

async function toPngBuffer (ctx, image) {
  if (typeof image.getBufferAsync === 'function') {
    return image.getBufferAsync(ctx.JimpClass.MIME_PNG || 'image/png')
  }
  return image.getBuffer('image/png')
}

// ── Disegno a basso livello: lavoro diretto sui pixel del bitmap ──

function blendPixel (data, index, rgb, alpha) {
  if (alpha <= 0) return

  const dstAlpha = data[index + 3] / 255
  const outAlpha = alpha + dstAlpha * (1 - alpha)
  if (outAlpha <= 0) {
    data[index + 3] = 0
    return
  }

  for (let channel = 0; channel < 3; channel++) {
    data[index + channel] = Math.round(
      (rgb[channel] * alpha + data[index + channel] * dstAlpha * (1 - alpha)) / outAlpha
    )
  }
  data[index + 3] = Math.round(outAlpha * 255)
}

// Copertura (0..1) del pixel per un rettangolo con angoli arrotondati,
// con anti-aliasing sul bordo.
function roundRectCoverage (x, y, width, height, radius) {
  if (radius <= 0) return 1

  const centerX = Math.min(Math.max(x + 0.5, radius), width - radius)
  const centerY = Math.min(Math.max(y + 0.5, radius), height - radius)
  const distance = Math.hypot(x + 0.5 - centerX, y + 0.5 - centerY)

  return Math.max(0, Math.min(1, radius - distance + 0.5))
}

function fillRoundRect (image, boxX, boxY, width, height, radius, rgba) {
  const { data, width: imgW, height: imgH } = bitmapOf(image)

  for (let y = 0; y < height; y++) {
    const py = boxY + y
    if (py < 0 || py >= imgH) continue

    for (let x = 0; x < width; x++) {
      const px = boxX + x
      if (px < 0 || px >= imgW) continue

      const coverage = roundRectCoverage(x, y, width, height, radius)
      if (coverage <= 0) continue

      blendPixel(data, ((py * imgW) + px) << 2, rgba, (rgba[3] / 255) * coverage)
    }
  }

  return image
}

function fillRect (image, x, y, width, height, rgba) {
  return fillRoundRect(image, x, y, width, height, 0, rgba)
}

function fillCircle (image, centerX, centerY, radius, rgba) {
  const { data, width: imgW, height: imgH } = bitmapOf(image)
  const startX = Math.max(0, Math.floor(centerX - radius))
  const endX = Math.min(imgW - 1, Math.ceil(centerX + radius))
  const startY = Math.max(0, Math.floor(centerY - radius))
  const endY = Math.min(imgH - 1, Math.ceil(centerY + radius))

  for (let py = startY; py <= endY; py++) {
    for (let px = startX; px <= endX; px++) {
      const distance = Math.hypot(px + 0.5 - centerX, py + 0.5 - centerY)
      const coverage = Math.max(0, Math.min(1, radius - distance + 0.5))
      if (coverage <= 0) continue

      blendPixel(data, ((py * imgW) + px) << 2, rgba, (rgba[3] / 255) * coverage)
    }
  }

  return image
}

// Angoli arrotondati applicati alla maschera alpha (usato per la cover).
function applyRoundedCorners (image, radius) {
  const { data, width, height } = bitmapOf(image)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const coverage = roundRectCoverage(x, y, width, height, radius)
      if (coverage >= 1) continue

      const index = ((y * width) + x) << 2
      data[index + 3] = Math.round(data[index + 3] * coverage)
    }
  }

  return image
}

// Sfumatura scura in basso: mantiene leggibili il nome utente e il logo
// anche quando la copertina di sfondo è chiara.
function fillBottomShadow (image, height, maxAlpha) {
  const { data, width, height: imgH } = bitmapOf(image)
  const startY = Math.max(0, imgH - height)
  const rows = Math.max(1, imgH - startY - 1)

  for (let y = startY; y < imgH; y++) {
    const alpha = Math.round(((y - startY) / rows) * maxAlpha)
    if (alpha <= 0) continue

    const rgba = [0, 0, 0, alpha]
    for (let x = 0; x < width; x++) {
      blendPixel(data, ((y * width) + x) << 2, rgba, alpha / 255)
    }
  }

  return image
}

// Sfumatura scura da sinistra a destra: dà contrasto costante alla
// colonna con titolo, artista, album e statistiche.
function fillRightShadow (image, startX, maxAlpha) {
  const { data, width, height } = bitmapOf(image)
  const span = Math.max(1, width - startX - 1)

  for (let x = Math.max(0, startX); x < width; x++) {
    const alpha = Math.round(((x - startX) / span) * maxAlpha)
    if (alpha <= 0) continue

    const rgba = [0, 0, 0, alpha]
    for (let y = 0; y < height; y++) {
      blendPixel(data, ((y * width) + x) << 2, rgba, alpha / 255)
    }
  }

  return image
}

function darkenBitmap (image, factor) {
  const { data } = bitmapOf(image)

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    data[i] = Math.round(data[i] * factor)
    data[i + 1] = Math.round(data[i + 1] * factor)
    data[i + 2] = Math.round(data[i + 2] * factor)
  }

  return image
}

// I font bitmap di jimp sono bianchi: moltiplicando i canali RGB si
// ottiene il colore scelto mantenendo l'anti-aliasing del glifo.
function tintBitmap (image, rgb) {
  const { data } = bitmapOf(image)

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    data[i] = Math.round((data[i] * rgb[0]) / 255)
    data[i + 1] = Math.round((data[i + 1] * rgb[1]) / 255)
    data[i + 2] = Math.round((data[i + 2] * rgb[2]) / 255)
  }

  return image
}

// ── Testo ──

function truncateText (ctx, font, text, maxWidth) {
  const value = String(text ?? '')
  if (textWidth(ctx, font, value) <= maxWidth) return value

  const ellipsis = '...'
  const ellipsisWidth = textWidth(ctx, font, ellipsis)
  let visible = ''

  for (const char of value) {
    if (textWidth(ctx, font, visible + char) + ellipsisWidth > maxWidth) break
    visible += char
  }

  return visible ? `${visible}${ellipsis}` : ellipsis
}

function wrapText (ctx, font, text, maxWidth, maxLines) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean)
  const lines = []
  let index = 0

  while (index < words.length && lines.length < maxLines) {
    let line = ''

    while (index < words.length) {
      const candidate = line ? `${line} ${words[index]}` : words[index]
      if (textWidth(ctx, font, candidate) > maxWidth) break
      line = candidate
      index++
    }

    if (!line) {
      lines.push(truncateText(ctx, font, words[index], maxWidth))
      index++
      continue
    }

    lines.push(line)
  }

  if (index < words.length && lines.length) {
    const last = lines.length - 1
    lines[last] = truncateText(ctx, font, `${lines[last]} ${words.slice(index).join(' ')}`, maxWidth)
  }

  return lines.length ? lines : ['']
}

// Riquadro (bounding box) dei pixel visibili di un'immagine.
function alphaBounds (image) {
  const { data, width, height } = bitmapOf(image)
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[((((y * width) + x) << 2) + 3)] <= 8) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  if (maxX < 0) return null
  return { x: minX, y: minY, width: (maxX - minX) + 1, height: (maxY - minY) + 1 }
}

// Disegna il testo su un layer trasparente e lo ritaglia sul riquadro
// visibile: così la posizione non dipende dalle metriche interne del font.
function makeTextLayer (ctx, font, text, color, fontSize) {
  const value = String(text ?? '')
  if (!value) return null

  const layer = newImage(
    ctx,
    Math.max(1, Math.ceil(textWidth(ctx, font, value)) + 4),
    Math.max(24, (fontSize * 2) + 24),
    0x00000000
  )

  // v0.x: print(font, x, y, text) — v1.x: print({ font, x, y, text })
  if (ctx.legacy) layer.print(font, 1, 1, value)
  else layer.print({ font, x: 1, y: 1, text: value })

  tintBitmap(layer, color)

  const bounds = alphaBounds(layer)
  if (!bounds) return null

  if (ctx.legacy) layer.crop(bounds.x, bounds.y, bounds.width, bounds.height)
  else layer.crop({ x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height })

  return layer
}

function drawText (ctx, image, font, text, x, y, color, options = {}) {
  const layer = makeTextLayer(ctx, font, text, color, options.fontSize || 16)
  if (!layer) return image

  const size = bitmapOf(layer)
  const drawX = options.align === 'right' ? Math.round(x - size.width) : Math.round(x)
  const drawY = options.centerY === undefined
    ? Math.round(y)
    : Math.round(options.centerY - (size.height / 2))

  image.composite(layer, drawX, drawY)

  return image
}

// ── Normalizzazione del testo ──
// I font bitmap di jimp coprono ASCII + Latin-1, quindi gli accenti si
// possono usare. Emoji e altri alfabeti vengono sostituiti con uno spazio
// (il testo completo resta comunque nel messaggio WhatsApp).

const CHAR_MAP = {
  'œ': 'oe',
  'ł': 'l',
  'đ': 'd',
  'ħ': 'h',
  'ı': 'i',
  'ğ': 'g',
  'ş': 's',
  'š': 's',
  'ž': 'z',
  'č': 'c',
  'ć': 'c',
  'ę': 'e',
  'ą': 'a',
  'ń': 'n',
  'ś': 's',
  'ź': 'z',
  'ż': 'z',
  'ř': 'r',
  'ů': 'u',
  'ť': 't',
  'ď': 'd',
  'ň': 'n'
}

function sanitizeCardText (value) {
  if (value === undefined || value === null) return ''

  return String(value)
    .normalize('NFC')
    .replace(/[\u2018\u2019\u201b`\u00b4]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7e\u00a1-\u00ff]/g, (char) => CHAR_MAP[char.toLowerCase()] || ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Recupero cover ──

function albumArtUrl (track) {
  const images = Array.isArray(track?.image) ? track.image : []
  const find = (size) => images.find((i) => i && i.size === size && i['#text'])?.['#text']
  return find('extralarge') || find('large') || find('medium') || ART_PLACEHOLDER
}

async function fetchArtBuffer (url) {
  if (!url) return null

  try {
    const res = await fetch(url, { timeout: 15000 })
    if (!res || !res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    return buffer.length > 100 ? buffer : null
  } catch (e) {
    console.warn('[cur] cover non scaricata:', e.message)
    return null
  }
}

// ── Card 800x400: cover a sinistra, informazioni a destra (solo jimp) ──

async function renderCardWithJimp (track, username) {
  const ctx = await getJimp()

  const songName = sanitizeCardText(track?.name) || 'Traccia sconosciuta'
  const artistName = sanitizeCardText(track?.artist?.['#text']) || 'Artista sconosciuto'
  const albumName = sanitizeCardText(track?.album?.['#text']) || 'Album sconosciuto'
  const userLabel = sanitizeCardText(username) || 'utente'
  const isPlaying = track?.['@attr']?.nowplaying === 'true'
  const accent = isPlaying ? ACCENT_PLAYING : ACCENT_IDLE
  const statusText = isPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO BRANO'

  const artBuffer = await fetchArtBuffer(albumArtUrl(track))
  const card = newImage(ctx, CARD_W, CARD_H, 0x111111ff)

  // Sfondo: cover sfocata e scurita
  if (artBuffer) {
    try {
      const background = await ctx.JimpClass.read(artBuffer)
      coverResize(ctx, background, 400, 200)
      try {
        background.blur(4)
      } catch (e) {
        console.warn('[cur] blur non disponibile:', e.message)
      }
      darkenBitmap(background, 0.28)
      resizeTo(ctx, background, CARD_W, CARD_H)
      card.composite(background, 0, 0)
    } catch (e) {
      console.warn('[cur] sfondo non generato:', e.message)
    }
  }

  // Sfumature scure: colonna info + fondo card (testi sempre leggibili)
  fillRightShadow(card, 380, 135)
  fillBottomShadow(card, 140, 150)

  // Cover con angoli arrotondati
  let coverDrawn = false

  if (artBuffer) {
    try {
      const cover = await ctx.JimpClass.read(artBuffer)
      coverResize(ctx, cover, COVER_BOX.size, COVER_BOX.size)
      applyRoundedCorners(cover, COVER_BOX.radius)
      card.composite(cover, COVER_BOX.x, COVER_BOX.y)
      coverDrawn = true
    } catch (e) {
      console.warn('[cur] cover non disegnata:', e.message)
    }
  }

  if (!coverDrawn) {
    fillRoundRect(
      card,
      COVER_BOX.x,
      COVER_BOX.y,
      COVER_BOX.size,
      COVER_BOX.size,
      COVER_BOX.radius,
      [40, 40, 40, 255]
    )
  }

  const pillFont = await getFont(12)
  const titleFont = await getFont(32)
  const artistFont = await getFont(16)
  const albumFont = await getFont(12)
  const smallFont = await getFont(12)

  const titleLines = wrapText(ctx, titleFont, songName, INFO_W, 2)
  let y = titleLines.length > 1 ? 96 : 118

  // Pill di stato (pallino + testo colorato)
  const pillHeight = 28
  const pillPadding = 14
  const dotRadius = 4
  const statusWidth = textWidth(ctx, pillFont, statusText)
  const pillWidth = Math.round((pillPadding * 2) + (dotRadius * 2) + 10 + statusWidth)

  fillRoundRect(
    card,
    INFO_X,
    y,
    pillWidth,
    pillHeight,
    pillHeight / 2,
    isPlaying ? [29, 185, 84, 48] : [255, 255, 255, 22]
  )
  fillCircle(card, INFO_X + pillPadding + dotRadius, y + (pillHeight / 2), dotRadius, [...accent, 255])
  drawText(
    ctx,
    card,
    pillFont,
    statusText,
    INFO_X + pillPadding + (dotRadius * 2) + 10,
    0,
    accent,
    { fontSize: 16, centerY: y + (pillHeight / 2) }
  )

  y += pillHeight + 12

  // Titolo (max 2 righe)
  for (const line of titleLines) {
    drawText(ctx, card, titleFont, line, INFO_X, y, COL_TITLE, { fontSize: 32 })
    y += 42
  }

  y += 4

  // Artista
  drawText(
    ctx,
    card,
    artistFont,
    truncateText(ctx, artistFont, artistName, INFO_W),
    INFO_X,
    y,
    COL_ARTIST,
    { fontSize: 16 }
  )
  y += 30

  // Album
  drawText(
    ctx,
    card,
    albumFont,
    truncateText(ctx, albumFont, albumName, INFO_W),
    INFO_X,
    y,
    COL_ALBUM,
    { fontSize: 12 }
  )
  y += 30

  // Divider
  fillRect(card, INFO_X, y, 40, 2, [...accent, 255])

  // Utente in basso a sinistra, logo Last.fm in basso a destra
  drawText(ctx, card, smallFont, userLabel, INFO_X, 344, COL_USER, { fontSize: 12 })
  drawText(ctx, card, smallFont, 'LAST.FM', CARD_W - 20, 344, COL_LOGO, { fontSize: 12, align: 'right' })

  return toPngBuffer(ctx, card)
}

const handler = async (m, { conn, args, usedPrefix, text, command }) => {

  if (command === 'setuser') {
    const username = (text || '').trim()
    if (!username) {
      return conn.sendMessage(m.chat, {
        text: `❌ Usa il comando così: ${usedPrefix + command} <username>`
      }, { quoted: m })
    }
    db.users[m.sender] = username
    saveDB()
    return conn.sendMessage(m.chat, {
      text: `✅ Username Last.fm impostato su *${username}*`
    }, { quoted: m })
  }

  if (command === 'curlike' || command === 'preferiti' || command === 'mypre') {
    const targetId = m.quoted && !m.quoted.fromMe
      ? m.quoted.sender
      : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender)

    const targetUsername = db.users[targetId]
    return conn.sendMessage(m.chat, {
      text: formatFavoriteList(targetId, targetId === m.sender ? '' : (targetUsername || targetId.split('@')[0]))
    }, { quoted: m })
  }

  if (command === 'scarica' || command === 'download' || command === 'downloadaudio') {
    const query = (text || '').trim() || (m.quoted?.text ? m.quoted.text : '')
    if (!query) {
      return conn.sendMessage(m.chat, {
        text: `❌ Usa: ${usedPrefix}${command} <titolo brano>`
      }, { quoted: m })
    }

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
    const result = await downloadAudioFromQuery(query)
    if (!result) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.sendMessage(m.chat, {
        text: '❌ Download audio non riuscito. Verifica che yt-dlp sia installato e aggiornato.'
      }, { quoted: m })
    }

    return conn.sendMessage(m.chat, {
      audio: result.buffer,
      mimetype: 'audio/mpeg',
      fileName: `${(result.title || 'audio').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`,
      caption: `🎵 *Download audio*\n${result.title}`
    }, { quoted: m })
  }

  const user = db.users[m.sender]
  if (!user) {
    return conn.sendMessage(m.chat, {
      text: `⚠️ Usa prima \`${usedPrefix}setuser <username>\` per collegare il tuo account Last.fm.`
    }, { quoted: m })
  }

  if (command === 'profilo' || command === 'cur') {
    const track = await getRecentTrack(user)
    if (!track) {
      return conn.sendMessage(m.chat, {
        text: '❌ Nessun brano trovato o utente inesistente su Last.fm.'
      }, { quoted: m })
    }

    const songTitle = track.name || 'Traccia sconosciuta'
    const artistName = track.artist?.['#text'] || 'Artista sconosciuto'
    const searchQuery = `${songTitle} ${artistName}`

    const [trackInfo, artistInfo] = await Promise.all([
      getTrackInfo(artistName, songTitle, user),
      getArtistInfo(artistName)
    ])

    const playCount      = trackInfo?.playcount      || 0
    const listeners      = trackInfo?.listeners      || 0
    const userPlayCount  = trackInfo?.userplaycount  || 0
    const artListeners   = artistInfo?.stats?.listeners  || 0
    const artPlaycount   = artistInfo?.stats?.playcount  || 0

    const caption = `
🎧 *Now Playing* • ${user}

🎵 *Brano:* ${songTitle}
👤 *Artista:* ${artistName}

📊 *Statistiche*
🔥 ${formatCount(playCount)} ascolti totali
👥 ${formatCount(listeners)} ascoltatori
🎤 ${formatCount(artListeners)} ascoltatori/mese dell'artista
💿 ${formatCount(artPlaycount)} ascolti in carriera
💫 Tu l'hai ascoltata ${formatCount(userPlayCount)} volte

🎬 Premi un pulsante sotto per ascoltarla o reagire 🔥
`.trim()

    const buttons = [
      { buttonId: `.like ${m.sender}`, buttonText: { displayText: '💜 𝐌𝐢 𝐩𝐢𝐚𝐜𝐞' }, type: 1 },
      { buttonId: `.fuoco ${m.sender}`, buttonText: { displayText: '🔥 𝐅𝐮𝐨𝐜𝐨' }, type: 1 },
      { buttonId: `.scarica ${searchQuery}`, buttonText: { displayText: '🎵 𝐒𝐜𝐚𝐫𝐢𝐜𝐚' }, type: 1 }
    ]

    let imageBuffer = null
    let cardError = null

    try {
      imageBuffer = await renderCardWithJimp(track, user)
    } catch (e) {
      cardError = e
      console.error('[cur] render card jimp error:', e.message)
    }

    if (!imageBuffer) {
      const hint = /Cannot find (module|package)|ERR_MODULE_NOT_FOUND/i.test(cardError?.message || '')
        ? '\n\n⚠️ _Card grafica non disponibile: manca il pacchetto *jimp* (su Termux: `npm i jimp`)._'
        : '\n\n⚠️ _Card grafica non disponibile, ecco i dettagli del brano._'
      const buttonMessage = {
        text: caption + hint,
        footer: '',
        buttons: buttons,
        headerType: 1
      }
      return conn.sendMessage(m.chat, buttonMessage, { quoted: m })
    }

    const buttonMessage = {
      image: imageBuffer,
      caption,
      buttons: buttons,
      headerType: 4
    }

    await conn.sendMessage(m.chat, buttonMessage, { quoted: m })

    return
  }

  if (command === 'top' || command === 'stats') {
    const artists = await getTopArtists(user)
    if (!artists || !artists.length) {
      return conn.sendMessage(m.chat, {
        text: '❌ Nessun dato trovato per gli ultimi 7 giorni.'
      }, { quoted: m })
    }

    const medals = ['🥇', '🥈', '🥉']
    const topList = artists
      .map((a, i) =>
        `${medals[i]} *${a.name}*\n📊 ${a.playcount} scrobble${parseInt(a.playcount) > 1 ? 's' : ''}`
      )
      .join('\n\n')

    return conn.sendMessage(m.chat, {
      text: `🏆 *Top artisti di ${user}* (ultimi 7 giorni)\n\n${topList}`
    }, { quoted: m })
  }

  if (command === 'like') {
    let targetUserId =
      m.quoted && !m.quoted.fromMe
        ? m.quoted.sender
        : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null)

    if (!targetUserId && args[0]) {
      const parsedArg = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      if (db.users[parsedArg]) {
        targetUserId = parsedArg
      }
    }

    targetUserId = targetUserId || m.sender

    const targetUsername = db.users[targetUserId]
    if (!targetUsername) {
      return conn.sendMessage(m.chat, {
        text: '❌ Quell\'utente non ha ancora registrato un account Last.fm.'
      }, { quoted: m })
    }

    const track = await getRecentTrack(targetUsername)
    if (!track) {
      return conn.sendMessage(m.chat, {
        text: '❌ Impossibile recuperare l\'ultimo brano dell\'utente.'
      }, { quoted: m })
    }

    const artist = track.artist?.['#text'] || 'Unknown'
    const songName = track.name || 'Unknown'

    const result = addFavorite(m.sender, artist, songName)

    if (result.alreadyFav) {
      return conn.sendMessage(m.chat, {
        text: `❤️ *${songName}* di *${artist}* è già tra i tuoi preferiti!`
      }, { quoted: m })
    }

    return conn.sendMessage(m.chat, {
      text: `❤️ Aggiunto *${songName}* di *${artist}* ai tuoi preferiti!\n📋 Guardali con ${usedPrefix}curlike`
    }, { quoted: m })
  }

  if (command === 'fuoco') {
    let targetUserId =
      m.quoted && !m.quoted.fromMe
        ? m.quoted.sender
        : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null)

    if (!targetUserId && args[0]) {
      const parsedArg = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      if (db.users[parsedArg]) {
        targetUserId = parsedArg
      }
    }

    if (!targetUserId) {
      return conn.sendMessage(m.chat, {
        text: '⚠️ Devi premere il bottone sotto la card, rispondere al messaggio di un utente o menzionarlo per dargli fuoco 🔥!'
      }, { quoted: m })
    }

    const targetUsername = db.users[targetUserId]
    if (!targetUsername) {
      return conn.sendMessage(m.chat, {
        text: '❌ Questo utente non ha ancora registrato un account Last.fm.'
      }, { quoted: m })
    }

    if (m.sender === targetUserId) {
      return conn.sendMessage(m.chat, {
        text: '🔥 Non puoi mettere a fuoco la tua stessa musica!'
      }, { quoted: m })
    }

    invalidateRecentCache(targetUsername)
    const track = await getRecentTrack(targetUsername)
    if (!track) {
      return conn.sendMessage(m.chat, {
        text: '❌ Impossibile recuperare i dettagli dell\'ultimo brano dell\'utente.'
      }, { quoted: m })
    }

    const artist = track.artist?.['#text'] || 'Unknown'
    const songName = track.name || 'Unknown'

    const songId = generateSongId(targetUsername, artist, songName)
    const result = addSongLike(songId, m.sender)

    if (result.alreadyLiked) {
      return conn.sendMessage(m.chat, {
        text: `⚠️ Hai già messo fuoco a "${songName}" ascoltata da ${targetUsername}!`
      }, { quoted: m })
    }

    const targetName = getUsernameFromId(targetUserId)
    return conn.sendMessage(m.chat, {
      text: `🔥 Hai messo fuoco a *${songName}* di *${targetName}*!`
    }, { quoted: m })
  }
}

handler.command = [
  'setuser', 'cur', 'stats', 'fuoco', 'like',
  'curlike', 'preferiti', 'mypre',
  'scarica', 'download', 'downloadaudio'
]
handler.tags = ['fun']
handler.group = true

export default handler