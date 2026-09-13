let handler = async (m, { conn }) => {
  const chat = global.db.data.chats[m.chat] || {}

  if (chat.isBanned) {
    return conn.sendMessage(
      m.chat,
      {
        text:
          `🚫 *BANCHAT*\n` +
          `❗ Il bot è già disattivato in questo gruppo.`
      },
      { quoted: m }
    )
  }

  chat.isBanned = true
  global.db.data.chats[m.chat] = chat

  await conn.sendMessage(
    m.chat,
    {
      text:
        `🚫 *BANCHAT*\n` +
        `🔒 Il bot è stato disattivato nel gruppo.\n\n` +
        `📵 I comandi non saranno più eseguiti.\n` +
        `👑 Azione eseguita da: @${m.sender.split('@')[0]}`,
      mentions: [m.sender]
    },
    { quoted: m }
  )
}

handler.command = ['banchat']
handler.owner = true
handler.group = true

export default handler