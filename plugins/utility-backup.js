import fs from 'fs'

const handler = async (m, { conn, text, usedPrefix, command, isGroup, isAdmin }) => {
  if (!isGroup) return m.reply('⚠️ Questo comando funziona solo nei gruppi.')
  if (!isAdmin) return m.reply('❌ Solo admin possono usare questo comando.')

  const args = text.trim().split(/\s+/)
  const action = args[0]?.toLowerCase()

  if (!action || !['export', 'import', 'list', 'mirror', 'clonagruppo'].includes(action)) {
    return m.reply(`❌ Uso:\n• ${usedPrefix + command} export <nome> - Esporta configurazione\n• ${usedPrefix + command} import <nome> - Importa configurazione\n• ${usedPrefix + command} list - Lista backup\n• ${usedPrefix + command} mirror <nome> - Salva mirror gruppo\n• ${usedPrefix + command} clonagruppo <nome> - Clona gruppo da mirror`)
  }

  const chatId = m.chat
  if (!global.db.data.backups) global.db.data.backups = {}
  if (!global.db.data.backups[chatId]) global.db.data.backups[chatId] = {}

  if (action === 'mirror' || action === 'clonagruppo') {
    if (!isROwner) return m.reply('❌ Solo il proprietario del bot può usare mirror/clonagruppo.')
  }

  if (action === 'export') {
    const chatData = global.db.data.chats[chatId] || {}
    const backupName = args[1] || `backup_${Date.now()}`
    
    const backup = {
      chat: chatId,
      name: backupName,
      createdAt: new Date().toISOString(),
      data: {
        welcome: chatData.welcome,
        goodbye: chatData.goodbye,
        antilink: chatData.antiLink,
        antispam: chatData.antispam,
        antiporno: chatData.antiporno,
        antivoip: chatData.antivoip,
        antibusiness: chatData.antibusiness,
        slowmode: chatData.slowmode,
        modoadmin: chatData.modoadmin,
        autolevelup: chatData.autolevelup,
        reaction: chatData.reaction,
        vocali: chatData.vocali,
        ai: chatData.ai,
        antioneview: chatData.antioneview,
        rileva: chatData.rileva,
        users: chatData.users || {}
      }
    }

    global.db.data.backups[chatId][backupName] = backup

    await m.reply(`✅ *Backup creato!*\n\n📦 Nome: ${backupName}\n📅 Data: ${new Date().toLocaleDateString('it-IT')}\n\nUsa ${usedPrefix + command} import ${backupName} per ripristinare.`)
  
  } else if (action === 'import') {
    const backupName = args[1]
    
    if (!backupName) {
      return m.reply('❌ Specifica il nome del backup da importare.\nUsa .backup list per vedere i backup disponibili.')
    }

    const backup = global.db.data.backups[chatId]?.[backupName]
    
    if (!backup) {
      return m.reply('❌ Backup non trovato.')
    }

    const chatData = global.db.data.chats[chatId] || (global.db.data.chats[chatId] = {})
    
    Object.assign(chatData, backup.data)

    await m.reply(`✅ *Backup ripristinato!*\n\n📦 Nome: ${backupName}\n📅 Creato: ${new Date(backup.createdAt).toLocaleDateString('it-IT')}\n\nConfigurazione del gruppo aggiornata.`)
  
  } else if (action === 'list') {
    const backups = Object.keys(global.db.data.backups[chatId] || {})
    
    if (backups.length === 0) {
      return m.reply('❌ Nessun backup disponibile per questo gruppo.')
    }

    let msg = `📋 *Backup Disponibili:*\n\n`
    backups.forEach((name, i) => {
      const b = global.db.data.backups[chatId][name]
      msg += `${i + 1}. 📦 *${name}*\n   📅 ${new Date(b.createdAt).toLocaleDateString('it-IT')}\n\n`
    })

    await m.reply(msg)

  } else if (action === 'mirror') {
    const name = args[1]
    if (!name) return m.reply('⚠️ Specifica un nome per il salvataggio. Esempio: .backup mirror lunars')

    const metadata = await conn.groupMetadata(m.chat)
    let ppUrl = ''
    try {
      ppUrl = await conn.profilePictureUrl(m.chat, 'image')
    } catch (e) {
      ppUrl = ''
    }

    const settings = {
      announce: metadata.announce || false,
      restrict: metadata.restrict || false
    }

    const members = metadata.participants.map(p => conn.decodeJid(p.id))

    if (!global.db.data.mirrors) global.db.data.mirrors = {}
    global.db.data.mirrors[name] = {
      subject: metadata.subject,
      desc: metadata.desc || '',
      ppUrl: ppUrl,
      settings,
      members
    }
    if (typeof global.markDbDirty === 'function') global.markDbDirty()

    await m.reply(`✅ *Mirror del gruppo salvato!*\n\n📦 Nome: ${name}\n\nUsa ${usedPrefix + command} clonagruppo ${name} per ripristinarlo.`)

  } else if (action === 'clonagruppo') {
    const name = args[1]
    if (!name) return m.reply('⚠️ Specifica il nome del backup da clonare. Esempio: .backup clonagruppo lunars')

    const backup = global.db.data.mirrors?.[name]
    if (!backup) return m.reply(`❌ Nessun mirror trovato con il nome: ${name}`)

    if (backup.subject) {
      await conn.groupUpdateSubject(m.chat, backup.subject)
    }
    if (backup.desc) {
      await conn.groupUpdateDescription(m.chat, backup.desc)
    }
    if (backup.settings) {
      if (backup.settings.announce) {
        await conn.groupSettingUpdate(m.chat, 'announcement').catch(() => {})
      } else {
        await conn.groupSettingUpdate(m.chat, 'not_announcement').catch(() => {})
      }
      if (backup.settings.restrict) {
        await conn.groupSettingUpdate(m.chat, 'locked').catch(() => {})
      } else {
        await conn.groupSettingUpdate(m.chat, 'unlocked').catch(() => {})
      }
    }

    if (backup.ppUrl) {
      try {
        const res = await fetch(backup.ppUrl)
        const buffer = Buffer.from(await res.arrayBuffer())
        await conn.updateProfilePicture(m.chat, buffer)
      } catch (e) {}
    }

    const contacts = (backup.members || []).map(jid => {
      const num = jid.split('@')[0]
      return {
        displayName: `Ex Membro +${num}`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Ex Membro +${num}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`
      }
    })

    if (contacts.length > 0) {
      await conn.sendMessage(m.chat, {
        contacts: {
          displayName: `${contacts.length} Membri Salvati da 888 BOT`,
          contacts
        }
      }, { quoted: m })
    }

    await m.reply(`✅ *Gruppo clonato con successo!*\n\n📦 Mirror: ${name}`)
  }
}

handler.command = ['backup', 'restore', 'mirror', 'clonagruppo']
handler.help = ['backup export <nome>', 'backup import <nome>', 'backup list', 'backup mirror <nome>', 'backup clonagruppo <nome>']
handler.tags = ['group', 'admin']
handler.group = true
handler.admin = true
handler.rowner = true

export default handler
