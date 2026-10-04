const costruisci = async (conn) => {
  let gruppi = 0
  try {
    gruppi = Object.keys(await conn.groupFetchAllParticipating()).length
  } catch {
    gruppi = Object.keys(global.db?.data?.chats || {}).filter(j => j.endsWith('@g.us')).length
  }
  const plugins = Object.values(global.plugins || {}).filter(p => p && p.command && !p.disabled).length

  return `⚡ *888 BOT — Sistema Ufficiale*
Benvenuto nel pannello principale.

✨ *Pannello Informazioni 888* ✨

👑 *Creatori:*
• https://wa.me/393297014539
• https://wa.me/79524931364

🤖 *Nome Bot:* 888 BOT
📦 *Versione:* 1.3
🌐 *Sito:* https://888bot.netlify.app
💻 *Repository:* https://github.com/artyompennini-a11y/888-BOT

📡 *Stato:* Online
👥 *Gruppi:* ${gruppi}
🧩 *Plugins:* ${plugins}

📜 *Comandi:* Usa .menu per vedere la lista completa`
}

const numero = (jid) => String(jid || '').split('@')[0].split(':')[0]

const registra = (conn) => {
  if (!conn?.ev || conn.__benvenutoGruppo) return
  conn.__benvenutoGruppo = true

  conn.ev.on('group-participants.update', async (ev) => {
    try {
      if (ev.action !== 'add') return
      const mio = numero(conn.user?.id)
      const mioLid = numero(conn.user?.lid)
      const entrato = (ev.participants || []).some(p => {
        const n = numero(typeof p === 'string' ? p : p?.id)
        return n === mio || (mioLid && n === mioLid)
      })
      if (!entrato) return
      await new Promise(r => setTimeout(r, 2000))
      await conn.sendMessage(ev.id, { text: await costruisci(conn) })
    } catch (e) {
      console.error('Errore messaggio nuovo gruppo:', e)
    }
  })
}

registra(global.conn)

let handler = async (m, { conn }) => {
  await conn.sendMessage(m.chat, { text: await costruisci(conn) }, { quoted: m })
}

handler.before = async function (m, { conn }) {
  registra(conn)
  return false
}

handler.help = ['infobot']
handler.tags = ['info']
handler.command = /^(infobot|info888)$/i

export default handler