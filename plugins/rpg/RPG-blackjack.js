// Plugin by Elixir
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Jimp from 'jimp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..', '..')

const BJ_DIR = path.join(ROOT_DIR, 'img', 'bj')
const CARDS_DIR = path.join(BJ_DIR, 'cards')
const TABLE_FILE = path.join(BJ_DIR, 'tavolo.png')
const BACK_FILE = path.join(CARDS_DIR, 'back.png')

const TABLE_W = 900
const TABLE_H = 660
const CARD_W = 130
const CARD_H = 190
const CARD_STEP = 62
const DEALER_Y = 96
const PLAYER_Y = 350
const BANNER_Y = 288
const BANNER_H = 46

const MIN_BET = 50
const MAX_BET = 1000000
const DEFAULT_BET = 50
const TURN_TIMEOUT = 120000
const DEALER_STAND = 17
const BLACKJACK_PAYOUT = 1.5

const SUITS = [
  { key: 'h', label: 'Cuori', emoji: '♥️', color: { r: 198, g: 34, b: 46 } },
  { key: 'd', label: 'Quadri', emoji: '♦️', color: { r: 198, g: 34, b: 46 } },
  { key: 'c', label: 'Fiori', emoji: '♣️', color: { r: 22, g: 22, b: 28 } },
  { key: 's', label: 'Picche', emoji: '♠️', color: { r: 22, g: 22, b: 28 } }
]

const RANKS = [
  { rank: 1, label: 'A' },
  { rank: 2, label: '2' },
  { rank: 3, label: '3' },
  { rank: 4, label: '4' },
  { rank: 5, label: '5' },
  { rank: 6, label: '6' },
  { rank: 7, label: '7' },
  { rank: 8, label: '8' },
  { rank: 9, label: '9' },
  { rank: 10, label: '10' },
  { rank: 11, label: 'J' },
  { rank: 12, label: 'Q' },
  { rank: 13, label: 'K' }
]

const SUIT_BY_KEY = new Map(SUITS.map((s) => [s.key, s]))
const RANK_BY_VALUE = new Map(RANKS.map((r) => [r.rank, r]))

const FELT_LIGHT = { r: 22, g: 108, b: 56 }
const FELT_DARK = { r: 6, g: 46, b: 26 }
const GOLD = { r: 212, g: 175, b: 55 }
const BAND = { r: 4, g: 18, b: 10 }
const WHITE = { r: 255, g: 255, b: 255 }
const CARD_BODY = { r: 252, g: 250, b: 244 }
const CARD_BORDER = { r: 14, g: 14, b: 18 }

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))
const rgb = (r, g, b, a = 1) => ({ r, g, b, a })
const mixRgb = (c1, c2, t) => rgb(
  c1.r + (c2.r - c1.r) * t,
  c1.g + (c2.g - c1.g) * t,
  c1.b + (c2.b - c1.b) * t,
  (c1.a ?? 1) + ((c2.a ?? 1) - (c1.a ?? 1)) * t
)

const yieldLoop = () => new Promise((resolve) => setImmediate(resolve))

const asciiText = (text, fallback = '') => {
  const clean = String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return clean || fallback
}

const truncate = (text, max) => (text.length > max ? `${text.slice(0, Math.max(1, max - 3))}...` : text)

const blendPixel = (img, px, py, color, alpha = 1) => {
  const x = Math.round(px)
  const y = Math.round(py)
  if (x < 0 || y < 0 || x >= img.bitmap.width || y >= img.bitmap.height) return
  const a = clamp01(alpha) * clamp01(color.a == null ? 1 : color.a)
  if (a <= 0) return
  const i = (y * img.bitmap.width + x) * 4
  const d = img.bitmap.data
  const ia = 1 - a
  d[i] = clamp255(color.r * a + d[i] * ia)
  d[i + 1] = clamp255(color.g * a + d[i + 1] * ia)
  d[i + 2] = clamp255(color.b * a + d[i + 2] * ia)
  d[i + 3] = clamp255(255 * a + d[i + 3] * ia)
}

const insideRoundRect = (box, u, v, radius) => {
  const x = u * box.w
  const y = v * box.h
  if (x < 0 || y < 0 || x > box.w || y > box.h) return false
  let cx = null
  let cy = null
  if (x < radius) cx = radius
  else if (x > box.w - radius) cx = box.w - radius
  if (y < radius) cy = radius
  else if (y > box.h - radius) cy = box.h - radius
  if (cx === null || cy === null) return true
  return Math.hypot(x - cx, y - cy) <= radius
}

const paintShape = async (img, box, inside, color, { alpha = 1, samples = 3, yieldEvery = 48 } = {}) => {
  const colorAt = typeof color === 'function' ? color : () => color
  const x0 = Math.max(0, Math.floor(box.x))
  const y0 = Math.max(0, Math.floor(box.y))
  const x1 = Math.min(img.bitmap.width, Math.ceil(box.x + box.w))
  const y1 = Math.min(img.bitmap.height, Math.ceil(box.y + box.h))

  for (let py = y0; py < y1; py++) {
    const vc = (py + 0.5 - box.y) / box.h
    for (let px = x0; px < x1; px++) {
      let hits = 0
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const u = (px - box.x + (sx + 0.5) / samples) / box.w
          const v = (py - box.y + (sy + 0.5) / samples) / box.h
          if (u < 0 || u > 1 || v < 0 || v > 1) continue
          if (inside(u, v)) hits++
        }
      }
      if (!hits) continue
      const coverage = hits / (samples * samples)
      blendPixel(img, px, py, colorAt((px + 0.5 - box.x) / box.w, vc), alpha * coverage)
    }
    if ((py - y0) % yieldEvery === 0) await yieldLoop()
  }
}

const fillRect = (img, x, y, w, h, color, options) =>
  paintShape(img, { x, y, w, h }, () => true, color, { samples: 1, ...options })

const fillRoundRect = (img, x, y, w, h, radius, color, options) => {
  const box = { x, y, w, h }
  return paintShape(img, box, (u, v) => insideRoundRect(box, u, v, radius), color, options)
}

const shapeHeart = (u, v) => {
  const x = (u - 0.5) * 2.4
  const y = (0.62 - v) * 2.4
  const a = x * x + y * y - 1
  return a * a * a - x * x * y * y * y <= 0
}

const shapeDiamond = (u, v) => Math.abs(u - 0.5) / 0.5 + Math.abs(v - 0.5) / 0.5 <= 1

const shapeSpade = (u, v) => {
  const x = (u - 0.5) * 2.4
  const y = (0.62 - (1 - v)) * 2.4
  const a = x * x + y * y - 1
  const heart = a * a * a - x * x * y * y * y <= 0
  const stem = u > 0.44 && u < 0.56 && v > 0.5 && v < 0.96
  return heart || stem
}

const shapeClub = (u, v) => {
  const circle = (cx, cy, r) => Math.hypot(u - cx, v - cy) <= r
  const stem = u > 0.44 && u < 0.56 && v > 0.52 && v < 0.96
  const base = u > 0.32 && u < 0.68 && v > 0.86 && v < 0.98
  return circle(0.5, 0.28, 0.22) || circle(0.28, 0.62, 0.22) || circle(0.72, 0.62, 0.22) || stem || base
}

const SHAPES = { h: shapeHeart, d: shapeDiamond, c: shapeClub, s: shapeSpade }

const drawSuit = (img, suitKey, cx, cy, size, color, options) => {
  const shape = SHAPES[suitKey] ?? shapeDiamond
  const box = { x: cx - size / 2, y: cy - size / 2, w: size, h: size }
  return paintShape(img, box, shape, color, options)
}

const FONT_KEYS = {
  small: Jimp.FONT_SANS_16_WHITE,
  smallBlack: Jimp.FONT_SANS_16_BLACK,
  medium: Jimp.FONT_SANS_32_WHITE,
  mediumBlack: Jimp.FONT_SANS_32_BLACK
}

const fontCache = new Map()

const getFont = async (key) => {
  const name = FONT_KEYS[key]
  if (!name) throw new Error(`Font sconosciuto: ${key}`)
  if (!fontCache.has(key)) fontCache.set(key, Jimp.loadFont(name))
  return fontCache.get(key)
}

const printShadowed = (img, font, x, y, label, color) => {
  const width = Math.max(1, Jimp.measureText(font, label))
  const height = Math.max(1, Jimp.measureTextHeight(font, label, Math.max(width, 1000)))
  const layer = new Jimp(width, height, 0x00000000)
  layer.print(font, 0, 0, label)
  const d = layer.bitmap.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    d[i] = clamp255(color.r)
    d[i + 1] = clamp255(color.g)
    d[i + 2] = clamp255(color.b)
  }
  img.composite(layer, Math.round(x), Math.round(y))
}

const printText = async (img, fontKey, x, y, text, { color = WHITE, align = 'left', maxChars = 46 } = {}) => {
  const font = await getFont(fontKey)
  const label = truncate(asciiText(text), maxChars)
  if (!label) return
  const width = Jimp.measureText(font, label)
  const posX = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x
  if (color !== WHITE) return printShadowed(img, font, posX, y, label, color)
  img.print(font, Math.round(posX), Math.round(y), label)
}

const spriteCache = new Map()
let tableCache = null
let dirsReady = false

const ensureAssetDirs = () => {
  if (dirsReady) return
  dirsReady = true
  try {
    fs.mkdirSync(CARDS_DIR, { recursive: true })
  } catch {}
}

const persistAsset = (img, file) => {
  img
    .clone()
    .getBufferAsync(Jimp.MIME_PNG)
    .then((buffer) => fs.promises.writeFile(file, buffer))
    .catch(() => {})
}

const buildCardSprite = async (suitKey, rank) => {
  const suit = SUIT_BY_KEY.get(suitKey) ?? SUITS[0]
  const rankLabel = (RANK_BY_VALUE.get(rank) ?? RANKS[0]).label
  const img = new Jimp(CARD_W, CARD_H, 0x00000000)

  await fillRoundRect(img, 0, 0, CARD_W, CARD_H, 14, CARD_BORDER)
  await fillRoundRect(img, 4, 4, CARD_W - 8, CARD_H - 8, 11, CARD_BODY)

  const font = await getFont('mediumBlack')
  img.print(font, 12, 8, rankLabel)
  const labelWidth = Jimp.measureText(font, rankLabel)
  img.print(font, CARD_W - 12 - labelWidth, CARD_H - 46, rankLabel)

  await drawSuit(img, suitKey, CARD_W / 2, CARD_H / 2 - 10, 62, suit.color, { samples: 4 })

  if (rank >= 11) {
    const faceFont = await getFont('smallBlack')
    const faceLabel = (RANK_BY_VALUE.get(rank) ?? RANKS[0]).label
    const faceWidth = Jimp.measureText(faceFont, faceLabel)
    img.print(faceFont, Math.round(CARD_W / 2 - faceWidth / 2), Math.round(CARD_H / 2 + 24), faceLabel)
  }

  return img
}

const buildCardBack = async () => {
  const img = new Jimp(CARD_W, CARD_H, 0x00000000)
  await fillRoundRect(img, 0, 0, CARD_W, CARD_H, 14, CARD_BORDER)
  await fillRoundRect(img, 4, 4, CARD_W - 8, CARD_H - 8, 11, rgb(24, 46, 122))
  await fillRoundRect(
    img,
    10,
    10,
    CARD_W - 20,
    CARD_H - 20,
    8,
    (u, v) => ((Math.round(u * CARD_W) + Math.round(v * CARD_H)) % 16 < 4 ? rgb(38, 70, 168) : rgb(24, 46, 122)),
    { samples: 1 }
  )
  await printText(img, 'medium', CARD_W / 2, CARD_H / 2 - 18, '888', { align: 'center', maxChars: 8 })
  return img
}

const loadCardSprite = async (suitKey, rank) => {
  const key = `${suitKey}${rank}`
  if (spriteCache.has(key)) return spriteCache.get(key)

  ensureAssetDirs()
  const file = path.join(CARDS_DIR, `${key}.png`)
  let sprite = null

  if (fs.existsSync(file)) {
    try {
      sprite = await Jimp.read(file)
    } catch {
      sprite = null
    }
  }

  if (!sprite) {
    sprite = await buildCardSprite(suitKey, rank)
    persistAsset(sprite, file)
  }

  spriteCache.set(key, sprite)
  return sprite
}

const loadCardBack = async () => {
  if (spriteCache.has('back')) return spriteCache.get('back')

  ensureAssetDirs()
  let back = null
  if (fs.existsSync(BACK_FILE)) {
    try {
      back = await Jimp.read(BACK_FILE)
    } catch {
      back = null
    }
  }

  if (!back) {
    back = await buildCardBack()
    persistAsset(back, BACK_FILE)
  }

  spriteCache.set('back', back)
  return back
}

const buildTableBase = async () => {
  const img = new Jimp(TABLE_W, TABLE_H, 0x00000000)
  const feltBox = { x: 14, y: 14, w: TABLE_W - 28, h: TABLE_H - 28 }
  const cx = TABLE_W / 2
  const cy = TABLE_H / 2
  const maxDist = Math.hypot(cx, cy)

  await fillRoundRect(img, 0, 0, TABLE_W, TABLE_H, 26, GOLD)
  await paintShape(
    img,
    feltBox,
    (u, v) => insideRoundRect(feltBox, u, v, 22),
    (u, v) => {
      const x = u * feltBox.w
      const y = v * feltBox.h
      const vignette = Math.min(1, Math.hypot(x - cx, y - cy) / maxDist)
      const base = mixRgb(FELT_LIGHT, FELT_DARK, Math.pow(vignette, 0.85))
      return mixRgb(base, FELT_DARK, v * 0.25)
    },
    { samples: 2 }
  )

  await fillRect(img, 0, 0, TABLE_W, 64, BAND, { alpha: 0.82 })
  await fillRect(img, 0, TABLE_H - 70, TABLE_W, 70, BAND, { alpha: 0.82 })

  return img
}

const loadTableBase = async () => {
  if (tableCache) return tableCache

  ensureAssetDirs()
  let base = null

  if (fs.existsSync(TABLE_FILE)) {
    try {
      base = (await Jimp.read(TABLE_FILE)).cover(TABLE_W, TABLE_H)
    } catch {
      base = null
    }
  }

  if (!base) {
    base = await buildTableBase()
    persistAsset(base, TABLE_FILE)
  }

  tableCache = base
  return base
}

const fitSprite = (sprite) =>
  sprite.bitmap.width === CARD_W && sprite.bitmap.height === CARD_H ? sprite : sprite.clone().resize(CARD_W, CARD_H)

const cardsStep = (count) => {
  if (count <= 1) return CARD_STEP
  const available = TABLE_W - 150 - CARD_W
  return Math.max(34, Math.min(CARD_STEP, Math.floor(available / (count - 1))))
}

const drawCardsRow = async (img, cards, y, { hideFrom = null } = {}) => {
  const step = cardsStep(cards.length)
  const width = CARD_W + Math.max(0, cards.length - 1) * step
  const startX = Math.round((TABLE_W - width) / 2)
  const back = hideFrom === null ? null : fitSprite(await loadCardBack())

  for (let i = 0; i < cards.length; i++) {
    const hidden = hideFrom !== null && i >= hideFrom
    const sprite = hidden ? back : fitSprite(await loadCardSprite(cards[i].suit, cards[i].rank))
    img.composite(sprite, startX + Math.round(i * step), y)
    if (i % 4 === 3) await yieldLoop()
  }
}

const RESULT_TONES = {
  win: rgb(24, 122, 62),
  blackjack: rgb(120, 84, 214),
  lose: rgb(150, 32, 32),
  push: rgb(58, 63, 107),
  neutral: rgb(30, 34, 46)
}

const renderTable = async ({
  playerCards = [],
  dealerCards = [],
  hideDealer = false,
  playerName = 'TU',
  bet = 0,
  coins = 0,
  status = '',
  hint = '',
  result = null
} = {}) => {
  const base = (await loadTableBase()).clone()

  await drawCardsRow(base, dealerCards, DEALER_Y, { hideFrom: hideDealer ? 1 : null })
  await drawCardsRow(base, playerCards, PLAYER_Y)

  const dealerValue = handValue(dealerCards)
  const playerValue = handValue(playerCards)
  const maskedDealer = hideDealer && dealerCards.length > 1

  await printText(base, 'medium', TABLE_W / 2, 16, 'BLACKJACK 888', { align: 'center', maxChars: 24 })
  await printText(base, 'small', 874, 24, `PUNTATA: ${bet} 888COIN`, { align: 'right', maxChars: 28 })

  await printText(base, 'small', 26, DEALER_Y + 80, 'BANCO', { maxChars: 18 })
  await printText(base, 'medium', 874, DEALER_Y + 74, maskedDealer ? 'PUNTI: ?' : `PUNTI: ${dealerValue}`, {
    align: 'right',
    maxChars: 16
  })

  await printText(base, 'small', 26, PLAYER_Y + 80, `TU (${playerName})`, { maxChars: 22 })
  await printText(base, 'medium', 874, PLAYER_Y + 74, `PUNTI: ${playerValue}`, { align: 'right', maxChars: 16 })

  if (result?.text) {
    const bannerW = Math.min(TABLE_W - 120, Math.max(320, Jimp.measureText(await getFont('medium'), asciiText(result.text)) + 80))
    await fillRoundRect(base, (TABLE_W - bannerW) / 2, BANNER_Y, bannerW, BANNER_H, 12, RESULT_TONES[result.tone] ?? RESULT_TONES.neutral, { alpha: 0.9 })
    await printText(base, 'medium', TABLE_W / 2, BANNER_Y + 8, result.text, { align: 'center', maxChars: 34 })
  }

  if (status) await printText(base, 'small', 26, TABLE_H - 58, status, { maxChars: 42 })
  await printText(base, 'small', 874, TABLE_H - 58, `SALDO: ${coins} 888COIN`, { align: 'right', maxChars: 28 })
  if (hint) await printText(base, 'small', TABLE_W / 2, TABLE_H - 34, hint, { align: 'center', color: rgb(206, 220, 206), maxChars: 74 })

  return base.getBufferAsync(Jimp.MIME_PNG)
}

const games = new Map()
const renderQueues = new Map()

const handValue = (cards = []) => {
  let total = 0
  let aces = 0
  for (const card of cards) {
    if (card.rank === 1) {
      aces++
      total += 11
    } else {
      total += Math.min(10, card.rank)
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return total
}

const isBlackjack = (cards = []) => cards.length === 2 && handValue(cards) === 21

const createDeck = () => {
  const deck = []
  for (const suit of SUITS) {
    for (const { rank } of RANKS) deck.push({ suit: suit.key, rank })
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

const drawCard = (game) => {
  if (!game.deck.length) game.deck = createDeck()
  return game.deck.pop()
}

const ensureUser = (jid) => {
  if (global.db.data == null) global.db.data = {}
  if (global.db.data.users == null) global.db.data.users = {}
  if (global.db.data.users[jid] == null) global.db.data.users[jid] = {}
  const user = global.db.data.users[jid]
  const coins = Number(user.money)
  user.money = Number.isFinite(coins) ? Math.max(0, Math.trunc(coins)) : 0
  const bank = Number(user.bank)
  user.bank = Number.isFinite(bank) ? Math.max(0, Math.trunc(bank)) : 0
  return user
}

const readCoins = (user) => {
  const value = Number(user?.money)
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

const addCoins = (user, delta) => {
  const value = Math.max(0, readCoins(user) + Math.trunc(delta))
  user.money = value
  return value
}

const persistDb = async () => {
  try {
    if (typeof global.db?.write === 'function') await global.db.write()
  } catch {}
}

const withRenderLock = (chat, task) => {
  const previous = renderQueues.get(chat) ?? Promise.resolve()
  const next = previous.then(task, task)
  renderQueues.set(
    chat,
    next.then(
      () => {},
      () => {}
    )
  )
  return next
}

const getDisplayName = async (conn, jid) => {
  try {
    const name = await Promise.resolve(typeof conn.getName === 'function' ? conn.getName(jid) : null)
    if (typeof name === 'string' && name.trim()) return name.trim()
  } catch {}
  return jid.split('@')[0]
}

const cardLabel = (card) => {
  const rank = (RANK_BY_VALUE.get(card?.rank) ?? RANKS[0]).label
  const suit = SUIT_BY_KEY.get(card?.suit) ?? SUITS[0]
  return `${rank}${suit.emoji}`
}

const handLabel = (cards = []) => cards.map(cardLabel).join(' ')

const actionButtons = () => [
  { buttonId: '.carta', buttonText: { displayText: '🃏 𝐂𝐀𝐑𝐓𝐀' }, type: 1 },
  { buttonId: '.stai', buttonText: { displayText: '✋ 𝐒𝐓𝐎' }, type: 1 }
]

const sendTable = async (conn, chat, game, { caption, buttons = null, quoted = null, status = '', hint = '', result = null }) => {
  const user = ensureUser(game.player)
  const buffer = await withRenderLock(chat, () =>
    renderTable({
      playerCards: game.playerCards,
      dealerCards: game.dealerCards,
      hideDealer: !game.revealed,
      playerName: asciiText(game.playerName, 'TU'),
      bet: game.bet,
      coins: readCoins(user),
      status,
      hint,
      result
    })
  )

  const payload = {
    image: buffer,
    mimetype: 'image/png',
    caption,
    mentions: [game.player]
  }

  if (buttons?.length) {
    payload.buttons = buttons
    payload.footer = '𝟴𝟴𝟴 𝗕𝗢𝗧'
    payload.headerType = 4
  }

  return conn.sendMessage(chat, payload, quoted ? { quoted } : {})
}

const turnCaption = (game, jid) => [
  '🃏 *BLACKJACK 888*',
  `👤 @${jid.split('@')[0]} · Puntata: *${game.bet} 888COIN*`,
  '',
  `🂠 *BANCO:* ${cardLabel(game.dealerCards[0])} + 🂠 coperta`,
  `🧑 *TU:* ${handLabel(game.playerCards)} → *${handValue(game.playerCards)}*`,
  '',
  '🎮 *.carta* per pescare · *.stai* per fermarti',
  `⌛️ Hai *${Math.round(TURN_TIMEOUT / 60000)} minuti* di tempo`
].join('\n')

const clearTimer = (game) => {
  if (game?.timer) {
    clearTimeout(game.timer)
    game.timer = null
  }
}

const scheduleTimeout = (conn, chat) => {
  const game = games.get(chat)
  if (!game) return
  clearTimer(game)
  game.timer = setTimeout(() => {
    const current = games.get(chat)
    if (!current || current !== game || current.finished) return
    finishRound(conn, chat, current, { timeout: true }).catch(() => {})
  }, TURN_TIMEOUT)
  if (typeof game.timer.unref === 'function') game.timer.unref()
}

const finishRound = async (conn, chat, game, { bust = false, natural = false, timeout = false, quoted = null } = {}) => {
  clearTimer(game)

  if (!bust && !timeout) {
    while (handValue(game.dealerCards) < DEALER_STAND) game.dealerCards.push(drawCard(game))
  }

  game.revealed = true
  game.finished = true

  const playerValue = handValue(game.playerCards)
  const dealerValue = handValue(game.dealerCards)

  let outcome
  if (timeout) outcome = 'timeout'
  else if (bust) outcome = 'bust'
  else if (natural) outcome = isBlackjack(game.dealerCards) ? 'push' : 'blackjack'
  else if (dealerValue > 21 || playerValue > dealerValue) outcome = 'win'
  else if (playerValue === dealerValue) outcome = 'push'
  else outcome = 'lose'

  const user = ensureUser(game.player)
  let delta = 0
  let tone = 'neutral'
  let banner = ''
  let esito = ''

  switch (outcome) {
    case 'bust':
      delta = -game.bet
      tone = 'lose'
      banner = `SBALLATO! ${playerValue} PUNTI`
      esito = `💀 Hai sballato con *${playerValue}* punti: il banco vince con ${dealerValue}.`
      break
    case 'blackjack':
      delta = Math.floor(game.bet * BLACKJACK_PAYOUT)
      tone = 'blackjack'
      banner = 'BLACKJACK!'
      esito = `🃏 *BLACKJACK NATURALE!* ${handLabel(game.playerCards)} → *21*`
      break
    case 'win':
      delta = game.bet
      tone = 'win'
      banner = 'HAI VINTO!'
      esito = dealerValue > 21
        ? `🎉 Il banco sballa con *${dealerValue}* punti: vinci tu con *${playerValue}*.`
        : `🎉 Batti il banco *${playerValue}* a *${dealerValue}*.`
      break
    case 'push':
      tone = 'push'
      banner = 'PAREGGIO'
      esito = `😐 Pareggio *${playerValue}* a *${dealerValue}*: puntata restituita.`
      break
    case 'timeout':
      banner = 'TEMPO SCADUTO'
      esito = `⌛️ Nessuna mossa entro *${Math.round(TURN_TIMEOUT / 60000)} minuti*: mano annullata, nessun addebito.`
      break
    default:
      delta = -game.bet
      tone = 'lose'
      banner = 'BANCO VINCE'
      esito = `💀 Il banco vince *${dealerValue}* a *${playerValue}*.`
  }

  const coins = delta === 0 ? readCoins(user) : addCoins(user, delta)
  if (delta !== 0) await persistDb()
  games.delete(chat)

  const caption = [
    '🃏 *BLACKJACK 888* — Risultato',
    `👤 @${game.player.split('@')[0]} · Puntata: *${game.bet} 888COIN*`,
    '',
    `🂠 *BANCO:* ${handLabel(game.dealerCards)} → *${dealerValue}*`,
    `🧑 *TU:* ${handLabel(game.playerCards)} → *${playerValue}*`,
    '',
    esito,
    delta === 0 ? '💼 Saldo invariato' : `${delta > 0 ? '📈 +' : '📉 '}${delta} 888COIN`,
    `💼 Saldo: *${coins} 888COIN*`
  ].join('\n')

  return sendTable(conn, chat, game, {
    caption,
    buttons: [{ buttonId: `.blackjack ${game.bet}`, buttonText: { displayText: '🔁 𝐑𝐈𝐆𝐈𝐎𝐂𝐀' }, type: 1 }],
    quoted,
    status: `${banner} · Puntata: ${game.bet}`,
    hint: `Rigioca con .blackjack ${game.bet}`,
    result: { text: banner, tone }
  })
}

const replyText = (conn, m, text) => conn.sendMessage(m.chat, { text }, { quoted: m })

const noGameReply = (conn, m) =>
  replyText(conn, m, `❌ *Nessuna partita in corso.*\nAvviane una con *.blackjack ${DEFAULT_BET}*`)

const notYoursReply = (conn, m, game) =>
  conn.sendMessage(
    m.chat,
    {
      text: `⏳ La partita in corso è di @${game.player.split('@')[0]}, non tua.`,
      mentions: [game.player]
    },
    { quoted: m }
  )

const startGame = async (conn, m, args = []) => {
  const chat = m.chat
  const current = games.get(chat)

  if (current && !current.finished) {
    if (current.player === m.sender) {
      return replyText(conn, m, '🃏 *Hai già una mano in corso!*\n▸ *.carta* per pescare una carta\n▸ *.stai* per fermarti')
    }
    return replyText(conn, m, "⏳ C'è già una partita in corso in questa chat, attendi che finisca.")
  }

  const rawBet = args[0] == null ? '' : String(args[0]).replace(/[^\d]/g, '')
  const bet = rawBet === '' ? DEFAULT_BET : parseInt(rawBet, 10)

  if (!Number.isFinite(bet) || bet <= 0) {
    return replyText(conn, m, `⚠️ Puntata non valida.\n👉 Uso: *.blackjack ${DEFAULT_BET}*`)
  }
  if (bet < MIN_BET) return replyText(conn, m, `💸 Puntata minima: *${MIN_BET} 888COIN*`)
  if (bet > MAX_BET) return replyText(conn, m, `💸 Puntata massima: *${MAX_BET} 888COIN*`)

  const user = ensureUser(m.sender)
  const coins = readCoins(user)
  if (coins < bet) {
    return replyText(
      conn,
      m,
      `❌ Ti servono *${bet} 888COIN* ma nel wallet hai *${coins}*.\nRiduci la puntata o guadagna altri 888COIN.`
    )
  }

  const game = {
    chat,
    player: m.sender,
    playerName: await getDisplayName(conn, m.sender),
    bet,
    deck: createDeck(),
    playerCards: [],
    dealerCards: [],
    revealed: false,
    finished: false,
    timer: null,
    createdAt: Date.now()
  }

  game.playerCards.push(drawCard(game), drawCard(game))
  game.dealerCards.push(drawCard(game), drawCard(game))
  games.set(chat, game)

  if (handValue(game.playerCards) === 21) return finishRound(conn, chat, game, { natural: true, quoted: m })

  scheduleTimeout(conn, chat)

  return sendTable(conn, chat, game, {
    caption: turnCaption(game, m.sender),
    buttons: actionButtons(),
    quoted: m,
    status: `Puntata: ${bet} 888COIN · tocca a te`,
    hint: 'Usa i bottoni oppure rispondi .carta / .stai'
  })
}

const playerHit = async (conn, m) => {
  const game = games.get(m.chat)
  if (!game || game.finished) return noGameReply(conn, m)
  if (game.player !== m.sender) return notYoursReply(conn, m, game)

  game.playerCards.push(drawCard(game))
  const value = handValue(game.playerCards)

  if (value > 21) return finishRound(conn, m.chat, game, { bust: true, quoted: m })
  if (value === 21) return finishRound(conn, m.chat, game, { quoted: m })

  scheduleTimeout(conn, m.chat)

  return sendTable(conn, m.chat, game, {
    caption: turnCaption(game, m.sender),
    buttons: actionButtons(),
    quoted: m,
    status: `Tocca a te · ${value} punti`,
    hint: 'Usa i bottoni oppure rispondi .carta / .stai'
  })
}

const playerStand = async (conn, m) => {
  const game = games.get(m.chat)
  if (!game || game.finished) return noGameReply(conn, m)
  if (game.player !== m.sender) return notYoursReply(conn, m, game)
  return finishRound(conn, m.chat, game, { quoted: m })
}

const START_COMMANDS = new Set(['blackjack', 'bj', 'blackjackplay'])
const HIT_COMMANDS = new Set(['carta', 'pesco'])
const STAND_COMMANDS = new Set(['stai', 'sto'])

let handler = async (m, { conn, args, command }) => {
  const cmd = String(command || '').toLowerCase()

  try {
    if (START_COMMANDS.has(cmd)) return await startGame(conn, m, Array.isArray(args) ? args : [])
    if (HIT_COMMANDS.has(cmd)) return await playerHit(conn, m)
    if (STAND_COMMANDS.has(cmd)) return await playerStand(conn, m)
  } catch (e) {
    console.error('[blackjack] Errore:', e)
    const broken = games.get(m.chat)
    if (broken) {
      clearTimer(broken)
      games.delete(m.chat)
    }
    return replyText(conn, m, `❌ *Errore blackjack:* ${e?.message || e}`).catch(() => {})
  }
}

handler.help = ['blackjack [quota]', 'carta', 'stai']
handler.tags = ['giochi']
handler.command = /^(blackjack|bj|blackjackplay|carta|pesco|stai|sto)$/i

export default handler
export {
  games,
  handValue,
  isBlackjack,
  createDeck,
  renderTable,
  buildCardSprite,
  buildCardBack,
  buildTableBase,
  asciiText,
  paintShape,
  drawSuit,
  shapeHeart,
  shapeDiamond,
  shapeClub,
  shapeSpade,
  ensureUser,
  readCoins,
  addCoins,
  startGame
}
