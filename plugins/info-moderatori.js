//Plugin by 888
let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('❌ Questo comando funziona solo nei gruppi.')

  const chatId = m.chat
  if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {}
  if (!global.db.data.chats[chatId].moderatori) global.db.data.chats[chatId].moderatori = []

  const mods = global.db.data.chats[chatId].moderatori
  if (mods.length === 0) return m.reply('📋 Nessun moderatore registrato in questo gruppo.')

  // ============================
  //     GRAFICA MIGLIORATA
  // ============================

  let text = `🛡️ *Pannello Moderatori del Gruppo*\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`
  text += `👥 *Moderatori Attivi:*\n\n`

  const mentions = []
  mods.forEach((jid, index) => {
    text += `*${index + 1}.* @${jid.split('@')[0]}\n`
    mentions.push(jid)
  })

  text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`
  text += `⚙️ *Strumenti Moderazione*\n\n`
  text += `• 🔒 *Pin / Unpin:* .pin / .unpin\n`
  text += `• 👋 *Welcome:* .setwelcome\n`
  text += `• 🔗 *Link gruppo:* .link\n`
  text += `• 🗑️ *Elimina messaggi:* .del\n`
  text += `• ⚖️ *Giuria:* .giuria @user motivo\n`
  text += `• 🚫 *Bannati:* .banlist\n`
  text += `• 👻 *Tag nascosto:* .hidetag\n`
  text += `• 📢 *Sveglia admin:* .admins\n`
  text += `• 🏷️ *Tag all:* .tagall\n`
  text += `• 🔇 *Mute / Unmute:* .muta / .smuta\n`
  text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`
  text += `🛠️ *Gestione avanzata disponibile solo ai moderatori.*`

  await conn.sendMessage(chatId, { text, mentions }, { quoted: m })
}

handler.help = ['mods', 'moderatori']
handler.tags = ['group']
handler.command = ['mods', 'moderatori']
handler.group = true

export default handler

