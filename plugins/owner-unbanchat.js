let handler = async (m, { conn }) => {
  const chat = global.db.data.chats[m.chat] || {}

  if (!chat.isBanned) {
    return conn.sendMessage(m.chat, {
      text: `╭━━━〔 ⚠️ *CHAT ATTIVA* 〕━━━┈
┃ Il bot è già operativo
┃ in questo gruppo.
╰━━━━━━━━━━━━━━━━━━┈`
    }, { quoted: m })
  }

  chat.isBanned = false
  global.db.data.chats[m.chat] = chat

  await conn.sendMessage(m.chat, {
    text: `╭━━━〔 ✅ *UNBANCHAT* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* 🔓 Riattivato nel gruppo
┃━━━━━━━━━━━━━━━━━━
┃ 🤖 *Comandi ripristinati*
┃ Il bot ora risponde
┃ normalmente ai comandi.
┃
┃ 👑 *Azione eseguita da:*
┃ @${m.sender.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━┈`,
    mentions: [m.sender]
  }, { quoted: m })
}

handler.command = ['unbanchat']
handler.owner = true
handler.group = true

export default handler