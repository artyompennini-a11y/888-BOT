let handler = async (m, { conn, isAdmin, isBotAdmin, usedPrefix }) => {
  if (!m.isGroup) 
    return m.reply("❌ Questo comando può essere usato solo nei gruppi.")

  if (!isAdmin) 
    return m.reply("👑 Solo gli admin possono usare questo comando.")

  if (!isBotAdmin) 
    return m.reply("🤖 Devo essere admin per poter chiudere il gruppo!")

  const pulsanti = [
    ['🧊 1 minuto', `${usedPrefix}freeze_1`],
    ['🧊 5 minuti', `${usedPrefix}freeze_5`],
    ['🧊 10 minuti', `${usedPrefix}freeze_10`]
  ]

  const testo = 
`🚨 *FREEZE 888 BOT*

Scegli per quanto tempo bloccare il gruppo.
Durante il freeze solo gli admin potranno scrivere.

🧊 Modalità sicurezza attiva.`

  await conn.sendButton(
    m.chat,
    testo,
    "888 BOT — Sistema Sicurezza",
    null,
    pulsanti,
    m
  )
}

handler.command = /^freezegp$/i
handler.group = true
handler.admin = true

export default handler