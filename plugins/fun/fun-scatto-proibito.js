// Plugin by elixir, punisher & 888 staff
import Jimp from 'jimp'
import fetch from 'node-fetch'
import axios from 'axios'
import twemoji from 'twemoji'
import SUBJECTS from './subjects.js'

const BROWSERLESS_KEY = global.browserless

const WIDTH = 480
const HEIGHT = 480

const COLOR_BG_TOP = 0x1a1520ff
const COLOR_BG_BOTTOM = 0x08070aff
const COLOR_GOLD = 0xffd24aff
const COLOR_WHITE = 0xffffffff
const COLOR_LABEL = 0x9a9aaaff

const CONFIG = {
  MAX_REVEALS: 8,
  REVEAL_INTERVAL_MS: 18000,
  MIN_BET: 50,
  WIN_QUOTA: 0.60,
  REFUND_QUOTA: 0.90,
  PENALTY: 25,
  ZOOM_COST: 20,
  SIZE: 480
}

const games = {}



function buildHtml(emoji, step) {
  const prog = Math.max(0, Math.min(1, step / CONFIG.MAX_REVEALS))
  const blur = Math.round((1 - prog) * 14)
  const maskSize = Math.round(18 + prog * 82)
  const safeEmoji = escapeHtml(emoji)

  return `
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        width: ${WIDTH}px; height: ${HEIGHT}px;
        background: #0a0810; overflow: hidden;
        font-family: 'Segoe UI Emoji', 'Apple Color Emoji', Arial, sans-serif;
      }
      .stage {
        position: relative;
        width: ${WIDTH}px; height: ${HEIGHT}px;
        display: flex; align-items: center; justify-content: center;
        background: radial-gradient(circle at 50% 40%, #241a2e 0%, #0a0810 70%);
      }
      .emoji {
        position: absolute; font-size: 320px; line-height: 1;
        filter: blur(${blur}px);
        transform: scale(${1 + (1 - prog) * 0.06});
        user-select: none;
      }
      .reveal {
        position: absolute;
        width: ${maskSize}%; height: ${maskSize}%;
        border-radius: 50%; overflow: hidden;
        box-shadow: 0 0 60px 10px rgba(255, 210, 74, 0.18);
      }
      .reveal .inner {
        position: absolute;
        width: ${WIDTH}px; height: ${HEIGHT}px;
        display: flex; align-items: center; justify-content: center;
        font-size: 320px; line-height: 1; filter: blur(0px);
      }
      .frame {
        position: absolute; inset: 0;
        border: 6px solid #ffd24a;
        box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.75);
        pointer-events: none;
      }
      .hud {
        position: absolute; left: 0; right: 0; bottom: 30px;
        text-align: center; color: #fff;
        font-weight: 800; font-size: 30px; letter-spacing: 3px;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
      }
      .hud small {
        display: block; font-size: 16px; font-weight: 600;
        letter-spacing: 2px; color: #9a9aaa; margin-top: 6px;
      }
      .bar {
        position: absolute; left: 50%; bottom: 14px;
        transform: translateX(-50%);
        width: 300px; height: 8px;
        background: rgba(255, 255, 255, 0.14);
        border-radius: 99px; overflow: hidden;
      }
      .bar i {
        display: block; height: 100%; width: ${Math.round(prog * 100)}%;
        background: linear-gradient(90deg, #ffd24a, #ff2bd6);
      }
    </style>
  </head>
  <body>
    <div class="stage">
      <div class="emoji">${safeEmoji}</div>
      <div class="reveal"><div class="inner">${safeEmoji}</div></div>
      <div class="frame"></div>
      <div class="hud">
        RIVELAZIONE ${step}/${CONFIG.MAX_REVEALS}
        <small>LO SCATTO PROIBITO</small>
      </div>
      <div class="bar"><i></i></div>
    </div>
  </body>
  </html>`
}

async function renderBrowserless(emoji, step) {
  const html = buildHtml(emoji, step)
  for (let i = 0; i < 3; i++) {
    try {
      const response = await axios.post(
        `https://chrome.browserless.io/screenshot?token=${BROWSERLESS_KEY}`,
        { html, options: { type: 'jpeg', quality: 92 }, viewport: { width: WIDTH, height: HEIGHT } },
        { responseType: 'arraybuffer', timeout: 15000 }
      )
      return Buffer.from(response.data)
    } catch (e) {
      if (i === 2) throw e
      await new Promise(r => setTimeout(r, 1200))
    }
  }
}

const emojiCache = new Map()
const EMOJI_CACHE_MAX = 80

async function getEmojiImage(emoji) {
  if (emojiCache.has(emoji)) return emojiCache.get(emoji)
  try {
    const code = twemoji.convert.toCodePoint(emoji)
    const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${code}.png`
    const res = await fetch(url)
    if (!res.ok) return null
    const img = await Jimp.read(Buffer.from(await res.arrayBuffer()))
    if (emojiCache.size >= EMOJI_CACHE_MAX) {
      emojiCache.delete(emojiCache.keys().next().value)
    }
    emojiCache.set(emoji, img)
    return img
  } catch {
    return null
  }
}

const escapeHtml = (str) => String(str ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const norm = (t = '') =>
  String(t)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const getUser = (jid) => {
  global.db.data.users[jid] ??= { money: 0 }
  return global.db.data.users[jid]
}

const shortJid = (jid) => ((jid || '').split('@')[0] || jid)

const bonusFor = (step) =>
  (CONFIG.MAX_REVEALS - Math.min(step, CONFIG.MAX_REVEALS)) * 40

function findSubject(txt) {
  const t = norm(txt)
  for (const s of SUBJECTS) {
    if (norm(s.n) === t) return s
    if ((s.al || []).some((a) => norm(a) === t)) return s
  }
  return null
}


async function renderJimp(emoji, step) {
  const prog = Math.max(0, Math.min(1, step / CONFIG.MAX_REVEALS))
  const canvas = verticalGradient(WIDTH, HEIGHT, COLOR_BG_TOP, COLOR_BG_BOTTOM)

  const src = await getEmojiImage(emoji)
  const BIG = 400
  const originX = Math.round((WIDTH - BIG) / 2)
  const originY = Math.round((HEIGHT - BIG) / 2 - 12)

  if (src) {
        const blurred = src.clone().resize(BIG, BIG)
    blurred.blur(Math.max(1, Math.round((1 - prog) * 10)))
    canvas.composite(blurred, originX, originY)

        if (prog > 0) {
      const maskR = (BIG / 2) * (0.2 + prog * 0.8)
      const sharp = src.clone().resize(BIG, BIG)
      const cx = BIG / 2
      const r2 = maskR * maskR
      sharp.scan(0, 0, BIG, BIG, function (px, py, idx) {
        const dx = px - cx
        const dy = py - cx
        if (dx * dx + dy * dy > r2) this.bitmap.data[idx + 3] = 0
      })
      canvas.composite(sharp, originX, originY)
    }
  } else {
    const font = await getBaseFont()
    const textW = Jimp.measureText(font, '?')
    const tmp = new Jimp(textW + 10, 56, 0x00000000)
    tmp.print(font, 0, 0, '?', { color: COLOR_WHITE })
    canvas.composite(tmp, Math.round((WIDTH - tmp.bitmap.width) / 2), Math.round(HEIGHT / 2 - 50))
  }

  drawRectOutline(canvas, 3, 3, WIDTH - 6, HEIGHT - 6, 6, COLOR_GOLD)

  const [base, small] = await Promise.all([getBaseFont(), getSmallFont()])

  const hud = `RIVELAZIONE ${step}/${CONFIG.MAX_REVEALS}`
  const hudW = Jimp.measureText(base, hud)
  const hudImg = new Jimp(hudW + 8, 46, 0x00000000)
  hudImg.print(base, 0, 0, hud, { color: COLOR_WHITE })
  canvas.composite(hudImg, Math.round((WIDTH - hudW) / 2), HEIGHT - 116)

  const sub = 'LO SCATTO PROIBITO'
  const subW = Jimp.measureText(small, sub)
  const subImg = new Jimp(subW + 8, 28, 0x00000000)
  subImg.print(small, 0, 0, sub, { color: COLOR_LABEL })
  canvas.composite(subImg, Math.round((WIDTH - subW) / 2), HEIGHT - 66)

  drawProgressBar(canvas, Math.round((WIDTH - 300) / 2), HEIGHT - 30, 300, 8, prog)

  return canvas.getBufferAsync(Jimp.MIME_JPEG, { quality: 92 })
}


async function renderImage(emoji, step) {
  if (BROWSERLESS_KEY) {
    try {
      return await renderBrowserless(emoji, step)
    } catch (e) {
      console.error('[scatto] Browserless fallito, uso Jimp:', e?.message || e)
    }
  }
  return renderJimp(emoji, step)
}



let baseFont = null
let smallFont = null

const getBaseFont = async () => {
  if (!baseFont) baseFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE)
  return baseFont
}

const getSmallFont = async () => {
  if (!smallFont) smallFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE)
  return smallFont
}

function verticalGradient(w, h, top, bottom) {
  const img = new Jimp(w, h)
  const tr = (top >>> 24) & 0xff, tg = (top >>> 16) & 0xff, tb = (top >>> 8) & 0xff
  const br = (bottom >>> 24) & 0xff, bg = (bottom >>> 16) & 0xff, bb = (bottom >>> 8) & 0xff
  img.scan(0, 0, w, h, function (x, y, idx) {
    const t = y / Math.max(1, h - 1)
    this.bitmap.data[idx]     = Math.round(tr + (br - tr) * t)
    this.bitmap.data[idx + 1] = Math.round(tg + (bg - tg) * t)
    this.bitmap.data[idx + 2] = Math.round(tb + (bb - tb) * t)
    this.bitmap.data[idx + 3] = 255
  })
  return img
}

function drawRectOutline(img, x, y, w, h, thickness, color) {
  for (let t = 0; t < thickness; t++) {
    for (let px = x + t; px < x + w - t; px++) {
      img.setPixelColor(color, px, y + t)
      img.setPixelColor(color, px, y + h - 1 - t)
    }
    for (let py = y + t; py < y + h - t; py++) {
      img.setPixelColor(color, x + t, py)
      img.setPixelColor(color, x + w - 1 - t, py)
    }
  }
}

function drawProgressBar(img, x, y, w, h, prog) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) img.setPixelColor(0x3a3a46ff, px, py)
  }
  const filled = Math.round(w * prog)
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + filled; px++) {
      const t = (px - x) / Math.max(1, filled)
      const r = Math.round(255 + (43 - 255) * t)
      const g = Math.round(210 + (189 - 210) * t)
      const b = Math.round(74 + (214 - 74) * t)
      img.setPixelColor((r << 16) | (g << 8) | b, px, py)
    }
  }
}

async function sendBoard(conn, chat, g, extraText) {
  const img = await renderImage(g.emoji, g.step)
  const bettors = Object.keys(g.bets || {}).length
  const winPot = Math.round(g.pot * CONFIG.WIN_QUOTA)
  const winNow = winPot + bonusFor(g.step)

  let cap =
`📸 *LO SCATTO PROIBITO*
━━━━━━━━━━━━━━━━━━━━
🔍 Rivelazione: ${g.step}/${CONFIG.MAX_REVEALS}
💰 Piatto: ${g.pot} 888COIN (${bettors} giocatori)
🏆 Vincita ora: ~${winNow} 888COIN
━━━━━━━━━━━━━━━━━━━━`

  if (extraText) cap += `\n\n${extraText}`

  await conn.sendMessage(chat, {
    image: img,
    mimetype: 'image/jpeg',
    fileName: 'scatto.jpg',
    caption: cap
  })

  await conn.sendMessage(chat, {
    text:
`🎮 *COMANDI*
Indovina → .scatto <parola>
Punta → .scatto p <somma>
Rivela → .scatto zoom
Stop → .scatto stop`,
    buttons: [
      { buttonId: `.scatto p ${CONFIG.MIN_BET}`, buttonText: { displayText: '💵 Punto 50' }, type: 1 },
      { buttonId: `.scatto p 100`, buttonText: { displayText: '💶 Punto 100' }, type: 1 },
      { buttonId: `.scatto zoom`, buttonText: { displayText: '⏭️ Rivela' }, type: 1 },
      { buttonId: `.scatto stop`, buttonText: { displayText: '🛑 Stop' }, type: 1 }
    ],
    headerType: 1
  })
}

function startTimer(conn, chat) {
  const g = games[chat]
  if (!g) return
  if (g.timer) clearInterval(g.timer)

  g.timer = setInterval(() => {
    const cur = games[chat]
    if (!cur || cur.over) {
      clearInterval(g.timer)
      return
    }
    doReveal(conn, chat).catch((e) => console.error('[scatto] timer:', e))
  }, CONFIG.REVEAL_INTERVAL_MS)
}

async function doReveal(conn, chat) {
  const g = games[chat]
  if (!g || g.over) return
  g.step++

  if (g.step >= CONFIG.MAX_REVEALS + 1) {
    endRefund(conn, chat, 'Il soggetto si è rivelato completamente.')
    return
  }

  await sendBoard(conn, chat, g, `🔎 Nuovo pezzo rivelato (${g.step}/${CONFIG.MAX_REVEALS}).`)
}

function endWin(conn, chat, winnerJid) {
  const g = games[chat]
  if (!g || g.over) return
  g.over = true
  if (g.timer) clearInterval(g.timer)

  const winPot = Math.round(g.pot * CONFIG.WIN_QUOTA)
  const bonus = bonusFor(g.step)
  const total = winPot + bonus

  const winnerUser = getUser(winnerJid)
  winnerUser.money = (winnerUser.money || 0) + total

  global.scattoWinners ||= []
  global.scattoWinners.unshift({ jid: winnerJid, win: total, name: g.name })
  if (global.scattoWinners.length > 30) global.scattoWinners.length = 30

  conn.sendMessage(chat, {
    text:
`🏆 *SCATTO RISOLTO*
Vincitore: @${shortJid(winnerJid)}
Era: ${g.emoji} ${g.name}

💰 60% del piatto: +${winPot}
⚡ Bonus velocità: +${bonus}
🎉 Totale: +${total}

Piatto finale: ${g.pot} 888COIN`,
    mentions: [winnerJid]
  })

  delete games[chat]
}

function endRefund(conn, chat, why) {
  const g = games[chat]
  if (!g || g.over) return
  g.over = true
  if (g.timer) clearInterval(g.timer)

  let refunded = 0
  for (const [jid, stake] of Object.entries(g.bets || {})) {
    const back = Math.floor(stake * CONFIG.REFUND_QUOTA)
    getUser(jid).money += back
    refunded += back
  }

  conn.sendMessage(chat, {
    text:
`🕗 *SCATTO TERMINATO*
${why}

Era: ${g.emoji} ${g.name}
💰 Piatto: ${g.pot}
🔄 Restituito (90%): ${refunded}
🏦 Tassa banco: ${g.pot - refunded}

Usa .scatto per riprovare.`
  })

  delete games[chat]
}

let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('❌ Questo gioco funziona solo nei gruppi.')

  const chat = m.chat
  const sender = m.sender
  const body = norm(m.text || '')

  if (/^[^a-z0-9\s]?scattostat/.test(body)) {
    const wl = [...(global.scattoWinners || [])]
    if (wl.length === 0) {
      return m.reply('📊 *Classifica SCATTO*\n\nNessun vincitore in questa sessione.')
    }
    const top = wl.sort((a, b) => b.win - a.win).slice(0, 10)
    const lines = top.map((x, i) => `${i + 1}. @${shortJid(x.jid)} — +${x.win} 888COIN (${x.name})`)
    return conn.sendMessage(chat, {
      text: `📊 *TOP VINCITORI SCATTO*\n\n${lines.join('\n')}\n\n— 888 BOT —`,
      mentions: top.map((x) => x.jid)
    }, { quoted: m })
  }

  if (!/^[^a-z0-9\s]?scatto/.test(body)) return

  const args = body.replace(/^[^a-z0-9\s]?scatto/, '').trim().split(/\s+/).filter(Boolean)
  const game = games[chat]

  if (!game) {
    if (args.length > 0) {
      return m.reply('❌ Nessuna partita in corso. Scrivi ".scatto" per iniziarne una.')
    }

    const starter = getUser(sender)
    if (starter.money < CONFIG.MIN_BET) {
      return m.reply(`❌ Ti servono almeno ${CONFIG.MIN_BET} 888COIN per avviare una partita.`)
    }

    const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]
    starter.money -= CONFIG.MIN_BET

    games[chat] = {
      emoji: subject.e,
      name: subject.n,
      step: 0,
      pot: CONFIG.MIN_BET,
      bets: { [sender]: CONFIG.MIN_BET },
      starter: sender,
      over: false,
      timer: null,
      startedAt: Date.now()
    }

    await sendBoard(conn, chat, games[chat], '🎯 Indovina subito per il bonus massimo!')
    startTimer(conn, chat)
    return
  }

  if (game.over) return

  if (args.length === 0) {
    return m.reply('📸 Partita in corso! Usa: .scatto <parola> · .scatto p <somma> · .scatto zoom · .scatto stop')
  }

  const first = args[0]

  if (first === 'p') {
    const amount = parseInt(args[1], 10)
    if (!amount || amount < CONFIG.MIN_BET) {
      return m.reply(`💵 Puntata minima: ${CONFIG.MIN_BET} 888COIN`)
    }
    const u = getUser(sender)
    if (u.money < amount) {
      return m.reply('❌ Non hai abbastanza 888COIN.')
    }
    u.money -= amount
    game.pot += amount
    game.bets[sender] = (game.bets[sender] || 0) + amount
    await sendBoard(conn, chat, game, `💵 Hai aggiunto ${amount} 888COIN al piatto.`)
    return
  }

  if (first === 'zoom') {
    if (game.step >= CONFIG.MAX_REVEALS) {
      return m.reply('🔎 Il soggetto è già rivelato al massimo, indovina ora!')
    }
    const u = getUser(sender)
    if (u.money < CONFIG.ZOOM_COST) {
      return m.reply(`❌ Ti servono almeno ${CONFIG.ZOOM_COST} 888COIN per rivelare un pezzo.`)
    }
    u.money -= CONFIG.ZOOM_COST
    await doReveal(conn, chat)
    return
  }

  if (first === 'stop') {
    endRefund(conn, chat, 'Partita interrotta dal gruppo.')
    return
  }

  const guessText = args.join(' ')
  const subj = findSubject(guessText) || { n: guessText }
  const guessName = norm(subj.n)
  const realName = norm(game.name)

  if (guessName === realName) {
    endWin(conn, chat, sender)
    return
  }

  const u = getUser(sender)
  if (u.money >= CONFIG.PENALTY) {
    u.money -= CONFIG.PENALTY
    await sendBoard(conn, chat, game, `❌ Tentativo sbagliato: "${guessText}". Penalità: -${CONFIG.PENALTY} 888COIN.`)
  } else {
    await sendBoard(conn, chat, game, `❌ Tentativo sbagliato: "${guessText}". Non hai abbastanza 888COIN per la penalità.`)
  }
}

handler.help = ['scatto', 'scattostat']
handler.tags = ['game']
handler.command = /^scatto(stat)?$/i

export default handler
