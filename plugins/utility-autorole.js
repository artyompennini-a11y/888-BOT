const handler = async (m, { conn, text, usedPrefix, command, isGroup, isAdmin, participants }) => {
  if (!isGroup) return m.reply('⚠️ Questo comando funziona solo nei gruppi.')
  if (!isAdmin) return m.reply('❌ Solo admin possono gestire i ruoli automatici.')

  const args = text.trim().split(/\s+/)
  const action = args[0]?.toLowerCase()

  if (!action || !['add', 'remove', 'list', 'join', 'level', 'clear'].includes(action)) {
    return m.reply(`❌ Uso:\n• ${usedPrefix + command} add <ruolo>\n• ${usedPrefix + command} remove <ruolo>\n• ${usedPrefix + command} list\n• ${usedPrefix + command} join on/off\n• ${usedPrefix + command} level <livello> <ruolo>\n• ${usedPrefix + command} clear`)
  }

  const chatId = m.chat
  if (!global.db.data.autoRoles) global.db.data.autoRoles = {}
  if (!global.db.data.autoRoles[chatId]) global.db.data.autoRoles[chatId] = {
    joinRoles: [],
    levelRoles: {},
    enabled: true
  }

  const chatRoles = global.db.data.autoRoles[chatId]

  if (action === 'add') {
    const role = args.slice(1).join(' ')
    
    if (!role) {
      return m.reply('❌ Specifica un ruolo.\nEsempio: .autorole add Membro')
    }

    if (!chatRoles.joinRoles.includes(role)) {
      chatRoles.joinRoles.push(role)
    }

    await m.reply(`✅ Ruolo automatico aggiunto per i nuovi membri: ${role}`)

  } else if (action === 'remove') {
    const role = args.slice(1).join(' ')
    
    if (!role) {
      return m.reply('❌ Specifica un ruolo.')
    }

    const index = chatRoles.joinRoles.indexOf(role)
    if (index === -1) {
      return m.reply('❌ Ruolo non trovato.')
    }

    chatRoles.joinRoles.splice(index, 1)

    await m.reply(`✅ Ruolo rimosso: ${role}`)

  } else if (action === 'list') {
    const joinRoles = chatRoles.joinRoles || []
    const levelRoles = Object.entries(chatRoles.levelRoles || {})

    let msg = `📋 *Auto Roles Configurati:*\n\n`
    
    if (joinRoles.length > 0) {
      msg += `🎯 *Al join:*\n`
      joinRoles.forEach((role, i) => {
        msg += `${i + 1}. ${role}\n`
      })
      msg += '\n'
    }

    if (levelRoles.length > 0) {
      msg += `📊 *Per livello:*\n`
      levelRoles.forEach(([level, role]) => {
        msg += `• Livello ${level}: ${role}\n`
      })
      msg += '\n'
    }

    if (joinRoles.length === 0 && levelRoles.length === 0) {
      msg += 'Nessun ruolo automatico configurato.'
    }

    msg += `\n⚙️ Stato: ${chatRoles.enabled ? 'Attivo' : 'Disattivato'}`

    await m.reply(msg)

  } else if (action === 'join') {
    const status = args[1]?.toLowerCase()
    
    if (status === 'on') {
      chatRoles.enabled = true
      await m.reply('✅ Ruoli automatici al join attivati.')
    } else if (status === 'off') {
      chatRoles.enabled = false
      await m.reply('❌ Ruoli automatici al join disattivati.')
    } else {
      await m.reply(`Stato attuale: ${chatRoles.enabled ? 'Attivo' : 'Disattivato'}`)
    }

  } else if (action === 'level') {
    const level = parseInt(args[1])
    const role = args.slice(2).join(' ')

    if (!level || !role) {
      return m.reply('❌ Formato: level <livello> <ruolo>\nEsempio: .autorole level 5 Veterano')
    }

    chatRoles.levelRoles[level] = role

    await m.reply(`✅ Ruolo automatico al livello ${level}: ${role}`)

  } else if (action === 'clear') {
    chatRoles.joinRoles = []
    chatRoles.levelRoles = {}

    await m.reply('✅ Tutti i ruoli automatici sono stati cancellati.')
  }
}

handler.command = ['autorole', 'ar']
handler.help = ['autorole add <ruolo>', 'autorole level <livello> <ruolo>', 'autorole join on/off']
handler.tags = ['group', 'admin']
handler.group = true
handler.admin = true

if (!global.autoroleJoinListenerSet && global.conn) {
  global.autoroleJoinListenerSet = true
  global.conn.ev.on('group-participants.update', async (update) => {
    try {
      if (update.action !== 'add') return
      
      const chatId = update.id
      const chatRoles = global.db.data.autoRoles?.[chatId]
      if (!chatRoles?.enabled) return
      
      const newMember = update.participants?.find(p => p.includes('@s.whatsapp.net'))
      if (!newMember) return
      
      const memberId = global.conn.decodeJid(newMember)
      const joinRoles = chatRoles.joinRoles || []
      
      if (joinRoles.length > 0) {
        let msg = `🎯 *Ruoli Assegnati Automaticamente:*\n\n`
        joinRoles.forEach((role, i) => {
          msg += `${i + 1}. ${role}\n`
        })
        msg += `\nBenvenuto @${memberId.split('@')[0]}!`
        
        await global.conn.sendMessage(chatId, {
          text: msg,
          mentions: [memberId]
        })
      }
    } catch (e) {
      console.error('[Autorole] Errore:', e)
    }
  })
}

handler.after = async function (m, { conn, isGroup }) {
  if (!isGroup) return
  if (!m.isCommand) return
  
  const chatId = m.chat
  const userId = m.sender
  const chatRoles = global.db.data.autoRoles?.[chatId]
  if (!chatRoles) return
  
  const levelRoles = chatRoles.levelRoles || {}
  if (Object.keys(levelRoles).length === 0) return
  
  const user = global.db.data.users?.[userId]
  if (!user) return
  
  const currentLevel = user.level || 0
  
  for (const [level, role] of Object.entries(levelRoles)) {
    if (currentLevel >= parseInt(level)) {
      try {
        await conn.sendMessage(chatId, {
          text: `🎉 @${userId.split('@')[0]} ha raggiunto il livello ${level}!\n📝 Ruolo assegnato: ${role}`,
          mentions: [userId]
        })
      } catch (e) {
        console.error('[Autorole] Errore notifica livello:', e)
      }
    }
  }
}

export default handler
