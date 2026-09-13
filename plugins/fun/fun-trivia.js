// Plugin by Elixir & 888 staff
import fetch from 'node-fetch'

const domandeLocali = [
  { domanda: 'Qual è la capitale dell\'Italia?', risposte: ['Roma', 'Milano', 'Napoli', 'Torino'], corretta: 0 },
  { domanda: 'Quanti continenti esistono?', risposte: ['5', '6', '7', '8'], corretta: 2 },
  { domanda: 'Chi ha dipinto la Gioconda?', risposte: ['Michelangelo', 'Leonardo da Vinci', 'Raffaello', 'Caravaggio'], corretta: 1 },
  { domanda: 'Qual è il pianeta più grande del sistema solare?', risposte: ['Terra', 'Marte', 'Giove', 'Saturno'], corretta: 2 },
  { domanda: 'In che anno è caduto il muro di Berlino?', risposte: ['1987', '1989', '1991', '1985'], corretta: 1 },
  { domanda: 'Quale animale è il simbolo dell\'Australia?', risposte: ['Koala', 'Ornitorinco', 'Canguro', 'Dingo'], corretta: 2 },
  { domanda: 'Quante corde ha una chitarra classica?', risposte: ['4', '5', '6', '7'], corretta: 2 },
  { domanda: 'Qual è il fiume più lungo del mondo?', risposte: ['Nilo', 'Rio delle Amazzoni', 'Mississippi', 'Gange'], corretta: 1 },
  { domanda: 'Chi scrisse "La Divina Commedia"?', risposte: ['Petrarca', 'Boccaccio', 'Dante Alighieri', 'Ariosto'], corretta: 2 },
  { domanda: 'Quale paese ha inventato la pizza?', risposte: ['Francia', 'Spagna', 'Italia', 'Grecia'], corretta: 2 },
  { domanda: 'Quanto fa 12 × 8?', risposte: ['96', '88', '104', '92'], corretta: 0 },
  { domanda: 'Quale osso è il più lungo del corpo umano?', risposte: ['Tibia', 'Omero', 'Femore', 'Radio'], corretta: 2 },
  { domanda: 'Qual è la valuta del Giappone?', risposte: ['Won', 'Yuan', 'Yen', 'Ringgit'], corretta: 2 },
  { domanda: 'Chi ha dipinto il "Cielo stellato"?', risposte: ['Van Gogh', 'Picasso', 'Monet', 'Dalì'], corretta: 0 },
  { domanda: 'Quanti zampe ha un ragno?', risposte: ['6', '8', '10', '12'], corretta: 1 },
  { domanda: 'Quale paese ospita la Torre Eiffel?', risposte: ['Regno Unito', 'Germania', 'Francia', 'Spagna'], corretta: 2 },
  { domanda: 'Chi ha scritto "Romeo e Giulietta"?', risposte: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Oscar Wilde'], corretta: 1 },
  { domanda: 'Qual è l\'oceano più grande?', risposte: ['Atlantico', 'Indiano', 'Pacifico', 'Artico'], corretta: 2 },
  { domanda: 'Quale paese ha vinto i mondiali di calcio 2006?', risposte: ['Brasile', 'Francia', 'Italia', 'Germania'], corretta: 2 },
  { domanda: 'Quante ossa ha un adulto umano?', risposte: ['206', '196', '216', '186'], corretta: 0 },
  { domanda: 'Quale strumento suonava Mozart?', risposte: ['Violino', 'Flauto', 'Pianoforte', 'Chitarra'], corretta: 2 },
  { domanda: 'Chi è l\'autore di "Il Piccolo Principe"?', risposte: ['Victor Hugo', 'Antoine de Saint-Exupéry', 'Jules Verne', 'Albert Camus'], corretta: 1 },
  { domanda: 'Quale animale è il più veloce sulla terra?', risposte: ['Leone', 'Ghepardo', 'Antilope', 'Cavallo'], corretta: 1 },
  { domanda: 'Qual è la lingua più parlata al mondo?', risposte: ['Inglese', 'Spagnolo', 'Mandarino', 'Hindi'], corretta: 2 },
  { domanda: 'Chi ha dipinto "L\'Ultima Cena"?', risposte: ['Leonardo da Vinci', 'Michelangelo', 'Raffaello', 'Botticelli'], corretta: 0 },
]

let handler = async (m, { conn, usedPrefix, command }) => {
  if (!global.db.data.chats[m.chat].trivia) {
    global.db.data.chats[m.chat].trivia = { attiva: false, domandaCorrente: null, punteggi: {}, vincitore: null }
  }

  const trivia = global.db.data.chats[m.chat].trivia

  if (command === 'toptrivia') {
    const scores = Object.entries(trivia.punteggi || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
    if (scores.length === 0) return m.reply('📊 *Nessun punteggio trivia registrato.*')

    const list = []
    for (const [jid, score] of scores) {
      const name = await conn.getName(jid)
      list.push(`┃ ${list.length + 1}. *${name}* — ${score} punti`)
    }

    return m.reply(`🏆 *CLASSIFICA TRIVIA*\n━━━━━━━━━━━━━━━━━━\n${list.join('\n')}\n━━━━━━━━━━━━━━━━━━`)
  }

  if (trivia.attiva) {
    return m.reply(`⚠️ *Una partita di trivia è già in corso!*\n\nRispondi con il numero della risposta corretta.\n\nUsa ${usedPrefix}triviastop per fermarla (admin).`)
  }

  const domanda = domandeLocali[Math.floor(Math.random() * domandeLocali.length)]

  trivia.attiva = true
  trivia.domandaCorrente = {
    domanda: domanda.domanda,
    risposte: domanda.risposte,
    corretta: domanda.corretta,
    scadenza: Date.now() + 30000 // 30 secondi
  }
  trivia.punteggi = trivia.punteggi || {}
  trivia.partecipantiRisposto = new Set()

  const options = domanda.risposte.map((r, i) => `${i + 1}. ${r}`).join('\n')

  await m.reply(
    `🧠 *TRIVIA!*\n\n` +
    `❓ *${domanda.domanda}*\n\n` +
    `${options}\n\n` +
    `⏱️ *Hai 30 secondi!*\n` +
    `📝 Rispondi con il *numero* della risposta.`
  )

  setTimeout(async () => {
    if (!global.db.data.chats[m.chat]?.trivia?.attiva) return
    const t = global.db.data.chats[m.chat].trivia
    if (!t.attiva || !t.domandaCorrente) return

    t.attiva = false
    const rispostaCorretta = t.domandaCorrente.risposte[t.domandaCorrente.corretta]

    const correctUsers = [...(t.partecipantiRisposto || [])]
    if (correctUsers.length > 0) {
      const name = await conn.getName(correctUsers[0]).catch(() => 'Qualcuno')
      await conn.sendMessage(m.chat, {
        text: `⏰ *TEMPO SCADUTO!*\n\n` +
          `✅ *Risposta corretta:* ${rispostaCorretta}\n` +
          `🏆 *Vincitore:* ${name} con ${t.punteggi[correctUsers[0]] || 1} punti!`
      })
    } else {
      await conn.sendMessage(m.chat, {
        text: `⏰ *TEMPO SCADUTO!*\n\n` +
          `✅ *Risposta corretta:* ${rispostaCorretta}\n` +
          `Nessuno ha risposto correttamente 😢`
      })
    }
  }, 30000)
}

handler.before = async (m, { isAdmin, isOwner, isROwner }) => {
  if (!m.isGroup) return false
  if (!m.text) return false

  const trivia = global.db.data.chats[m.chat]?.trivia
  if (!trivia || !trivia.attiva || !trivia.domandaCorrente) return false

  if (/^triviastop$/i.test(m.text) && (isAdmin || isOwner || isROwner)) {
    trivia.attiva = false
    await m.reply('🛑 *Trivia fermata!*')
    return true
  }

  const answer = parseInt(m.text.trim())
  if (isNaN(answer) || answer < 1 || answer > trivia.domandaCorrente.risposte.length) return false

  if (Date.now() > trivia.domandaCorrente.scadenza) return false

  if (!trivia.punteggi) trivia.punteggi = {}
  if (!trivia.partecipantiRisposto) trivia.partecipantiRisposto = new Set()

  if (trivia.partecipantiRisposto.has(m.sender)) {
    await m.reply('⚠️ *Hai già risposto a questa domanda!*')
    return true
  }

  if (answer - 1 === trivia.domandaCorrente.corretta) {
    trivia.partecipantiRisposto.add(m.sender)
    trivia.punteggi[m.sender] = (trivia.punteggi[m.sender] || 0) + 1

    const punti = trivia.punteggi[m.sender]
    await m.reply(`✅ *Risposta corretta!*\n\n🏆 Hai totalizzato *${punti}* punti!\n\nUsa ${global.prefix || '.'}trivia per la prossima domanda o ${global.prefix || '.'}toptrivia per la classifica!`)

    trivia.attiva = false

    setTimeout(() => {
      if (global.db.data.chats[m.chat]?.trivia) {
        global.db.data.chats[m.chat].trivia.attiva = false
        global.db.data.chats[m.chat].trivia.domandaCorrente = null
      }
    }, 3000)

    return true
  }

  trivia.partecipantiRisposto.add(m.sender)
  await m.reply('❌ *Risposta sbagliata!* Riprova la prossima volta.')
  return true
}

handler.help = ['trivia', 'toptrivia']
handler.tags = ['giochi']
handler.command = /^(trivia|toptrivia)$/i
handler.group = true

export default handler
