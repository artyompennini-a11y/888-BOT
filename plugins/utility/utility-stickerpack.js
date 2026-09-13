import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const handler = async (m, { conn, text, usedPrefix, command, isGroup }) => {
  if (!isGroup) return m.reply('⚠️ Questo comando funziona solo nei gruppi.')

  const args = text.trim().split(/\s+/)
  const action = args[0]?.toLowerCase()

  if (!action || !['create', 'add', 'list', 'clear', 'export'].includes(action)) {
    return m.reply(`❌ Uso:\n• ${usedPrefix + command} create <nome> - Crea nuovo pack\n• ${usedPrefix + command} add <nome> - Aggiungi sticker corrente\n• ${usedPrefix + command} list - Lista pack\n• ${usedPrefix + command} clear <nome> - Cancella pack\n• ${usedPrefix + command} export <nome> - Esporta pack`)
  }

  const senderId = m.sender.replace(/[^0-9]/g, '')
  const baseDir = join(process.cwd(), 'tmp', 'stickerpacks', senderId)
  
  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true })
  }

  if (action === 'create') {
    const packName = args[1]?.toLowerCase().replace(/[^a-z0-9]/g, '_')
    
    if (!packName) {
      return m.reply('❌ Specifica un nome per il pack.\nEsempio: .stickerpack create mio_pack')
    }

    const packDir = join(baseDir, packName)
    if (existsSync(packDir)) {
      return m.reply('❌ Un pack con questo nome esiste già.')
    }

    mkdirSync(packDir, { recursive: true })
    
    const infoFile = join(packDir, 'info.json')
    writeFileSync(infoFile, JSON.stringify({
      name: packName,
      createdBy: senderId,
      createdAt: new Date().toISOString(),
      stickers: []
    }, null, 2))

    await m.reply(`✅ Pack "${packName}" creato!\n\nOra usa ${usedPrefix + command} add ${packName} per aggiungere sticker.`)

  } else if (action === 'add') {
    const packName = args[1]?.toLowerCase().replace(/[^a-z0-9]/g, '_')
    
    if (!packName) {
      return m.reply('❌ Specifica il nome del pack.\nEsempio: .stickerpack add mio_pack')
    }

    const packDir = join(baseDir, packName)
    if (!existsSync(packDir)) {
      return m.reply('❌ Pack non trovato. Usa .stickerpack create per crearlo.')
    }

    const quoted = m.quoted || m
    const mtype = quoted.mtype
    
    if (!['stickerMessage', 'imageMessage', 'videoMessage'].includes(mtype)) {
      return m.reply('❌ Rispondi a uno sticker, immagine o video.')
    }

    try {
      const media = await quoted.download()
      const ext = mtype === 'stickerMessage' ? 'webp' : 'png'
      const filename = `${Date.now()}.${ext}`
      const filepath = join(packDir, filename)
      
      writeFileSync(filepath, media)

      const infoFile = join(packDir, 'info.json')
      const info = JSON.parse(require('fs').readFileSync(infoFile, 'utf8'))
      info.stickers.push({
        filename,
        addedAt: new Date().toISOString(),
        addedBy: senderId
      })
      writeFileSync(infoFile, JSON.stringify(info, null, 2))

      await m.reply(`✅ Sticker aggiunto al pack "${packName}"!\n📊 Totale: ${info.stickers.length} sticker`)
    } catch (e) {
      m.reply(`❌ Errore: ${e.message}`)
    }

  } else if (action === 'list') {
    const packs = []
    
    try {
      const items = require('fs').readdirSync(baseDir)
      for (const item of items) {
        const infoFile = join(baseDir, item, 'info.json')
        if (existsSync(infoFile)) {
          const info = JSON.parse(require('fs').readFileSync(infoFile, 'utf8'))
          packs.push({
            name: info.name,
            count: info.stickers.length,
            createdAt: info.createdAt
          })
        }
      }
    } catch (e) {}

    if (packs.length === 0) {
      return m.reply('❌ Nessun pack creato.')
    }

    let msg = `📦 *I Tuoi Sticker Pack:*\n\n`
    packs.forEach((pack, i) => {
      msg += `${i + 1}. 📚 ${pack.name}\n   📊 ${pack.count} sticker\n\n`
    })

    await m.reply(msg)

  } else if (action === 'clear') {
    const packName = args[1]?.toLowerCase().replace(/[^a-z0-9]/g, '_')
    
    if (!packName) {
      return m.reply('❌ Specifica il nome del pack da cancellare.')
    }

    const packDir = join(baseDir, packName)
    if (!existsSync(packDir)) {
      return m.reply('❌ Pack non trovato.')
    }

    try {
      require('fs').rmSync(packDir, { recursive: true })
      await m.reply(`✅ Pack "${packName}" cancellato.`)
    } catch (e) {
      m.reply(`❌ Errore: ${e.message}`)
    }

  } else if (action === 'export') {
    const packName = args[1]?.toLowerCase().replace(/[^a-z0-9]/g, '_')
    
    if (!packName) {
      return m.reply('❌ Specifica il nome del pack da esportare.')
    }

    const packDir = join(baseDir, packName)
    if (!existsSync(packDir)) {
      return m.reply('❌ Pack non trovato.')
    }

    try {
      const outputZip = join(baseDir, `${packName}.zip`)
      execSync(`cd "${baseDir}" && zip -r "${packName}.zip" "${packName}"`, { stdio: 'ignore' })
      
      await conn.sendMessage(m.chat, {
        document: { url: outputZip },
        mimetype: 'application/zip',
        fileName: `${packName}.zip`,
        caption: `📦 Pack: ${packName}`
      }, { quoted: m })

    } catch (e) {
      m.reply(`❌ Errore durante l'export: ${e.message}`)
    }
  }
}

handler.command = ['stickerpack', 'pack', 'sp']
handler.help = ['stickerpack create <nome>', 'stickerpack add <nome>', 'stickerpack list']
handler.tags = ['fun', 'sticker']

export default handler
