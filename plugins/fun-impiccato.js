const parole = [
  "telefono","computer","mouse","tastiera","monitor","scrivania","sedia",
  "cuffie","microfono","televisione","lampada","zaino","portafoglio",
  "occhiali","orologio","quaderno","penna","matita","libro",

  "pizza","carbonara","lasagna","tiramisù","panino","hamburger","kebab",
  "cioccolato","biscotto","cornetto","gelato","pasta","risotto",
  "mozzarella","nutella","patatine","focaccia","aragosta",

  "torino","milano","roma","napoli","palermo","genova","bologna",
  "londra","parigi","berlino","madrid","barcellona","tokyo","newyork",

  "rap","trap","melodia","concerto","canzone","chitarra","pianoforte",
  "batteria","microfono","playlist","spotify","album","strofa",

  "calcio","basket","tennis","formulauno","motogp","nuoto",
  "atletica","pallavolo","ciclismo","rugby",

  "universo","galassia","pianeta","cometa","satellite","astronave",
  "tempesta","fulmine","arcobaleno","montagna","oceano","deserto",
  "foresta","isola","castello","mistero","leggenda","ombra",
  "energia","velocita","potenza","strategia","missione","squadra",
  "impero","gladiatore","drago","samurai","ninja","pirata",
  "fantasma","vampiro","mostro","robot","androide","cyborg",

  "programmatore","sviluppatore","infrastruttura","configurazione",
  "autenticazione","amministratore","responsabilita",
  "organizzazione","implementazione","ottimizzazione",
  "personalizzazione","interazione","comunicazione",
  "distribuzione","aggiornamento","manutenzione",
  "visualizzazione","simulazione","documentazione"
]

global.gameImpiccato = global.gameImpiccato || {}
global.gameImpiccatoScore = global.gameImpiccatoScore || {}

const handler = async (m, { conn }) => {
  const chatId = m.chat

  if (!global.gameImpiccatoScore[chatId]) global.gameImpiccatoScore[chatId] = {}

  if (global.gameImpiccato[chatId]) {
    const oldGame = global.gameImpiccato[chatId]
    if (Date.now() > oldGame.endTime) delete global.gameImpiccato[chatId]
    else throw (
`╭━━━〔 ⚠️ *PARTITA IN CORSO* 〕━━━┈
┃ Devi prima terminare quella attuale.
╰━━━━━━━━━━━━━━━━━━┈`
    )
  }

  const parola = parole[Math.floor(Math.random() * parole.length)]

  global.gameImpiccato[chatId] = {
    parola,
    lettere: [],
    errori: 0,
    player: m.sender,
    startTime: Date.now(),
    endTime: Date.now() + 180000
  }

  const parolaFormattata = formatParola(parola, [])

  await conn.sendMessage(chatId, {
    text:
`╭━━━〔 🎮 *IMPICCATO 888* 〕━━━┈
┃ Gioco avviato!
┃━━━━━━━━━━━━━━━━━━
${ascii(0)}
┃ Parola da indovinare:
┃ *${parolaFormattata}*
┃━━━━━━━━━━━━━━━━━━
┃ ⏳ Tempo: *3 minuti*
┃ Scrivi una lettera per tentare.
╰━━━━━━━━━━━━━━━━━━┈`
  })

  setTimeout(() => {
    if (global.gameImpiccato[chatId]) {
      const game = global.gameImpiccato[chatId]

      if (!global.gameImpiccatoScore[chatId][game.player])
        global.gameImpiccatoScore[chatId][game.player] = 0

      global.gameImpiccatoScore[chatId][game.player] -= 5

      const scoreArr = Object.entries(global.gameImpiccatoScore[chatId])
        .sort((a,b) => b[1]-a[1])
        .map(([user, pts], i) => `${i+1}. @${user.split("@")[0]} — ${pts} punti`)
        .join("\n")

      conn.sendMessage(chatId, {
        text:
`╭━━━〔 ⏳ *TEMPO SCADUTO* 〕━━━┈
┃ La parola era: *${game.parola}*
┃ Hai perso *5 punti*.
┃━━━━━━━━━━━━━━━━━━
┃ 📊 Classifica gruppo:
${scoreArr}
╰━━━━━━━━━━━━━━━━━━┈`,
        mentions: Object.keys(global.gameImpiccatoScore[chatId])
      })

      delete global.gameImpiccato[chatId]
    }
  }, 180000)
}

handler.command = /^impiccato$/i

handler.before = async (m, { conn }) => {
  const game = global.gameImpiccato[m.chat]
  if (!game) return
  if (m.sender !== game.player) return
  if (!m.text) return
  if (m.text.startsWith(".")) return
  if (m.text.length !== 1) return

  const lettera = m.text.toLowerCase()
  if (game.lettere.includes(lettera)) return

  game.lettere.push(lettera)
  if (!game.parola.includes(lettera)) game.errori++

  const parolaFormattata = formatParola(game.parola, game.lettere)
  const indovinate = game.lettere.filter(l => game.parola.includes(l))
  const sbagliate = game.lettere.filter(l => !game.parola.includes(l))

  const tempoRestante = Math.max(0, Math.floor((game.endTime - Date.now()) / 1000))
  const minuti = Math.floor(tempoRestante / 60)
  const secondi = tempoRestante % 60
  const tempoDisplay = `${minuti}:${secondi.toString().padStart(2,"0")}`

  // ───────────────────────────────
  // 🔥 VITTORIA — 888
  // ───────────────────────────────
  if (!parolaFormattata.includes("_")) {
    if (!global.gameImpiccatoScore[m.chat][m.sender])
      global.gameImpiccatoScore[m.chat][m.sender] = 0

    global.gameImpiccatoScore[m.chat][m.sender] += 10

    const scoreArr = Object.entries(global.gameImpiccatoScore[m.chat])
      .sort((a,b) => b[1]-a[1])
      .map(([user, pts], i) => `${i+1}. @${user.split("@")[0]} — ${pts} punti`)
      .join("\n")

    await conn.sendMessage(m.chat, {
      text:
`╭━━━〔 🏆 *VITTORIA!* 〕━━━┈
┃ Parola: *${game.parola}*
┃ Hai guadagnato *10 punti*!
┃━━━━━━━━━━━━━━━━━━
┃ 📊 Classifica gruppo:
${scoreArr}
╰━━━━━━━━━━━━━━━━━━┈`,
      mentions: Object.keys(global.gameImpiccatoScore[m.chat])
    })

    delete global.gameImpiccato[m.chat]
    return
  }

  // ───────────────────────────────
  // 🔥 SCONFITTA — 888
  // ───────────────────────────────
  if (game.errori >= 6) {
    if (!global.gameImpiccatoScore[m.chat][m.sender])
      global.gameImpiccatoScore[m.chat][m.sender] = 0

    global.gameImpiccatoScore[m.chat][m.sender] -= 5

    const scoreArr = Object.entries(global.gameImpiccatoScore[m.chat])
      .sort((a,b) => b[1]-a[1])
      .map(([user, pts], i) => `${i+1}. @${user.split("@")[0]} — ${pts} punti`)
      .join("\n")

    await conn.sendMessage(m.chat, {
      text:
`╭━━━〔 💀 *SEI STATO IMPICCATO!* 〕━━━┈
┃ Parola: *${game.parola}*
┃ Hai perso *5 punti*.
┃━━━━━━━━━━━━━━━━━━
┃ 📊 Classifica gruppo:
${scoreArr}
╰━━━━━━━━━━━━━━━━━━┈`,
      mentions: Object.keys(global.gameImpiccatoScore[m.chat])
    })

    delete global.gameImpiccato[m.chat]
    return
  }

  // ───────────────────────────────
  // 🔥 AGGIORNAMENTO PARTITA — 888
  // ───────────────────────────────
  await conn.sendMessage(m.chat, {
    text:
`╭━━━〔 🎮 *IMPICCATO 888* 〕━━━┈
${ascii(game.errori)}
┃ Parola: *${parolaFormattata}*
┃━━━━━━━━━━━━━━━━━━
┃ ✅ Lettere indovinate:
┃ ${indovinate.length ? indovinate.join(" ") : "Nessuna"}
┃━━━━━━━━━━━━━━━━━━
┃ ❌ Lettere sbagliate:
┃ ${sbagliate.length ? sbagliate.join(" ") : "Nessuna"}
┃━━━━━━━━━━━━━━━━━━
┃ ⏳ Tempo rimanente: *${tempoDisplay}*
╰━━━━━━━━━━━━━━━━━━┈`
  })
}

export default handler

function formatParola(parola, lettere) {
  return parola.split("").map(l => lettere.includes(l) ? l : "_").join(" ")
}

function ascii(errori) {
  const stages = [
`  +---+
  |    |
       |
       |
       |
       |
=========`,
`  +---+
  |    |
  O    | 
       |
       |
       |
=========`,
`  +---+
  |    |
  O    |
  |    |
       |
       |
=========`,
`  +---+
  |    |
  O    |
 /|    |
       |
       |
=========`,
`  +---+
  |    |
  O    |
 /|\\   |
       |
       |
=========`,
`  +---+
  |    |
  O    |
 /|\\   |
 /     |
       |
=========`,
`  +---+
  |    |
  O    |
 /|\\   |
 / \\   |
       |
=========`
  ]
  return stages[errori]
}