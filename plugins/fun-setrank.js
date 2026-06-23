//Plugin by Elixir, Punisher & 888 staff

let handler = async (m, { conn, args, command }) => {

  let target = m.mentionedJid?.[0] || (m.quoted?.sender) || m.sender
  
  let amount = parseInt(args[0])
  if (isNaN(amount) || amount <= 0) {
    return m.reply('❌ Inserisci un numero valido di livelli.')
  }

  if (!global.db.data.users[target]) {
    global.db.data.users[target] = {}
  }

  let user = global.db.data.users[target]

  if (typeof user.lvl !== 'number') user.lvl = Number(user.level ?? user.rankData?.level ?? 0) || 0

  if (command === 'setlevel' || command === 'setrank' || command === 'addrank' || command === 'addlevel') {
    user.lvl += amount
    user.level = user.lvl
    user.rankData = user.rankData || {}
    user.rankData.level = user.lvl

    let text = target === m.sender
      ? `✅ Ti sei aggiunto *+${amount}* livelli!\n🏆 Ora sei al livello *${user.lvl}*`
      : `✅ Aggiunti *+${amount}* livelli a @${target.split('@')[0]}!\n🏆 Ora è al livello *${user.lvl}*`

    await conn.sendMessage(m.chat, { text, mentions: [target] }, { quoted: m })
  } else if (command === 'delrank' || command === 'removelevel' || command === 'removerank' || command === 'dellevel') {
    if (user.lvl - amount < 0) {
      amount = user.lvl 
    }
    user.lvl -= amount
    user.level = user.lvl
    user.rankData = user.rankData || {}
    user.rankData.level = user.lvl

    let text = target === m.sender
      ? `✅ Ti sei rimosso *-${amount}* livelli!\n🏆 Ora sei al livello *${user.lvl}*`
      : `✅ Rimossi *-${amount}* livelli a @${target.split('@')[0]}!\n🏆 Ora è al livello *${user.lvl}*`

    await conn.sendMessage(m.chat, { text, mentions: [target] }, { quoted: m })
  }
}

handler.help = ['setlevel', 'addlevel', 'dellevel', 'removelevel']
handler.tags = ['owner']
handler.command = /^(setlevel|setrank|addrank|addlevel|delrank|removerank|removelevel|dellevel)$/i
handler.rowner = true

export default handler
