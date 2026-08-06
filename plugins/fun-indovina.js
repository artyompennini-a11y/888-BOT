// Plugin by Elixir & 888 staff

const paroleFacili = ['casa', 'cane', 'gatto', 'sole', 'luna', 'mare', 'monte', 'fiore', 'pane', 'acqua']
const paroleMedie = ['pizza', 'computer', 'telefono', 'bicicletta', 'automobile', 'spiaggia', 'montagna', 'cioccolato', 'pomodoro', 'finestra']
const paroleDifficili = ['catamarano', 'semaforo', 'piattaforma', 'elicottero', 'paracadute', 'frigorifero', 'candeliere', 'scaffalatura', 'trampolino', 'architettura']

let handler = async (m, { conn, usedPrefix, command }) => {
  if (!global.db.data.chats[m.chat].indovina) {
    global.db.data.chats[m.chat].indovina = { attiva: false, parola: null, lettereIndovinate: [], tentativi: 0, parolaOriginale: null }
  }

  const gioco = global.db.data.chats[m.chat].indovina

  if (gioco.attiva) {
    return m.reply(`⚠️ *Una partita di "Indovina la Parola" è già in corso!*\n\nUsa ${usedPrefix}indovina lettera *[lettera]* o ${usedPrefix}indovina parola *[parola]* per giocare.`)
  }

  let pool = paroleFacili
  if (command === 'indovinamedio') pool = paroleMedie
  if (command === 'indovinadifficile') pool = paroleDifficili

  const parola = pool[Math.floor(Math.random() * pool.length)]

  gioco.attiva = true
  gioco.parolaOriginale = parola
  gioco.parola = parola
  gioco.lettereIndovinate = []
  gioco.tentativi = 0

  const display = parola.split('').map(l => '_').join(' ')

  await m.reply(
    `🕵️ *INDOVINA LA PAROLA!*\n\n` +
    `📝 *Parola:* ${display}\n` +
    `ℹ️ *Difficoltà:* ${command === 'indovinadifficile' ? '🔴 Difficile' : command === 'indovinamedio' ? '🟡 Media' : '🟢 Facile'}\n\n` +
    `Regole:\n` +
    `• ${usedPrefix}indovina lettera *[lettera]* per indovinare una lettera\n` +
    `• ${usedPrefix}indovina parola *[parola]* per indovinare l'intera parola\n` +
    `• Hai *6 tentativi* sbagliati massimo\n\n` +
    `🎮 Buona fortuna!`
  )
}

handler.before = async (m, { conn }) => {
  if (!m.isGroup) return false
  if (!m.text) return false

  const gioco = global.db.data.chats[m.chat]?.indovina
  if (!gioco || !gioco.attiva) return false

  const text = m.text.trim().toLowerCase()
  const prefix = global.prefix || '.'

  if (text.startsWith(`${prefix}indovina lettera `)) {
    const lettera = text.replace(`${prefix}indovina lettera `, '').trim().charAt(0)
    if (!lettera || !/[a-z]/.test(lettera)) return false

    if (gioco.lettereIndovinate.includes(lettera)) {
      await m.reply(`⚠️ *La lettera "${lettera}" è già stata indovinata!*`)
      return true
    }

    gioco.lettereIndovinate.push(lettera)

    if (gioco.parolaOriginale.includes(lettera)) {
      const display = gioco.parolaOriginale.split('').map(l => gioco.lettereIndovinate.includes(l) ? l : '_').join(' ')

      if (!display.includes('_')) {
        gioco.attiva = false
        const name = await conn.getName(m.sender)
        await m.reply(`🎉 *PAROLA INDOVINATA!*\n\n` +
          `🏆 *Vincitore:* ${name}\n` +
          `📝 *Parola:* ${gioco.parolaOriginale}\n` +
          `✏️ *Tentativi totali:* ${gioco.tentativi + 1}`)
      } else {
        await m.reply(`✅ *La lettera "${lettera}" è nella parola!*\n\n📝 *${display}*\n\nContinuate così!`)
      }
      return true
    } else {
      gioco.tentativi++
      const display = gioco.parolaOriginale.split('').map(l => gioco.lettereIndovinate.includes(l) ? l : '_').join(' ')

      if (gioco.tentativi >= 6) {
        gioco.attiva = false
        await m.reply(`💀 *TENTATIVI ESAURITI!*\n\n` +
          `❌ *Risposta corretta:* ${gioco.parolaOriginale}\n\n` +
          `Riprova con ${prefix}indovina!`)
        return true
      }

      await m.reply(`❌ *La lettera "${lettera}" non c'è!*\n\n` +
        `📝 *${display}*\n` +
        `💀 *Tentativi sbagliati:* ${gioco.tentativi}/6`)
      return true
    }
  }

  if (text.startsWith(`${prefix}indovina parola `)) {
    const parolaGuess = text.replace(`${prefix}indovina parola `, '').trim().toLowerCase()

    if (parolaGuess === gioco.parolaOriginale) {
      gioco.attiva = false
      const name = await conn.getName(m.sender)
      await m.reply(`🎉 *PAROLA INDOVINATA!*\n\n` +
        `🏆 *Vincitore:* ${name}\n` +
        `📝 *Parola:* ${gioco.parolaOriginale}\n` +
        `✏️ *Tentativi totali:* ${gioco.tentativi + 1}`)
    } else {
      gioco.tentativi++
      if (gioco.tentativi >= 6) {
        gioco.attiva = false
        await m.reply(`💀 *TENTATIVI ESAURITI!*\n\n` +
          `❌ *Risposta corretta:* ${gioco.parolaOriginale}\n\n` +
          `Riprova con ${prefix}indovina!`)
        return true
      }
      await m.reply(`❌ *La parola "${parolaGuess}" non è corretta!*\n\n💀 *Tentativi sbagliati:* ${gioco.tentativi}/6`)
    }
    return true
  }

  return false
}

handler.help = ['indovina', 'indovinamedio', 'indovinadifficile']
handler.tags = ['giochi']
handler.command = /^(indovina|indovinamedio|indovinadifficile)$/i
handler.group = true

export default handler
