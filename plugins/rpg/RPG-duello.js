let duelli = {}

const handler = async (m, { conn, args }) => {

  if (!m.isGroup) return m.reply("❌ Questo comando funziona solo nei gruppi.")

  const sender = m.sender
  const target = m.mentionedJid?.[0] || m.quoted?.sender

  if (!target) return m.reply("Tagga qualcuno da sfidare.")
  if (target === sender) return m.reply("Non puoi sfidare te stesso.")

  const users = global.db.data.users
  if (!users[sender]) users[sender] = { money: 0 }
  if (!users[target]) users[target] = { money: 0 }

  const user1 = users[sender]
  const user2 = users[target]

  let bet = parseInt(args[0])
  if (!bet || bet < 50)
    return m.reply("💸 Puntata minima: *50 888COIN*\nUso: *.duello (soldi) @user*")

  if (user1.money < bet) return m.reply("💸 Non hai abbastanza soldi.")
  if (user2.money < bet) return m.reply("💸 L'altro utente non ha abbastanza soldi.")

  if (duelli[m.chat]) return m.reply("⚠️ C'è già un duello in corso.")
  duelli[m.chat] = true

  // ───────────────────────────────
  // ⚔️ INVITO DUELLO — 888
  // ───────────────────────────────
  await conn.sendMessage(m.chat, {
    text: `
⚔️ *DUELLO 888 IN ARRIVO*

👤 @${sender.split('@')[0]}
   ⚔️ VS ⚔️
🎯 @${target.split('@')[0]}

💰 Puntata: *${bet} 888COIN*

⚡ Scrivi *accetto* per combattere  
⏳ Tempo: 30 secondi
`.trim(),
    mentions: [sender, target]
  }, { quoted: m })

  // Attesa risposta
  const collected = await new Promise(resolve => {

    const listener = async ({ messages }) => {
      const msg = messages[0]
      if (!msg?.message) return

      const senderMsg = msg.key.participant || msg.key.remoteJid

      if (senderMsg === target && msg.key.remoteJid === m.chat) {
        conn.ev.off('messages.upsert', listener)
        resolve(msg)
      }
    }

    conn.ev.on('messages.upsert', listener)

    setTimeout(() => {
      conn.ev.off('messages.upsert', listener)
      resolve(null)
    }, 30000)
  })

  // ───────────────────────────────
  // ⌛ DUELLO NON ACCETTATO — 888
  // ───────────────────────────────
  if (!collected) {
    delete duelli[m.chat]

    return conn.sendMessage(m.chat, {
      text: `
⌛ *DUELLO ANNULLATO 888*

@${target.split('@')[0]} non ha accettato.

🐔 Aveva paura.
`.trim(),
      mentions: [target]
    }, { quoted: m })
  }

  const msgObj = collected.message
  let answer = ""

  if (msgObj?.conversation) answer = msgObj.conversation
  else if (msgObj?.extendedTextMessage?.text) answer = msgObj.extendedTextMessage.text
  else if (msgObj?.imageMessage?.caption) answer = msgObj.imageMessage.caption

  answer = answer.toLowerCase().trim()

  if (answer !== "accetto") {
    delete duelli[m.chat]
    return m.reply("❌ Duello rifiutato.")
  }

  if (user1.money < bet || user2.money < bet) {
    delete duelli[m.chat]
    return m.reply("❌ Uno dei due non ha più i soldi.")
  }

  // ───────────────────────────────
  // ⚔️ ANIMAZIONE DUELLO — 888
  // ───────────────────────────────
  await conn.sendMessage(m.chat, { text: "⚔️ I combattenti si preparano..." })
  await new Promise(r => setTimeout(r, 1500))

  await conn.sendMessage(m.chat, { text: "💥 Scontro in corso..." })
  await new Promise(r => setTimeout(r, 1500))

  await conn.sendMessage(m.chat, { text: "🎲 Il destino decide..." })
  await new Promise(r => setTimeout(r, 2000))

  // ───────────────────────────────
  // 🏆 RISULTATO — 888
  // ───────────────────────────────
  const players = [sender, target]
  const winner = players[Math.floor(Math.random() * players.length)]
  const loser = players.find(u => u !== winner)

  users[winner].money += bet
  users[loser].money -= bet

  await conn.sendMessage(m.chat, {
    text: `
🏆 *DUELLO 888 TERMINATO*

🥇 Vincitore:
➤ @${winner.split('@')[0]}

💀 Sconfitto:
➤ @${loser.split('@')[0]}

💰 Guadagno:
+${bet} 888COIN

🔥 Che fight.
`.trim(),
    mentions: [winner, loser]
  })

  delete duelli[m.chat]
}

handler.command = /^duello$/i
handler.group = true

export default handler