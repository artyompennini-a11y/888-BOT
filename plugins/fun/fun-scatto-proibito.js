// Plugin by Elixir, Punisher & 888 Staff — versione 888 Premium
import { importCanvas } from '../../lib/canvas-fallback.js'

/* -------------------------------------------------------
 * CONFIGURAZIONE
 * ----------------------------------------------------- */
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

/* -------------------------------------------------------
 * UTILITÀ
 * ----------------------------------------------------- */
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

/* -------------------------------------------------------
 * SOGGETTI
 * ----------------------------------------------------- */
import SUBJECTS from './subjects.js' // 🔥 Spostato in file separato per ordine

function findSubject(txt) {
  const t = norm(txt)
  for (const s of SUBJECTS) {
    if (norm(s.n) === t) return s
    if ((s.al || []).some((a) => norm(a) === t)) return s
  }
  return null
}

/* -------------------------------------------------------
 * RENDER IMMAGINE
 * ----------------------------------------------------- */
async function renderImage(emoji, step) {
  const { createCanvas } = await importCanvas()
  const BIG = 640
  const prog = Math.max(0, Math.min(1, step / CONFIG.MAX_REVEALS))

  const big = createCanvas(BIG, BIG)
  const bctx = big.getContext('2d')
  bctx.clearRect(0, 0, BIG, BIG)
  bctx.textAlign = 'center'
  bctx.textBaseline = 'middle'
  bctx.shadowColor = 'rgba(0,0,0,0.30)'
  bctx.shadowBlur = 16
  bctx.font = `${Math.round(BIG * 0.82)}px sans-serif`
  bctx.fillText(emoji, BIG / 2, BIG / 2)
  bctx.shadowBlur = 0

  const cropW = Math.round(150 + (BIG - 150) * prog)
  const cropX = (BIG - cropW) / 2
  const cropY = (BIG - cropW) / 2

  const out = createCanvas(CONFIG.SIZE, CONFIG.SIZE)
  const ctx = out.getContext('2d')
  ctx.fillStyle = '#131318'
  ctx.fillRect(0, 0, CONFIG.SIZE, CONFIG.SIZE)

  try { ctx.filter = `blur(${Math.round((1 - prog) * 6)}px)` } catch {}
  try { ctx.drawImage(big, cropX, cropY, cropW, cropW, 0, 0, CONFIG.SIZE, CONFIG.SIZE) } catch {}
  try { ctx.filter = 'none' } catch {}

  ctx.strokeStyle = '#ffd24a'
  ctx.lineWidth = 5
  ctx.strokeRect(3, 3, CONFIG.SIZE - 6, CONFIG.SIZE - 6)

  return out.toBuffer('image/jpeg', { quality: 0.92 })
}

/* -------------------------------------------------------
 * INVIO TAVOLA
 * ----------------------------------------------------- */
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

/* -------------------------------------------------------
 * TIMER
 * ----------------------------------------------------- */
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

/* -------------------------------------------------------
 * RIVELAZIONE
 * ----------------------------------------------------- */
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

/* -------------------------------------------------------
 * FINE PARTITA — VITTORIA
 * ----------------------------------------------------- */
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

/* -------------------------------------------------------
 * FINE PARTITA — RIMBORSO
 * ----------------------------------------------------- */
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

/* -------------------------------------------------------
 * HANDLER PRINCIPALE
 * ----------------------------------------------------- */
let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('❌ Questo gioco funziona solo nei gruppi.')

  const chat = m.chat
  const sender = m.sender
  const body = norm(m.text || '')
  const isScatto = /^\.scatto/.test(body)

  if (/^\.scattostat/.test(body)) {
    const wl = global.scattoWinners || []
    if (wl.length === 0) {
      return m.reply('📊 *Classifica SCATTO*\n\nNessun vincitore in questa sessione.')
    }
    const lines = wl
      .sort((a, b) => b.win - a.win)
      .slice(0, 10)
      .map((x, i) => `${i + 1}. @${shortJid(x.jid)} — +${x.win} 888COIN (${x.name})`)
    return m.reply(`📊 *TOP VINCITORI SCATTO*\n\n${lines.join('\n')}\n\n— 888 BOT —`)
  }

  if (!isScatto) return

  const args = body.replace(/^\.scatto/, '').trim().split(/\s+/).filter(Boolean)
  const game = games[chat]

  /* --- Avvio nuova partita --- */
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

  /* --- Comandi durante la partita --- */
  if (args.length === 0) {
    return m.reply('📸 Partita in corso! Usa: .scatto <parola> · .scatto p <somma> · .scatto zoom · .scatto stop')
  }

  const first = args[0]

  /* --- Puntata --- */
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

  /* --- Zoom --- */
  if (first === 'zoom') {
    const u = getUser(sender)
    if (u.money < CONFIG.ZOOM_COST) {
      return m.reply(`❌ Ti servono almeno ${CONFIG.ZOOM_COST} 888COIN per rivelare un pezzo.`)
    }
    u.money -= CONFIG.ZOOM_COST
    await doReveal(conn, chat)
    return
  }

  /* --- Stop --- */
  if (first === 'stop') {
    endRefund(conn, chat, 'Partita interrotta dal gruppo.')
    return
  }

  /* --- Tentativo --- */
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
