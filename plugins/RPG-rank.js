let handler = async (m, { conn, args }) => {


  let target = m.mentionedJid?.[0] 
            || (args[0]?.includes('@') ? args[0].replace('@', '') + '@s.whatsapp.net' : null)
            || m.sender

  const user = global.db.data.users[target] || (global.db.data.users[target] = {})

 
  user.rankData = user.rankData || {}

  
  user.lvl = Number(
    user.lvl ??
    user.level ??
    user.rankData.level ??
    0
  )
  if (!Number.isFinite(user.lvl)) user.lvl = 0


  user.msgCount = Number(
    user.msgCount ??
    user.rankData.messages ??
    0
  )
  if (!Number.isFinite(user.msgCount)) user.msgCount = 0

  
  user.money = Number(user.money || 0)
  if (!Number.isFinite(user.money)) user.money = 0

  
  user.level = user.lvl
  user.rankData.level = user.lvl
  user.rankData.messages = user.msgCount

  const LEVEL_STEP = 300

  let percent = Math.min(100, Math.floor((user.msgCount / LEVEL_STEP) * 100))
  let bar = "█".repeat(Math.floor(percent / 10)) + "░".repeat(10 - Math.floor(percent / 10))
  let missing = Math.max(0, LEVEL_STEP - user.msgCount)

  let text = `
📊 *RANK SYSTEM*

👤 @${target.split('@')[0]}

🏆 Livello: ${user.lvl}
💬 Progress: ${user.msgCount}/${LEVEL_STEP}

${bar} ${percent}%

📈 Mancano: ${missing}
💰 Soldi: ${user.money}€
`

  await conn.sendMessage(
    m.chat,
    { text, mentions: [target] },
    { quoted: m }
  )
}

handler.command = ['rank']
export default handler
