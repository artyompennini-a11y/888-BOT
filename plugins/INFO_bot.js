let handler = async (m, { conn }) => {
  const stats = global.db.data.stats || {}
  const users = global.db.data.users || {}
  const chats = global.db.data.chats || {}

  const totalCommands = Object.values(stats).reduce((a, s) => a + (s.total || 0), 0)
  const totalSuccess  = Object.values(stats).reduce((a, s) => a + (s.success || 0), 0)
  const totalUsers    = Object.keys(users).length
  const totalGroups   = Object.keys(chats).filter(k => k.endsWith('@g.us')).length
  const totalPlugins  = Object.keys(global.plugins || {}).length
  const activePlugins = Object.values(global.plugins || {}).filter(p => !p.disabled).length

  const topPlugins = Object.entries(stats)
    .sort(([,a], [,b]) => (b.total || 0) - (a.total || 0))
    .slice(0, 5)
    .map(([name, s], i) => {
      const short = name.replace(/^.*[\\/]/, '').replace('.js', '')
      return `┃  ${i + 1}. _${short}_ ⮕ ${s.total} usi (${s.success} ok)`
    }).join('\n')

  const topUsers = Object.entries(users)
    .sort(([,a], [,b]) => (b.comandiEseguiti || 0) - (a.comandiEseguiti || 0))
    .slice(0, 5)
    .map(([jid, u], i) => {
      const num = jid.split('@')[0]
      return `┃  ${i + 1}. _+${num}_ ⮕ ${u.comandiEseguiti || 0} comandi`
    }).join('\n')

  const uptime = process.uptime()
  const h = Math.floor(uptime / 3600)
  const min = Math.floor((uptime % 3600) / 60)
  const sec = Math.floor(uptime % 60)
  const uptimeStr = `${h}h ${min}m ${sec}s`

  const mem = process.memoryUsage()
  const memMB = (mem.rss / 1024 / 1024).toFixed(1)

  const messaggio = `╭━━━〔 📊 *STATISTICHE GLOBALI* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* Resoconto Generale
┃━━━━━━━━━━━━━━━━━━
┃ 📈 *DIAGNOSTICA CORE:*
┃  • _Uptime:_ ${uptimeStr}
┃  • _Memoria RAM:_ ${memMB} MB
┃  • _Moduli caricati:_ ${activePlugins}/${totalPlugins}
┃ 
┃ 👥 *RETE & UTENZA:*
┃  • _Utenti unici:_ ${totalUsers}
┃  • _Gruppi attivi:_ ${totalGroups}
┃ 
┃ ⚡ *TRAFFICO COMANDI:*
┃  • _Processati totali:_ ${totalCommands}
┃  • _Eseguiti con successo:_ ${totalSuccess} ✅
┃  • _Falliti / Errori:_ ${totalCommands - totalSuccess} ❌
┃ 
┃ 🏆 *TOP 5 MODULI UTILIZZATI:*
${topPlugins || '┃  _Nessun dato registrato_'}
┃ 
┃ 👑 *TOP 5 UTENTI ATTIVI:*
${topUsers || '┃  _Nessun dato registrato_'}
╰━━━━━━━━━━━━━━━━━━┈`.trim()

  await m.reply(messaggio)
}

handler.command = /^botstats$/i
handler.rowner = true

export default handler
