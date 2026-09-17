let freezeTimers = global.freezeTimers || (global.freezeTimers = {})

let handler = async (m, { conn, command, isBotAdmin }) => {
  if (!m.isGroup) return
  if (!isBotAdmin) return

  let minutes = 0
  if (command === 'freeze_1') minutes = 1
  if (command === 'freeze_5') minutes = 5
  if (command === 'freeze_10') minutes = 10
  if (!minutes) return

  const duration = minutes * 60 * 1000

  // Chiude il gruppo
  await conn.groupSettingUpdate(m.chat, 'announcement')

  // Reset timer precedente
  if (freezeTimers[m.chat]) clearTimeout(freezeTimers[m.chat])

  freezeTimers[m.chat] = setTimeout(async () => {
    await conn.groupSettingUpdate(m.chat, 'not_announcement')
    await conn.sendMessage(m.chat, { 
      text: "🔓 *Gruppo riaperto automaticamente.*"
    })
    delete freezeTimers[m.chat]
  }, duration)

  await conn.sendMessage(m.chat, {
    text: `🧊 *FREEZE ATTIVATO*

Il gruppo è stato chiuso temporaneamente da un admin.

⏳ Riapertura automatica tra *${minutes}* minuto/i.

🔐 Modalità sicurezza attiva.`
  })
}

handler.command = /^freeze_(1|5|10)$/i
handler.group = true
handler.admin = true

export default handler