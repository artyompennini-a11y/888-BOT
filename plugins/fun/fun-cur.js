// Plugin by elixir, punisher & 888 staff

import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import yts from 'yt-search'
import axios from 'axios'
import { fileTypeFromBuffer } from 'file-type'

const BROWSERLESS_KEY = global.browserless

const DB_PATH = path.join(process.cwd(), 'db.json')

let db = { users: {}, likes: {}, favorites: {}, sessions: {}, durations: {} }
if (fs.existsSync(DB_PATH)) {
  try {
    const fileData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
    db = {
      users: fileData.users || {},
      likes: fileData.likes || {},
      favorites: fileData.favorites || {},
      sessions: fileData.sessions || {},
      durations: fileData.durations || {}
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

async function getRecentTracks(username, limit = 1) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${LASTFM_API_KEY}&format=json&limit=${limit}`
    const res = await fetch(url)
    if (!res.ok) return []
    const json = await res.json()
    const tracks = json?.recenttracks?.track
    return Array.isArray(tracks) ? tracks : (tracks ? [tracks] : [])
  } catch {
    return []
  }
}

async function getRecentTrack(username) {
  const tracks = await getRecentTracks(username, 1)
  return tracks[0] || null
}

// La durata non viene piu' mostrata: niente barra di avanzamento ne' orari.

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

// Endpoint e header forniti nell'incaricato. Sono placeholder: l'host
// 'rapidapi.com' e' il sito di RapidAPI (restituisce HTML, non JSON) e
// '://rapidapi.com' come X-RapidAPI-Host non e' un host valido.
// Basta correggere le due costanti qui sotto con i valori reali della
// tua sottoscrizione: il resto del codice non cambia.
const RAPIDAPI_SPOTIFY_HOST = 'rapidapi.com'
const RAPIDAPI_SPOTIFY_KEY = '20ff7f2cd1mshb51fc2fb29c558dp161e8cjsnd0140aaacfb0'

function cleanWhatsAppText(value) {
  return String(value ?? '').replace(/[*_~]/g, '').replace(/\s+/g, ' ').trim()
}

function formatMillisToClock(totalMs) {
  const ms = Number(totalMs)
  if (!Number.isFinite(ms) || ms <= 0) return ''
  return formatDuration(ms / 1000)
}

function readSpotifyTrack(json) {
  const item = json?.tracks?.items?.[0]?.data
  if (!item) return null

  const totalMs = Number(item?.duration?.totalMilliseconds)
  if (!Number.isFinite(totalMs) || totalMs <= 0) return null

  const title = cleanWhatsAppText(item.name || item.title || '')
  const artist = cleanWhatsAppText(
    item?.artists?.[0]?.name ||
    item?.artist?.name ||
    item?.artists?.name ||
    item?.subtitle ||
    ''
  )

  return { title, artist, totalMs }
}

async function searchSpotifyTrack(query) {
  const q = String(query || '').trim()
  if (!q) return null

  try {
    const url = `https://${RAPIDAPI_SPOTIFY_HOST}/search/?q=${encodeURIComponent(q)}&type=tracks&limit=1`
    const res = await fetch(url, {
      timeout: 12000,
      headers: {
        'X-RapidAPI-Host': RAPIDAPI_SPOTIFY_HOST,
        'X-RapidAPI-Key': RAPIDAPI_SPOTIFY_KEY,
        Accept: 'application/json'
      }
    })

    if (!res || !res.ok) {
      console.warn('[cur-spotify] HTTP ' + (res ? res.status : 'nessuna risposta'))
      return null
    }

    const raw = await res.text()
    let json = null
    try { json = JSON.parse(raw) } catch { json = null }

    if (!json) {
      console.warn('[cur-spotify] risposta non JSON: endpoint non configurato come API')
      return null
    }

    const parsed = readSpotifyTrack(json)
    if (!parsed) return null
    return { ...parsed, source: 'Spotify23' }
  } catch (e) {
    console.warn('[cur-spotify] errore:', e.message)
    return null
  }
}

function tidyChannelName(channel) {
  return cleanWhatsAppText(
    String(channel || '')
      .replace(/\s*-\s*topic$/i, '')
      .replace(/\s*vevo$/i, '')
      .replace(/\s*official\s*(music\s*)?video$/i, '')
  )
}

async function findTrackBySearch(query) {
  const q = String(query || '').trim()
  if (!q) return null

  if (!db.durations || typeof db.durations !== 'object') db.durations = {}
  const cacheKey = `q_${q.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')}`
  const cached = db.durations[cacheKey]
  if (cached) {
    return { title: cleanWhatsAppText(q), artist: '', totalMs: cached * 1000, source: 'yt-search' }
  }

  try {
    const vid = (await yts(q))?.videos?.[0]
    const seconds = Math.round(vid?.duration?.seconds || 0)
    if (seconds <= 0) return null

    db.durations[cacheKey] = seconds
    saveDB()

    return {
      title: cleanWhatsAppText(String(vid.title || q).split(/\s+-\s+/)[0]),
      artist: tidyChannelName(vid.channel),
      totalMs: seconds * 1000,
      source: 'yt-search'
    }
  } catch (e) {
    console.warn('[cur-search] errore:', e.message)
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
const COL_USER = [200, 200, 200]
const FALLBACK_LOGO_COLOR = [224, 0, 0]
const BOTTOM_Y = 344

let jimpCtx = null
const jimpFontCache = new Map()

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

function nearestFontSize (sizes, wanted) {
  return sizes
    .slice()
    .sort((a, b) => Math.abs(a - wanted) - Math.abs(b - wanted) || b - a)[0]
}

function hashString (value) {
  const str = String(value ?? '')
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function hslToRgb (h, s, l) {
  const hue = ((h % 360) + 360) % 360
  const c = (1 - Math.abs((2 * l) - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - (c / 2)

  let rgb
  if (hue < 60) rgb = [c, x, 0]
  else if (hue < 120) rgb = [x, c, 0]
  else if (hue < 180) rgb = [0, c, x]
  else if (hue < 240) rgb = [0, x, c]
  else if (hue < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]

  return rgb.map((v) => Math.max(0, Math.min(255, Math.round((v + m) * 255))))
}

function rgbToHsl (r, g, b) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2

  if (delta === 0) return { h: 0, s: 0, l }

  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let h
  if (max === rn) h = ((gn - bn) / delta) % 6
  else if (max === gn) h = (bn - rn) / delta + 2
  else h = (rn - gn) / delta + 4

  h *= 60
  if (h < 0) h += 360
  return { h, s, l }
}

// Colore stabile derivato dal testo: stesso brano -> stesso colore.
function colorFromSeed (seed) {
  const hue = hashString(seed) % 360
  return hslToRgb(hue, 0.68, 0.58)
}

// Colore dominante della copertina, pesato per saturazione.
function dominantColorFromBitmap (image) {
  const { data } = bitmapOf(image)

  const bins = new Array(24).fill(null).map(() => ({ weight: 0, r: 0, g: 0, b: 0 }))
  const step = Math.max(1, Math.floor(Math.sqrt(data.length / 4 / 4000)))

  for (let i = 0; i < data.length; i += 4 * step) {
    if (data[i + 3] < 128) continue

    const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2])
    if (s < 0.15 || l < 0.12 || l > 0.92) continue

    const bin = bins[Math.floor(h / 15) % 24]
    bin.weight += s
    bin.r += data[i]
    bin.g += data[i + 1]
    bin.b += data[i + 2]
  }

  let best = null
  for (const bin of bins) {
    if (bin.weight > 0 && (!best || bin.weight > best.weight)) best = bin
  }
  if (!best) return null

  const n = best.weight
  const avg = [best.r / n, best.g / n, best.b / n]

  // Riporta il colore a una luminosita' leggibile sullo sfondo scuro.
  const { h, s } = rgbToHsl(avg[0], avg[1], avg[2])
  return hslToRgb(h, Math.max(s, 0.5), 0.6)
}

let artColorUnavailable = false

async function resolveAccentColor (art, track) {
  const seed = `${track?.name || ''}|${track?.artist?.['#text'] || ''}`

  if (art?.buffer && !artColorUnavailable) {
    try {
      const ctx = await getJimp()
      const decoded = await ctx.JimpClass.read(art.buffer)
      const color = dominantColorFromBitmap(decoded)
      if (color) return color
    } catch (e) {
      artColorUnavailable = true
      console.warn('[cur] colore copertina non calcolabile:', e.message)
    }
  }

  return colorFromSeed(seed || '888')
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

function makeTextLayer (ctx, font, text, color, fontSize) {
  const value = String(text ?? '')
  if (!value) return null

  const layer = newImage(
    ctx,
    Math.max(1, Math.ceil(textWidth(ctx, font, value)) + 4),
    Math.max(24, (fontSize * 2) + 24),
    0x00000000
  )

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
  let drawX = Math.round(x)
  if (options.align === 'right') drawX = Math.round(x - size.width)
  else if (options.align === 'center') drawX = Math.round(x - (size.width / 2))

  const drawY = options.centerY === undefined
    ? Math.round(y)
    : Math.round(options.centerY - (size.height / 2))

  image.composite(layer, drawX, drawY)

  return image
}

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


const LASTFM_PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562f'
const MAX_ART_BYTES = 3 * 1024 * 1024

function isPlaceholderUrl (url) {
  const raw = String(url || '').trim()
  if (!raw) return true
  if (raw === ART_PLACEHOLDER) return true
  if (raw.includes(LASTFM_PLACEHOLDER_HASH)) return true
  
  if (/avatar\d*x\d*\.(png|jpe?g|gif|webp)$/i.test(raw)) return true
  return false
}

function albumArtUrl (track) {
  const images = Array.isArray(track?.image) ? track.image : []
  const find = (size) => images
    .find((i) => i && i.size === size && i['#text'] && !isPlaceholderUrl(i['#text']))?.['#text']
  return find('extralarge') || find('large') || find('medium') || ART_PLACEHOLDER
}

const MUSICBRAINZ_UA = '888BOT/1.3 ( https://github.com/artyompennini-a11y/888-BOT )'

function normalizeForSearch(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/\b(feat|ft|with)\b.*$/i, ' ')
    .replace(/\b(remaster|remastered|version|edit|mix|live)\b.*$/i, ' ')
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function looksLikeMatch(trackName, candidate) {
  const wanted = normalizeForSearch(trackName)
  const found = normalizeForSearch(candidate)
  if (!wanted || !found) return false
  if (wanted === found) return true
  return wanted.length >= 4 && (found.includes(wanted) || wanted.includes(found))
}

async function downloadArt(url) {
  if (!url || isPlaceholderUrl(url)) return null

  try {
    const res = await fetch(url, {
      timeout: 15000,
      size: MAX_ART_BYTES,
      redirect: 'follow',
      headers: { 'User-Agent': MUSICBRAINZ_UA, Accept: 'image/*,*/*;q=0.8' }
    })
    if (!res || !res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 1024) return null

    const type = await fileTypeFromBuffer(buffer)
    if (!type?.mime || !type.mime.startsWith('image/')) return null

    return { buffer, mime: type.mime }
  } catch {
    return null
  }
}

async function findArtOnItunes(songTitle, artistName) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(`${songTitle} ${artistName}`)}&entity=song&limit=5`
    const res = await fetch(url, { timeout: 10000 })
    if (!res.ok) return null
    const json = await res.json()
    const hits = Array.isArray(json?.results) ? json.results : []
    const match = hits.find((r) => r?.artworkUrl100 && looksLikeMatch(songTitle, r.trackName))
    if (!match) return null

    const art = String(match.artworkUrl100).replace(/\/\d+x\d+bb\.(jpg|png)$/i, '/600x600bb.$1')
    const downloaded = await downloadArt(art)
    return downloaded ? { ...downloaded, url: art, source: 'iTunes' } : null
  } catch {
    return null
  }
}

async function findArtOnDeezer(songTitle, artistName) {
  try {
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(`${songTitle} ${artistName}`)}&limit=5`
    const res = await fetch(url, { timeout: 10000 })
    if (!res.ok) return null
    const json = await res.json()
    const hits = Array.isArray(json?.data) ? json.data : []
    const match = hits.find((d) => d?.album?.cover_xl && looksLikeMatch(songTitle, d.title))
    if (!match) return null

    const art = String(match.album.cover_xl)
    const downloaded = await downloadArt(art)
    return downloaded ? { ...downloaded, url: art, source: 'Deezer' } : null
  } catch {
    return null
  }
}

async function findArtOnMusicBrainz(songTitle, artistName, albumName) {
  const album = String(albumName || '').trim()
  const queries = album
    ? [`release:"${album}" AND artist:"${artistName}"`, `release:"${album}"`]
    : [`release:"${albumName || songTitle}"`, `release:"${artistName} ${songTitle}"`]

  for (const query of queries) {
    try {
      const url = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json&limit=5`
      const res = await fetch(url, {
        timeout: 12000,
        headers: { 'User-Agent': MUSICBRAINZ_UA, Accept: 'application/json' }
      })
      if (!res.ok) continue
      const json = await res.json()
      const releases = Array.isArray(json?.releases) ? json.releases : []
      if (!releases.length) continue

      for (const release of releases) {
        if (!release?.id) continue
        const art = `https://coverartarchive.org/release/${release.id}/front-500`
        const downloaded = await downloadArt(art)
        if (downloaded) return { ...downloaded, url: art, source: 'MusicBrainz' }
      }
    } catch {
      break
    }
  }

  return null
}

async function resolveCoverArt(track) {
  const songTitle = String(track?.name || '')
  const artistName = String(track?.artist?.['#text'] || '')
  const albumName = String(track?.album?.['#text'] || '')

  const lastfm = albumArtUrl(track)
  if (!isPlaceholderUrl(lastfm)) {
    const downloaded = await downloadArt(lastfm)
    if (downloaded) return { ...downloaded, url: lastfm, source: 'Last.fm' }
    console.warn('[cur] copertina Last.fm non valida, provo le altre API')
  }

  const providers = [
    () => findArtOnItunes(songTitle, artistName),
    () => findArtOnDeezer(songTitle, artistName),
    () => findArtOnMusicBrainz(songTitle, artistName, albumName)
  ]

  for (const provider of providers) {
    try {
      const found = await provider()
      if (found?.buffer) return found
    } catch (e) {
      console.warn('[cur] ricerca copertina fallita:', e?.message || e)
    }
  }

  return { url: null, source: null, buffer: null, mime: null }
}

async function fetchArtBuffer (art, track) {
  if (art?.buffer) return art.buffer

  const fallback = albumArtUrl(track)
  if (isPlaceholderUrl(fallback)) return null

  try {
    const res = await fetch(fallback, {
      timeout: 15000,
      size: MAX_ART_BYTES,
      redirect: 'follow',
      headers: { 'User-Agent': MUSICBRAINZ_UA }
    })
    if (!res || !res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    return buffer.length > 1024 ? buffer : null
  } catch (e) {
    console.warn('[cur] cover non scaricata:', e.message)
    return null
  }
}

function cardHtmlTemplate(v) {
  return `
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        width: ${CARD_W}px; height: ${CARD_H}px;
        background: #111111;
        font-family: 'Inter', 'Segoe UI', sans-serif;
        overflow: hidden;
      }
      .bg {
        position: absolute; inset: 0;
        background-image: url('${v.safeArt}');
        background-size: cover; background-position: center;
        filter: blur(6px) brightness(0.28);
        transform: scale(1.06);
      }
      .shade-right {
        position: absolute; top: 0; right: 0; width: 420px; height: ${CARD_H}px;
        background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.53) 100%);
      }
      .shade-bottom {
        position: absolute; left: 0; bottom: 0; width: ${CARD_W}px; height: 140px;
        background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.59) 100%);
      }
      .cover {
        position: absolute; left: ${COVER_BOX.x}px; top: ${COVER_BOX.y}px;
        width: ${COVER_BOX.size}px; height: ${COVER_BOX.size}px;
        border-radius: ${COVER_BOX.radius}px;
        ${v.coverStyle}
        background-size: cover; background-position: center;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      }
      .info {
        position: absolute;
        left: ${INFO_X}px; top: 0;
        width: ${INFO_W}px; height: ${CARD_H}px;
        padding: 40px 16px 0 0;
        display: flex; flex-direction: column;
        align-items: center; text-align: center;
      }
      .pill {
        display: inline-flex; align-items: center; gap: 8px;
        align-self: center;
        height: 28px; padding: 0 14px;
        border-radius: 14px;
        background: ${v.isPlaying ? 'rgba(29, 185, 84, 0.19)' : 'rgba(255, 255, 255, 0.086)'};
        font-size: 12px; font-weight: 700; letter-spacing: 0.6px;
        color: ${v.accentCss};
      }
      .pill .dot { width: 8px; height: 8px; border-radius: 50%; background: ${v.accentCss}; }
      .title {
        margin-top: 16px;
        color: #ffffff;
        font-size: 32px; font-weight: 700; line-height: 1.28;
        max-width: 100%;
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        overflow: hidden; word-break: break-word;
      }
      .artist {
        margin-top: 12px;
        color: rgb(${COL_ARTIST.join(',')});
        font-size: 16px; font-weight: 500;
        max-width: 100%;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .album {
        margin-top: 10px;
        color: rgb(${COL_ALBUM.join(',')});
        font-size: 13px; font-weight: 500;
        max-width: 100%;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .bottom {
        margin-top: auto;
        margin-bottom: 30px;
        width: 100%;
        display: flex; align-items: center; justify-content: space-between;
        font-size: 12px; font-weight: 500;
      }
      .logo { color: ${v.logoCss}; font-weight: 700; letter-spacing: 0.5px; }
      .user {
        color: rgb(${COL_USER.join(',')});
        max-width: 250px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
    </style>
  </head>
  <body>
    <div class="bg"></div>
    <div class="shade-right"></div>
    <div class="shade-bottom"></div>
    <div class="cover"></div>
    <div class="info">
      <div class="pill"><span class="dot"></span>${v.statusText}</div>
      <div class="title">${v.title}</div>
      <div class="artist">${v.artist}</div>
      <div class="album">${v.album}</div>
      <div class="bottom">
        <span class="logo">LAST.FM</span>
        <span class="user">${v.user}</span>
      </div>
    </div>
  </body>
  </html>`
}

function rgbToCss(rgb, alpha = 1) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

function escapeHtmlText(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildCardHtml(track, username, logoColor, art = null) {
  const songName = String(track?.name || 'Traccia sconosciuta')
  const artistName = String(track?.artist?.['#text'] || 'Artista sconosciuto')
  const albumName = String(track?.album?.['#text'] || 'Album sconosciuto')
  const userLabel = String(username || 'utente')
  const isPlaying = track?.['@attr']?.nowplaying === 'true'
  const accent = isPlaying ? ACCENT_PLAYING : ACCENT_IDLE
  const accentCss = rgbToCss(accent)
  const logoCss = rgbToCss(logoColor || FALLBACK_LOGO_COLOR)
  const statusText = isPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO BRANO'

  const artUri = art?.buffer
    ? `data:${art.mime || 'image/jpeg'};base64,${art.buffer.toString('base64')}`
    : ''
  const artUrl = artUri || (art?.url && !isPlaceholderUrl(art.url) ? escapeHtmlText(art.url) : '')
  const safeArt = artUrl
  const coverStyle = safeArt
    ? `background-image: url('${safeArt}');`
    : 'background: linear-gradient(135deg, #2a2a2a, #151515);'

  return cardHtmlTemplate({
    safeArt,
    coverStyle,
    accentCss,
    logoCss,
    isPlaying,
    statusText: escapeHtmlText(statusText),
    title: escapeHtmlText(songName),
    artist: escapeHtmlText(artistName),
    album: escapeHtmlText(albumName),
    user: escapeHtmlText(userLabel)
  })
}

async function renderCardWithBrowserless(track, username, logoColor, art = null) {
  const html = buildCardHtml(track, username, logoColor, art)

  for (let i = 0; i < 3; i++) {
    try {
      const response = await axios.post(
        `https://chrome.browserless.io/screenshot?token=${BROWSERLESS_KEY}`,
        {
          html,
          options: { type: 'jpeg', quality: 92 },
          viewport: { width: CARD_W, height: CARD_H }
        },
        { responseType: 'arraybuffer', timeout: 20000 }
      )
      const buffer = Buffer.from(response.data)
      if (!buffer.length) throw new Error('risposta vuota da browserless')
      return buffer
    } catch (e) {
      if (i === 2) throw e
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
  }
}

async function renderCard(track, username, art = null) {
  const logoColor = await resolveAccentColor(art, track)

  if (BROWSERLESS_KEY) {
    try {
      return await renderCardWithBrowserless(track, username, logoColor, art)
    } catch (e) {
      console.error('[cur] Browserless fallito, uso Jimp:', e?.message || e)
    }
  }
  return renderCardWithJimp(track, username, logoColor, art)
}

async function renderCardWithJimp (track, username, logoColor, art = null) {
  const ctx = await getJimp()

  const songName = sanitizeCardText(track?.name) || 'Traccia sconosciuta'
  const artistName = sanitizeCardText(track?.artist?.['#text']) || 'Artista sconosciuto'
  const albumName = sanitizeCardText(track?.album?.['#text']) || 'Album sconosciuto'
  const userLabel = sanitizeCardText(username) || 'utente'
  const isPlaying = track?.['@attr']?.nowplaying === 'true'
  const accent = isPlaying ? ACCENT_PLAYING : ACCENT_IDLE
  const statusText = isPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO BRANO'

  const artBuffer = await fetchArtBuffer(art, track)
  const card = newImage(ctx, CARD_W, CARD_H, 0x111111ff)

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

  fillRightShadow(card, 380, 135)
  fillBottomShadow(card, 140, 150)

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

  // Il blocco centrale e' allineato al centro della colonna info.
  const centerX = INFO_X + Math.round(INFO_W / 2)

  const titleLines = wrapText(ctx, titleFont, songName, INFO_W, 2)
  let y = titleLines.length > 1 ? 96 : 118

  const pillHeight = 28
  const pillPadding = 14
  const dotRadius = 4
  const statusWidth = textWidth(ctx, pillFont, statusText)
  const pillWidth = Math.round((pillPadding * 2) + (dotRadius * 2) + 10 + statusWidth)
  const pillX = Math.round(centerX - (pillWidth / 2))

  fillRoundRect(
    card,
    pillX,
    y,
    pillWidth,
    pillHeight,
    pillHeight / 2,
    isPlaying ? [29, 185, 84, 48] : [255, 255, 255, 22]
  )
  fillCircle(card, pillX + pillPadding + dotRadius, y + (pillHeight / 2), dotRadius, [...accent, 255])
  drawText(
    ctx,
    card,
    pillFont,
    statusText,
    pillX + pillPadding + (dotRadius * 2) + 10,
    0,
    accent,
    { fontSize: 16, centerY: y + (pillHeight / 2) }
  )

  y += pillHeight + 12

  for (const line of titleLines) {
    drawText(ctx, card, titleFont, line, centerX, y, COL_TITLE, { fontSize: 32, align: 'center' })
    y += 42
  }

  y += 4

  drawText(
    ctx,
    card,
    artistFont,
    truncateText(ctx, artistFont, artistName, INFO_W),
    centerX,
    y,
    COL_ARTIST,
    { fontSize: 16, align: 'center' }
  )
  y += 30

  drawText(
    ctx,
    card,
    albumFont,
    truncateText(ctx, albumFont, albumName, INFO_W),
    centerX,
    y,
    COL_ALBUM,
    { fontSize: 12, align: 'center' }
  )

  // Logo colorato con il dominante della copertina (fallback: colore del brano).
  const logo = logoColor || FALLBACK_LOGO_COLOR

  drawText(ctx, card, smallFont, 'LAST.FM', INFO_X, BOTTOM_Y, logo, { fontSize: 12 })
  drawText(
    ctx,
    card,
    smallFont,
    truncateText(ctx, smallFont, userLabel, INFO_W - 90),
    CARD_W - 20,
    BOTTOM_Y,
    COL_USER,
    { fontSize: 12, align: 'right' }
  )

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

  if (command === 'cur' && (text || '').trim()) {
    const query = text.trim()
    await conn.sendMessage(m.chat, { react: { text: '🔎', key: m.key } })

    const found = (await searchSpotifyTrack(query)) || (await findTrackBySearch(query))
    if (!found) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.sendMessage(m.chat, {
        text: `❌ Nessun brano trovato per *${cleanWhatsAppText(query)}*.\n\n💡 Prova con titolo e artista, es. \`${usedPrefix}cur Battiato Centro di gravità\``
      }, { quoted: m })
    }

    const title = found.title || cleanWhatsAppText(query)
    const artistLine = found.artist ? ` - _${found.artist}_` : ''
    const duration = formatMillisToClock(found.totalMs)

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    return conn.sendMessage(m.chat, {
      text: `🎵 *${title}*${artistLine}\n⏱️ Durata: *${duration}*`
    }, { quoted: m })
  }

  const user = db.users[m.sender]
  if (!user) {
    return conn.sendMessage(m.chat, {
      text: `⚠️ Usa prima \`${usedPrefix}setuser <username>\` per collegare il tuo account Last.fm.`
    }, { quoted: m })
  }

  if (command === 'profilo' || command === 'cur') {
    const tracks = await getRecentTracks(user, 2)
    const track = tracks[0]
    if (!track) {
      return conn.sendMessage(m.chat, {
        text: '❌ Nessun brano trovato o utente inesistente su Last.fm.'
      }, { quoted: m })
    }

    const songTitle = track.name || 'Traccia sconosciuta'
    const artistName = track.artist?.['#text'] || 'Artista sconosciuto'
    const albumName = track.album?.['#text'] || 'Album sconosciuto'
    const searchQuery = `${songTitle} ${artistName}`

    const [trackInfo, artistInfo, art] = await Promise.all([
      getTrackInfo(artistName, songTitle, user),
      getArtistInfo(artistName),
      resolveCoverArt(track)
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
💿 *Album:* ${albumName}

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
      imageBuffer = await renderCard(track, user, art)
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
