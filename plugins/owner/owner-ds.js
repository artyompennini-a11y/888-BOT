import fs from 'fs'
import path from 'path'

const handler = async (m, { conn }) => {
  try {
   
    const sessionDir = path.join(process.cwd(), '888BotSession')
    let deletedCount = 0

   
    if (!fs.existsSync(sessionDir)) {
      await conn.sendMessage(m.chat, {
        text: `❌ La cartella *888BotSession* non esiste.`
      })
      return true
    }


    const files = fs.readdirSync(sessionDir)

    for (const file of files) {
    
      if (file.includes('creds.json')) continue

      const filePath = path.join(sessionDir, file)
    
      if (fs.lstatSync(filePath).isFile()) {
        fs.unlinkSync(filePath)
        deletedCount++
      }
    }

    await conn.sendMessage(m.chat, {
      text: `⚙️ *${botName}*\nSessioni svuotate: *${deletedCount}* file eliminati.`
    })

    return true

  } catch (e) {
    console.error('[DELETE SESSION] Errore:', e)
    await conn.sendMessage(m.chat, {
      text: `❌ Errore durante la pulizia della cartella sessioni.`
    })
    return true
  }
}

handler.help = ['ds']
handler.tags = ['admin']
handler.command = /^ds\$/i
handler.admin = true
handler.owner = true

export default handler
