import fs from 'fs'
import path from 'path'

const handler = async (m, { conn }) => {
  // Invio "sicuro": un errore di rete/forbidden non deve far crashare il plugin
  const safeSend = async (text) => {
    try {
      await conn.sendMessage(m.chat, { text })
      return true
    } catch (e) {
      console.error('[DELETE SESSION] Invio messaggio fallito:', e?.message || e)
      return false
    }
  }

  try {
    const sessionDir = path.join(process.cwd(), '888BotSession')
    let deletedCount = 0

    if (!fs.existsSync(sessionDir)) {
      await safeSend(`❌ La cartella *888BotSession* non esiste.`)
      return true
    }

    const files = fs.readdirSync(sessionDir)

    for (const file of files) {
      if (file === 'creds.json') continue

      const filePath = path.join(sessionDir, file)

      try {
        if (fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath)
          deletedCount++
        }
      } catch (err) {
        console.error(`[DELETE SESSION] Impossibile eliminare ${file}:`, err.message)
      }
    }

    const botName = global.nomebot || '𝟴𝟴𝟴 𝗕𝗢𝗧'
    await safeSend(`⚙️ *${botName}*\nSessioni svuotate: *${deletedCount}* file eliminati.`)

    return true

  } catch (e) {
    console.error('[DELETE SESSION] Errore:', e)
    await safeSend(`❌ Errore durante la pulizia della cartella sessioni.`)
    return true
  }
}

handler.help = ['ds']
handler.tags = ['admin']
handler.command = /^ds$/i
handler.admin = true

export default handler
