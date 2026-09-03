let handler = async (m, { conn, text, command, usedPrefix, args }) => {
  let users = global.db.data.users[m.sender]
  let cavalli = ["testa", "croce"]

  let partecipante = args[0]?.toLowerCase()

  // ───────────────────────────────
  // 🔥 SIMBOLO NON VALIDO — 888
  // ───────────────────────────────
  if (!partecipante || !cavalli.includes(partecipante)) {
    return await conn.reply(
      m.chat,
`╭━━━〔 ⚠️ *SIMBOLO NON VALIDO* 〕━━━┈
┃ Usa: ${usedPrefix}sorte testa 150
┃━━━━━━━━━━━━━━━━━━
┃ Simboli disponibili:
┃ ➜ *testa*, *croce*
╰━━━━━━━━━━━━━━━━━━┈`,
      m
    )
  }

  let scommessa = parseInt(args[1])

  // ───────────────────────────────
  // 🔥 IMPORTO NON VALIDO — 888
  // ───────────────────────────────
  if (isNaN(scommessa) || scommessa <= 0) {
    return await conn.reply(
      m.chat,
`╭━━━〔 ⚠️ *IMPORTO NON VALIDO* 〕━━━┈
┃ Esempio:
┃ ➜ ${usedPrefix}sorte testa 150
╰━━━━━━━━━━━━━━━━━━┈`,
      m
    )
  }

  // ───────────────────────────────
  // 🔥 SOLDI INSUFFICIENTI — 888
  // ───────────────────────────────
  if (scommessa > users.money)
    throw `╭━━━〔 ❌ *FONDI INSUFFICIENTI* 〕━━━┈
┃ Ti mancano *${scommessa - users.money} 888COIN*
┃ per effettuare questa scommessa.
╰━━━━━━━━━━━━━━━━━━┈`

  // ───────────────────────────────
  // 🔥 RISULTATO — 888
  // ───────────────────────────────
  let risultatoCorsa = cavalli[Math.floor(Math.random() * cavalli.length)]

  if (partecipante === risultatoCorsa) {
    let vincita = scommessa * 2
    users.money += vincita

    return m.reply(
`╭━━━〔 🎉 *HAI VINTO!* 〕━━━┈
┃ È uscito: *${risultatoCorsa}*
┃━━━━━━━━━━━━━━━━━━
┃ 💰 Vincita: *${vincita} 888COIN*
┃ 💼 Saldo attuale: *${users.money} 888COIN*
╰━━━━━━━━━━━━━━━━━━┈`
    )
  } else {
    users.money -= scommessa

    return m.reply(
`╭━━━〔 ❌ *HAI PERSO* 〕━━━┈
┃ È uscito: *${risultatoCorsa}*
┃━━━━━━━━━━━━━━━━━━
┃ 💸 Perdita: *${scommessa} 888COIN*
┃ 💼 Saldo attuale: *${users.money} 888COIN*
╰━━━━━━━━━━━━━━━━━━┈`
    )
  }
}

handler.command = /^(sorte)$/i
handler.help = ['𝐬𝐨𝐫𝐭𝐞 𝐭𝐞𝐬𝐭𝐚/𝐜𝐫𝐨𝐜𝐞']
handler.tags = ['fun']

export default handler