const handler = async (m, { conn, text, usedPrefix, command, isGroup, isAdmin }) => {
  if (!isGroup) return m.reply('⚠️ Questo comando funziona solo nei gruppi.')
  if (!isAdmin) return m.reply('❌ Solo admin possono gestire i reaction roles.')

  const args = text.trim().split(/\s+/)
  const action = args[0]?.toLowerCase()

  if (!action || !['add', 'remove', 'list', 'open', 'close'].includes(action)) {
    return m.reply(`❌ Uso:\n• ${usedPrefix + command} add <emoji> <ruolo>\n• ${usedPrefix + command} remove <emoji>\n• ${usedPrefix + command} list\n• ${usedPrefix + command} open\n• ${usedPrefix + command} close`)
  }

  const chatId = m.chat
  if (!global.db.data.reactionRoles) global.db.data.reactionRoles = {}
  if (!global.db.data.reactionRoles[chatId]) global.db.data.reactionRoles[chatId] = {
    roles: {},
    active: false,
    messageId: null
  }

  const chatRoles = global.db.data.reactionRoles[chatId]

  if (action === 'add') {
    const emoji = args[1]
    const role = args.slice(2).join(' ')

    if (!emoji || !role) {
      return m.reply('❌ Formato: add <emoji> <ruolo>\nEsempio: add 🎮 Gamer')
    }

    chatRoles.roles[emoji] = role

    await m.reply(`✅ Reaction role aggiunto!\n🎭 ${emoji} → ${role}`)

  } else if (action === 'remove') {
    const emoji = args[1]
    
    if (!emoji || !chatRoles.roles[emoji]) {
      return m.reply('❌ Emoji non trovata. Usa .reactionroles list per vedere quelle disponibili.')
    }

    delete chatRoles.roles[emoji]

    await m.reply(`✅ Reaction role rimosso: ${emoji}`)

  } else if (action === 'list') {
    const roles = Object.entries(chatRoles.roles)
    
    if (roles.length === 0) {
      return m.reply('❌ Nessun reaction role configurato.')
    }

    let msg = `📋 *Reaction Roles:*\n\n`
    roles.forEach(([emoji, role], i) => {
      msg += `${i + 1}. ${emoji} → ${role}\n`
    })

    await m.reply(msg)

  } else if (action === 'open') {
    if (Object.keys(chatRoles.roles).length === 0) {
      return m.reply('❌ Aggiungi prima dei reaction roles con add.')
    }

    try {
      const sentMsg = await conn.sendMessage(m.chat, {
        text: `🎭 *REACTION ROLES*\n\nReagisci a questo messaggio per ottenere un ruolo!\n\n${Object.entries(chatRoles.roles).map(([emoji, role]) => `${emoji} ${role}`).join('\n')}`
      })

      chatRoles.active = true
      chatRoles.messageId = sentMsg.key.id

      await m.reply('✅ Reaction roles attivati! Reagisci al messaggio per ottenere i ruoli.')
    } catch (e) {
      m.reply(`❌ Errore: ${e.message}`)
    }

  } else if (action === 'close') {
    chatRoles.active = false
    chatRoles.messageId = null

    await m.reply('✅ Reaction roles disattivati.')
  }
}

handler.command = ['reactionrole', 'rr', 'reactionroles']
handler.help = ['reactionrole add <emoji> <ruolo>', 'reactionrole open', 'reactionrole list']
handler.tags = ['group', 'admin']
handler.group = true
handler.admin = true

export default handler
