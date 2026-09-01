let handler = async (m, { conn }) => {
  const chat = global.db.data.chats[m.chat] || {}

  if (chat.isBanned) {
    return conn.sendMessage(m.chat, {
      text: `╭━━━〔 🚫 *BANCHAT* 〕━━━┈
┃ *Stato:* ❗ Già disattivato
┃━━━━━━━━━━━━━━━━━━
┃ Il bot è già bloccato
┃ in questo gruppo.
╰━━━━━━━━━━━━━━━━━━┈`
    }, { quoted: m })
  }

  chat.isBanned = true
  global.db.data.chats[m.chat] = chat

  await conn.sendMessage(m.chat, {
    text: `╭━━━〔 🚫 *BANCHAT* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* 🔒 Disattivato nel gruppo
┃━━━━━━━━━━━━━━━━━━
┃ 📵 *Comandi bloccati*
┃ Il bot non eseguirà più
┃ alcun comando finché
┃ non verrà riattivato.
┃
┃ 👑 *Azione eseguita da:*
┃ @${m.sender.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━┈`,
    mentions: [m.sender]
  }, { quoted: m })
}

handler.command = ['banchat']
handler.owner = true
handler.group = true

export default handler