let handler = async (m, { conn }) => {

  let user = global.db.data.users[m.sender]
  let reward = 100 // esempio

  await conn.sendMessage(m.chat, {
    text: `
🎉 *LEVEL UP*

@${m.sender.split('@')[0]}

🏆 Livello: *${user.lvl}*
💰 Ricompensa: *+${reward}€*

📈 Prossimo livello tra *300 messaggi*
Digita *rank* per vedere la tua posizione.
`,
    mentions: [m.sender]
  })

}

handler.help = ['rank']
handler.tags = ['rpg']
handler.command = /^rank$/i

export default handler
