const handler = async (m, { conn }) => {
  try {

    const { keys } = conn.authState
    let deletedCount = 0

    const keyTypes = [
      'pre-key',
      'session',
      'sender-key',
      'app-state-sync-key',
      'app-state-sync-version',
      'sender-key-memory'
    ]

    for (const type of keyTypes) {
      const allKeys = await keys.get(type)
      if (!allKeys) continue

      for (const key of Object.keys(allKeys)) {
        if (key.includes('creds')) continue
        await keys.set({ type, key }, null)
        deletedCount++
      }
    }

    await conn.sendMessage(m.chat, {
      text: `⚙️ *${botName}*\nSessioni svuotate: *${deletedCount}*`
    })

    return true

  } catch (e) {
    console.error('[DELETE SESSION] Errore:', e)
    await conn.sendMessage(m.chat, {
      text: `❌ Errore durante la pulizia sessioni.`
    })
    return true
  }
}

handler.help = ['ds']
handler.tags = ['admin']
handler.command = /^ds$/i
handler.admin = true
handler.owner = true

export default handler
