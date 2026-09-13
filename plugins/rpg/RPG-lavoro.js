let handler = async (m, { conn }) => {

  let user = global.db.data.users[m.sender]

  const cooldown = 1000 * 60 * 30 // 30 minuti
  const now = Date.now()

  if (!user.workCooldown) user.workCooldown = 0

  // ⏳ COOLDOWN — 888
  if (now < user.workCooldown) {
    let time = msToTime(user.workCooldown - now)
    return m.reply(`
⏳ *COOLDOWN LAVORO 888*
Hai già lavorato recentemente.
Puoi lavorare di nuovo tra *${time}*.
`.trim())
  }

  user.workCooldown = now + cooldown

  const successRate = 0.7
  const success = Math.random() < successRate

  // EVENTI — 888
  const lavori = [
    "hai lavorato come sviluppatore e non è esploso nulla",
    "hai fatto il rider sotto la pioggia come un eroe",
    "hai venduto oggetti inutili a prezzo folle",
    "hai fatto il DJ e nessuno si è lamentato",
    "hai lavorato in nero e ti è andata bene",
    "hai fatto il meccanico e l’auto funziona ancora",
    "hai fixato un bug da programmatore",
    "hai fatto il muratore senza scioglierti dal caldo",
    "hai truffato qualcuno con successo",
    "hai fatto il freelance e ti hanno pagato davvero"
  ]

  const fallimenti = [
    "ti hanno licenziato in tempo record",
    "hai rotto tutto e devi pagare i danni",
    "il capo è sparito con i tuoi soldi",
    "sei stato truffato male",
    "hai perso tutto in un attimo",
    "ti sei addormentato sul lavoro",
    "hai fatto una figura ridicola",
    "hai perso il cliente più ricco",
    "sei stato beccato a non fare nulla",
    "hai fatto crashare tutto"
  ]

  const evento = pickRandom(success ? lavori : fallimenti)
  const amount = Math.floor(Math.random() * 2000) + 1

  // RISULTATO — 888
  let text = `
💼 *LAVORO 888*
${evento}
`.trim()

  if (success) {
    user.money += amount
    text += `

✨ Guadagno: *+${amount} 888COIN*`
  } else {
    user.money -= amount
    if (user.money < 0) user.money = 0
    text += `

💀 Perdita: *-${amount} 888COIN*`
  }

  text += `

💼 Saldo attuale: *${user.money} 888COIN*`

  return conn.sendMessage(m.chat, { text }, { quoted: m })
}

handler.command = ['lavora']
handler.group = true

export default handler

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function msToTime(ms) {
  let minutes = Math.floor(ms / 60000)
  let seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}