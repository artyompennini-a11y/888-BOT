const handler = async (m, { conn, args }) => {
  if (!args[0]) {
    return conn.reply(
      m.chat,
      `⚠️ Devi indicare il nuovo nome del gruppo.\nEsempio:\n.nomegp Elite Squad 888`,
      m
    )
  }

  const nuovoNome = args.join(' ')
  if (nuovoNome.length > 100) {
    return conn.reply(
      m.chat,
      `❌ Il nome del gruppo non può superare i 100 caratteri.`,
      m
    )
  }

  await conn.groupUpdateSubject(m.chat, nuovoNome)

  await conn.reply(
    m.chat,
    `✅ *Nome gruppo aggiornato*\nIl nuovo nome è:\n➡️ *${nuovoNome}*`,
    m
  )
}

handler.help = ['nomegp <nome>']
handler.tags = ['admin']
handler.command = /^(nomegp|setnomegp)$/i
handler.group = true
handler.admin = true

export default handler