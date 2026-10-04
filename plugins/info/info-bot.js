let handler = async (m, { conn }) => {
  let gruppi = 0
  try {
    gruppi = Object.keys(await conn.groupFetchAllParticipating()).length
  } catch {
    gruppi = Object.keys(global.db?.data?.chats || {}).filter(j => j.endsWith('@g.us')).length
  }

  const plugins = Object.keys(global.plugins || {}).length

  const txt =
`⚡ *888 BOT — Sistema Ufficiale*
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

  await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
}

handler.help = ['infobot']
handler.tags = ['info']
handler.command = /^(infobot|info888)$/i

export default handler