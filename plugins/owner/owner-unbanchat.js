let handler = async (m, { conn }) => {
  const chat = global.db.data.chats[m.chat] || {}

  if (!chat.isBanned) {
    return conn.sendMessage(
      m.chat,
      {
        text:
          `⚠️ *Chat Attiva*\n` +
          `Il bot è già operativo in questo gruppo.`
      },
      { quoted: m }
    )
  }

  chat.isBanned = false
  global.db.data.chats[m.chat] = chat

  await conn.sendMessage(
    m.chat,
    {
      text:
        `✅ *UNBANCHAT*\n` +
        `🔓 Il bot è stato riattivato nel gruppo.\n\n` +
        `🤖 I comandi ora funzionano normalmente.\n` +
        `👑 Azione eseguita da: @${m.sender.split('@')[0]}`,
      mentions: [m.sender]
    },
    { quoted: m }
  )
}

handler.command = ['unbanchat']
handler.owner = true
handler.group = true

export default handler