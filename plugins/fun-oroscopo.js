// Plugin by Elixir & 888 staff

const segni = {
  'ariete': { emoji: '♈', date: '21 Mar - 19 Apr' },
  'toro': { emoji: '♉', date: '20 Apr - 20 Mag' },
  'gemelli': { emoji: '♊', date: '21 Mag - 20 Giu' },
  'cancro': { emoji: '♋', date: '21 Giu - 22 Lug' },
  'leone': { emoji: '♌', date: '23 Lug - 22 Ago' },
  'vergine': { emoji: '♍', date: '23 Ago - 22 Set' },
  'bilancia': { emoji: '♎', date: '23 Set - 22 Ott' },
  'scorpione': { emoji: '♏', date: '23 Ott - 21 Nov' },
  'sagittario': { emoji: '♐', date: '22 Nov - 21 Dic' },
  'capricorno': { emoji: '♑', date: '22 Dic - 19 Gen' },
  'acquario': { emoji: '♒', date: '20 Gen - 18 Feb' },
  'pesci': { emoji: '♓', date: '19 Feb - 20 Mar' },
}

const frasi = {
  amore: [
    'Oggi il cuore batte forte: potresti ricevere una sorpresa inaspettata.',
    'Le stelle favoriscono le dichiarazioni. Se hai qualcosa da dire, è il momento!',
    'Un incontro casuale potrebbe trasformarsi in qualcosa di speciale.',
    'La tua energia magnetica attirerà sguardi e attenzioni. Usala con saggezza.',
    'Qualcuno pensa a te più di quanto immagini. Sii aperto alle sorprese.',
    'In amore serve pazienza: non forzare le cose, lascia che accadano.',
    'Oggi sei particolarmente affascinante: sfrutta il tuo carisma.',
  ],
  lavoro: [
    'Una proposta interessante potrebbe arrivare inaspettatamente.',
    'La tua determinazione verrà notata dai superiori. Continua così!',
    'Evita conflitti inutili: la diplomazia sarà la tua arma vincente.',
    'Un progetto in sospeso potrebbe finalmente decollare.',
    'La collaborazione sarà la chiave: chiedi aiuto quando serve.',
    'Non temere i cambiamenti: potrebbero portare nuove opportunità.',
    'La tua creatività verrà premiata oggi. Non avere paura di osare.',
  ],
  salute: [
    'La tua energia è alta: sfruttala per fare attività fisica.',
    'Ricorda di bere più acqua e concederti una pausa dallo stress.',
    'Una camminata all\'aria aperta ti farà bene oggi.',
    'Dormi a sufficienza: il tuo corpo ti ringrazierà.',
    'Attenzione alla postura: qualche esercizio di stretching non guasta.',
    'La tua mente ha bisogno di riposo: concediti un momento di relax.',
    'Oggi è una buona giornata per iniziare una nuova abitudine salutare.',
  ],
  fortuna: [
    'Il numero fortunato del giorno è il 7. Tienilo a mente!',
    'Un colpo di fortuna potrebbe arrivare da un incontro inaspettato.',
    'La fortuna bussa due volte: sii pronto a cogliere l\'occasione.',
    'Il tuo colore fortunato è l\'azzurro: indossalo per attirare buona sorte.',
    'Oggi è il giorno ideale per provare la fortuna al gioco.',
    'Le piccole coincidenze potrebbero rivelarsi grandi opportunità.',
  ]
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    const list = Object.entries(segni).map(([key, s]) => `┃ ${s.emoji} *${key.charAt(0).toUpperCase() + key.slice(1)}* — ${s.date}`).join('\n')
    return m.reply(
      `🔮 *OROSCOPO*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `${list}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Usa ${usedPrefix}oroscopo *[segno]* per vedere il tuo oroscopo di oggi!`
    )
  }

  const segnoKey = text.toLowerCase().trim()
  const segno = segni[segnoKey]
  if (!segno) return m.reply('❌ *Segno non valido.* Prova con: ariete, toro, gemelli, cancro, leone, vergine, bilancia, scorpione, sagittario, capricorno, acquario, pesci')

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]
  const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  const result = `🔮 *OROSCOPO — ${segno.emoji} ${segnoKey.charAt(0).toUpperCase() + segnoKey.slice(1)}*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📅 *${oggi}*\n` +
    `🗓️ *Periodo:* ${segno.date}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💖 *AMORE*\n┃ ${pickRandom(frasi.amore)}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💼 *LAVORO*\n┃ ${pickRandom(frasi.lavoro)}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💪 *SALUTE*\n┃ ${pickRandom(frasi.salute)}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🍀 *FORTUNA*\n┃ ${pickRandom(frasi.fortuna)}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `✨ Generato da 𝟴𝟴𝟴 𝗕𝗢𝗧`

  await m.reply(result)
}

handler.help = ['oroscopo']
handler.tags = ['utility']
handler.command = /^(oroscopo|oroscopi)$/i

export default handler
