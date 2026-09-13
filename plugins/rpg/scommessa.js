const FOOTBALL_API_KEY = "a906e1a601624a628eb189ffe0b9a438"

global.scommesseGame = global.scommesseGame || {}
global.scommessePoints = global.scommessePoints || {}
global.scommesseTimer = global.scommesseTimer || {}
global.todayMatches = global.todayMatches || {}

async function fetchMatchScore(matchId) {
  try {
    const res = await fetch(`https://api.football-data.org/v4/matches/${matchId}`, {
      headers: { "X-Auth-Token": FOOTBALL_API_KEY }
    })
    return await res.json()
  } catch { return null }
}

function getStatusEmoji(status) {
  if (status === "IN_PLAY" || status === "PAUSED") return "🔴 LIVE"
  if (status === "FINISHED") return "✅ FINITA"
  if (status === "TIMED" || status === "SCHEDULED") return "🕐"
  return "⚽"
}

function formatMatchTime(match) {
  const d = new Date(match.utcDate)
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" })
}

let handler = async (m, { conn, args }) => {
  const chat = m.chat
  const user = m.sender

  // CLASSIFICA
  if (args[0]?.toLowerCase() === "classifica") {
    let points = global.scommessePoints[chat] || {}
    let ranking = Object.entries(points).sort((a, b) => b[1] - a[1]).slice(0, 10)

    if (!ranking.length) return m.reply("Nessun punteggio ancora!")

    let text = `🏆 *Classifica Scommesse*\n\n`
    for (let i = 0; i < ranking.length; i++) {
      let name = await conn.getName(ranking[i][0])
      text += `${i + 1}. ${name} — ${ranking[i][1]} punti\n`
    }
    return m.reply(text)
  }

  // LIVE
  if (args[0]?.toLowerCase() === "live") {
    let game = global.scommesseGame[chat]
    if (!game) return m.reply("Nessuna scommessa attiva in questa chat.")

    const matchData = await fetchMatchScore(game.matchId)
    if (!matchData) return m.reply("Errore nel recuperare il punteggio.")

    const s = matchData.score?.fullTime || matchData.score?.halfTime || {}
    const hg = s.home ?? "?"
    const ag = s.away ?? "?"
    const status = getStatusEmoji(matchData.status)
    const minute = matchData.minute ? `${matchData.minute}'` : ""

    return m.reply(
      `⚽ *Risultato Live*\n` +
      `*${game.home} ${hg} - ${ag} ${game.away}*\n` +
      `${status} ${minute}\n\n` +
      `🎯 La tua scommessa: *${game.userBet[user] || "non hai scommesso"}*`
    )
  }

  // SCOMMESSA 1/X/2
  if (["1", "X", "2"].includes(args[0]?.toUpperCase())) {
    let game = global.scommesseGame[chat]
    if (!game) return m.reply("Nessuna scommessa attiva!\nPrima usa *.calcio* poi *.scommessa NUMERO*")

    if (game.userBet[user]) {
      return m.reply(`Hai già scommesso su: *${game.userBet[user]}*`)
    }

    game.userBet[user] = args[0].toUpperCase()
    const name = await conn.getName(user)

    return m.reply(
      `✅ *Scommessa registrata!*\n` +
      `${name} punta su: *${args[0].toUpperCase()}*\n\n` +
      `Usa *.scommessa live* per il risultato in tempo reale!`
    )
  }

  // APERTURA SCOMMESSA SU PARTITA
  const numeroPartita = parseInt(args[0])
  if (!isNaN(numeroPartita)) {
    if (global.scommesseGame[chat]) {
      return m.reply("⚠️ C'è già una scommessa attiva!\nUsa *.scommessa live* per il punteggio.")
    }

    const matches = global.todayMatches[chat]
    if (!matches || !matches.length) return m.reply("Prima usa *.calcio* per vedere le partite di oggi!")

    const chosen = matches[numeroPartita - 1]
    if (!chosen) return m.reply(`Partita numero ${numeroPartita} non trovata.\nUsa *.calcio* per vedere la lista.`)

    const home = chosen.homeTeam.shortName || chosen.homeTeam.name
    const away = chosen.awayTeam.shortName || chosen.awayTeam.name
    const ora = formatMatchTime(chosen)
    const status = getStatusEmoji(chosen.status)
    const comp = chosen.competition?.name || ""

    const homeScore = chosen.score?.fullTime?.home ?? chosen.score?.halfTime?.home ?? "-"
    const awayScore = chosen.score?.fullTime?.away ?? chosen.score?.halfTime?.away ?? "-"

    global.scommesseGame[chat] = {
      matchId: chosen.id,
      home,
      away,
      userBet: {}
    }

    let scoreRow =
      (chosen.status === "IN_PLAY" || chosen.status === "PAUSED" || chosen.status === "FINISHED")
        ? `📊 Punteggio attuale: *${home} ${homeScore} - ${awayScore} ${away}*\n`
        : ""

    const testo =
      `⚽ *Scommessa Live*\n` +
      `🏆 ${comp}\n` +
      `${status}\n\n` +
      `🏠 *${home}*\nVS\n✈️ *${away}*\n\n` +
      scoreRow +
      `🕐 Orario: *${ora}*\n\n` +
      `Scommetti:\n` +
      `• *.scommessa 1* → Vince ${home}\n` +
      `• *.scommessa X* → Pareggio\n` +
      `• *.scommessa 2* → Vince ${away}\n\n` +
      `📡 *.scommessa live* → Score reale\n` +
      `🏆 *.scommessa classifica* → Classifica punti`

    await conn.sendMessage(chat, { text: testo }, { quoted: m })

    // TIMER FINE PARTITA
    global.scommesseTimer[chat] = setTimeout(async () => {
      let game = global.scommesseGame[chat]
      if (!game) return

      const matchData = await fetchMatchScore(game.matchId)
      if (!matchData || matchData.status !== "FINISHED") return

      const s = matchData.score?.fullTime || {}
      const hg = s.home ?? 0
      const ag = s.away ?? 0

      let winner = hg > ag ? "1" : hg < ag ? "2" : "X"
      let winners = []

      global.scommessePoints[chat] = global.scommessePoints[chat] || {}

      for (let [uid, bet] of Object.entries(game.userBet || {})) {
        if (bet === winner) {
          global.scommessePoints[chat][uid] = (global.scommessePoints[chat][uid] || 0) + 15
          let name = await conn.getName(uid)
          winners.push(name)
        }
      }

      delete global.scommesseGame[chat]

      let winnerText = winners.length
        ? `🎉 Hanno indovinato: ${winners.join(", ")} (+15 punti!)`
        : "😔 Nessuno ha indovinato questa volta!"

      conn.sendMessage(chat, {
        text:
          `🏁 *Partita Finita!*\n` +
          `⚽ ${game.home} ${hg} - ${ag} ${game.away}\n\n` +
          `${winnerText}\n\n` +
          `🏆 Usa *.scommessa classifica* per la classifica`
      })
    }, 3 * 60 * 60 * 1000)

    return
  }

  // HELP
  return m.reply(
    `ℹ️ *Come usare le scommesse*\n\n` +
    `1️⃣ *.calcio* → vedi le partite di oggi\n` +
    `2️⃣ *.scommessa 3* → apri scommessa sulla partita n.3\n` +
    `3️⃣ *.scommessa 1/X/2* → scommetti sul risultato\n` +
    `4️⃣ *.scommessa live* → risultato reale\n` +
    `5️⃣ *.scommessa classifica* → classifica punti`
  )
}

handler.command = ["scommessa"]
export default handler