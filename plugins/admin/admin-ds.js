//Plugin by Elixir, Punisher & 888 staff

import fs from 'fs'
import path from 'path'

const handler = async (m, { conn }) => {
  const safeSend = async (text) => {
    try {
      await conn.sendMessage(m.chat, { text })
      return true
    } catch (e) {
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
      } catch {}
    }

    const botName = global.nomebot || '𝟴𝟴𝟴 𝗕𝗢𝗧'
    await safeSend(`⚙️ *${botName}*\nSessioni svuotate: *${deletedCount}* file eliminati.`)

    return true

  } catch {
    await safeSend(`❌ Errore durante la pulizia della cartella sessioni.`)
    return true
  }
}

handler.help = ['ds']
handler.tags = ['admin']
handler.command = /^ds$/i
handler.admin = true

export default handler