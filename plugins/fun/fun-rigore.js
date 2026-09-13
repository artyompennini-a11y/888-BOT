global.rigori = global.rigori || {}

let handler = async (m, { conn, command }) => {

  let user = global.db.data.users[m.sender]
  if (!user) return

  user.rigori = user.rigori || { goal: 0 }

  // ───────────────────────────────
  // 🔥 AVVIO RIGORE — 888
  // ───────────────────────────────
  if (command === "rigore") {

    global.rigori[m.sender] = true

    return conn.sendMessage(m.chat, {
      text:
`╭━━━〔 ⚽ *RIGORE 888* 〕━━━┈
┃ Scegli dove tirare:
┃━━━━━━━━━━━━━━━━━━
┃ 🟢 Sinistra
┃ ⚪ Centro
┃ 🔴 Destra
╰━━━━━━━━━━━━━━━━━━┈`,
      buttons: [
        { buttonId: ".tira sinistra", buttonText: { displayText: "🟢 Sinistra" }, type: 1 },
        { buttonId: ".tira centro", buttonText: { displayText: "⚪ Centro" }, type: 1 },
        { buttonId: ".tira destra", buttonText: { displayText: "🔴 Destra" }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }

  // ───────────────────────────────
  // 🔥 TIRA IL RIGORE — 888
  // ───────────────────────────────
  if (command === "tira") {

    if (!global.rigori[m.sender])
      return m.reply(
`╭━━━〔 ❌ *ERRORE* 〕━━━┈
┃ Devi prima usare *.rigore*
╰━━━━━━━━━━━━━━━━━━┈`
      )

    let scelta = m.text.split(" ")[1]
    let portiere = ["sinistra", "centro", "destra"][Math.floor(Math.random() * 3)]
    let gol = scelta !== portiere

    let text = ""

    if (gol) {
      user.rigori.goal += 1

      text =
`╭━━━〔 ⚽ *GOL!* 〕━━━┈
┃ 🥅 Il portiere va: *${portiere}*
┃ Tu tiri: *${scelta}*
┃━━━━━━━━━━━━━━━━━━
┃ ⚽ *Segni!*
┃ Totale gol: *${user.rigori.goal}*
╰━━━━━━━━━━━━━━━━━━┈`
    } else {
      text =
`╭━━━〔 🧤 *PARATA!* 〕━━━┈
┃ Il portiere legge tutto.
┃ Tu tiri: *${scelta}*
┃━━━━━━━━━━━━━━━━━━
┃ 💀 Che figura…
╰━━━━━━━━━━━━━━━━━━┈`
    }

    delete global.rigori[m.sender]

    return conn.sendMessage(m.chat, {
      text,
      buttons: [
        { buttonId: ".rigore", buttonText: { displayText: "⚽ Riprova" }, type: 1 },
        { buttonId: ".toprigori", buttonText: { displayText: "🏆 Classifica" }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }

  // ───────────────────────────────
  // 🔥 CLASSIFICA RIGORI — 888
  // ───────────────────────────────
  if (command === "toprigori") {

    let users = Object.entries(global.db.data.users)
      .map(([jid, data]) => ({
        jid,
        goal: data.rigori?.goal || 0
      }))
      .filter(u => u.goal > 0)
      .sort((a, b) => b.goal - a.goal)
      .slice(0, 10)

    if (!users.length)
      return m.reply(
`╭━━━〔 ❌ *NESSUN GOL* 〕━━━┈
┃ Nessun giocatore ha segnato.
╰━━━━━━━━━━━━━━━━━━┈`
      )

    let text =
`╭━━━〔 🏆 *TOP RIGORI* 〕━━━┈
┃ Classifica dei migliori rigoristi:
┃━━━━━━━━━━━━━━━━━━\n`

    users.forEach((u, i) => {
      text += `┃ ${i + 1}. @${u.jid.split("@")[0]} — *${u.goal} gol*\n`
    })

    text += `╰━━━━━━━━━━━━━━━━━━┈`

    return conn.sendMessage(m.chat, {
      text,
      mentions: users.map(u => u.jid),
      buttons: [
        { buttonId: ".rigore", buttonText: { displayText: "⚽ Gioca" }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }
}

handler.command = /^(rigore|tira|toprigori)$/i
export default handler