//Plugin by Gab, Lucifero & 333 staff

let handler = async (m, { conn, args }) => {
  let bet = parseInt(args[0])
  let user = global.db.data.users[m.sender]

  if (user.money < bet) return m.reply(`💸 Devi avere almeno ${bet} 888COIN`)

  let u = Math.floor(Math.random()*6)+1
  let b = Math.floor(Math.random()*6)+1

  let text

  if (u > b) {
    user.money += bet
    text =
`╭━━━〔🎲 𝐃𝐀𝐃𝐈 〕━━━┈
┃ 🎲 Tu: ${u} | Bot: ${b}
┃ 🏆 VITTORIA +${bet} 888COIN
┃
┃ 💼 Saldo: ${user.money} 888COIN
╰━━━━━━━━━━━━━━━━━━┈`
  } else if (u < b) {
    user.money -= bet
    text =
`╭━━━〔🎲 𝐃𝐀𝐃𝐈 〕━━━┈
┃ 🎲 Tu: ${u} | Bot: ${b}
┃ 💀 SCONFITTA -${bet} 888COIN
┃
┃ 💼 Saldo: ${user.money} 888COIN
╰━━━━━━━━━━━━━━━━━━┈`
  } else {
    text =
`╭━━━〔🎲 𝐃𝐀𝐃𝐈 〕━━━┈
┃ 🎲 Tu: ${u} | Bot: ${b}
┃ 😐 Pareggio
┃
┃ 💼 Saldo: ${user.money} 888COIN
╰━━━━━━━━━━━━━━━━━━┈`
  }

  await conn.sendMessage(m.chat, {
    text,
    buttons: [
      { buttonId: ".dadi", buttonText: { displayText: "🔁 Gioca di nuovo" }, type: 1 }
    ],
    headerType: 1
  }, { quoted: m })
}

handler.command = /^dadiplay$/i
export default handler
