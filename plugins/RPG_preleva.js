global.prelievi = global.prelievi || {}

let handler = async (m, { conn, command, text }) => {
  let users = global.db.data.users
  const who = m.sender

  if (!users[who]) users[who] = {}

  users[who].bank = Number(users[who].bank) || 0
  users[who].money = Number(users[who].money) || 0

  // ───────────────────────────────
  // 🔥 CONFERMA PRELIEVO — 888
  // ───────────────────────────────
  if (command === "confermaprelievo") {
    let data = global.prelievi[who]
    if (!data)
      return m.reply(
`╭━━━〔 ❌ *NESSUN PRELIEVO* 〕━━━┈
┃ Non hai alcun prelievo in corso.
╰━━━━━━━━━━━━━━━━━━┈`
      )

    let amount = Number(data) || 0

    if (amount > users[who].bank)
      return m.reply(
`╭━━━〔 🏦 *FONDI INSUFFICIENTI* 〕━━━┈
┃ Non hai abbastanza soldi in banca.
╰━━━━━━━━━━━━━━━━━━┈`
      )

    users[who].bank -= amount
    users[who].money += amount
    users[who].ultimoprelievo = amount

    delete global.prelievi[who]

    let testo =
`╭━━━〔 💸 *PRELIEVO EFFETTUATO* 〕━━━┈
┃ Hai prelevato: *${amount} 888COIN*
┃━━━━━━━━━━━━━━━━━━
┃ 💰 Contanti: *${users[who].money} 888COIN*
┃ 🏦 Banca: *${users[who].bank} 888COIN*
╰━━━━━━━━━━━━━━━━━━┈`

    return conn.reply(m.chat, testo, m)
  }

  // ───────────────────────────────
  // 🔥 ANNULLA PRELIEVO — 888
  // ───────────────────────────────
  if (command === "annullaprelievo") {
    delete global.prelievi[who]
    return m.reply(
`╭━━━〔 ❌ *PRELIEVO ANNULLATO* 〕━━━┈
┃ L’operazione è stata annullata.
╰━━━━━━━━━━━━━━━━━━┈`
    )
  }

  // ───────────────────────────────
  // 🔥 RICHIESTA IMPORTO — 888
  // ───────────────────────────────
  if (!text)
    throw `╭━━━〔 💸 *QUANTO VUOI PRELEVARE?* 〕━━━┈
┃ Inserisci l’importo da prelevare.
╰━━━━━━━━━━━━━━━━━━┈`

  const prelievo = parseInt(text)

  // ───────────────────────────────
  // 🔥 VALIDAZIONE IMPORTO — 888
  // ───────────────────────────────
  if (isNaN(prelievo))
    throw `╭━━━〔 ❌ *IMPORTO NON VALIDO* 〕━━━┈
┃ Devi inserire un numero.
╰━━━━━━━━━━━━━━━━━━┈`

  if (prelievo < 0)
    throw `╭━━━〔 ❌ *IMPORTO NEGATIVO* 〕━━━┈
┃ Non puoi prelevare soldi negativi.
╰━━━━━━━━━━━━━━━━━━┈`

  if (prelievo > users[who].bank)
    throw `╭━━━〔 🏦 *FONDI INSUFFICIENTI* 〕━━━┈
┃ Non hai abbastanza soldi in banca.
╰━━━━━━━━━━━━━━━━━━┈`

  global.prelievi[who] = prelievo

  // ───────────────────────────────
  // 🔥 CONFERMA CON BOTTONI — 888
  // ───────────────────────────────
  await conn.sendMessage(
    m.chat,
    {
      text:
`╭━━━〔 💸 *CONFERMA PRELIEVO* 〕━━━┈
┃ Vuoi prelevare *${prelievo} 888COIN*?
╰━━━━━━━━━━━━━━━━━━┈`,
      buttons: [
        { buttonId: ".confermaprelievo", buttonText: { displayText: "✅ SI" }, type: 1 },
        { buttonId: ".annullaprelievo", buttonText: { displayText: "❌ NO" }, type: 1 }
      ],
      headerType: 1
    },
    { quoted: m }
  )
}

handler.command = /^(preleva|prelievo|ritira|confermaprelievo|annullaprelievo)$/i
handler.tags = ['RPG']

export default handler