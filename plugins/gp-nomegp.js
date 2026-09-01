const handler = async (m, { conn, args }) => {
  if (!args[0]) return conn.reply(
    m.chat,
`╭━━━〔 ⚠️ *ERRORE* 〕━━━┈
┃ Devi indicare il nuovo nome
┃ del gruppo.
┃ Esempio:
┃ ➜ .nomegp Elite Squad 888
╰━━━━━━━━━━━━━━━━━━┈`, 
    m
  )

  const nuovoNome = args.join(' ')
  if (nuovoNome.length > 100)
    return conn.reply(
      m.chat,
`╭━━━〔 ❌ *NOME TROPPO LUNGO* 〕━━━┈
┃ Il nome del gruppo non può
┃ superare i *100 caratteri*.
╰━━━━━━━━━━━━━━━━━━┈`,
      m
    )

  await conn.groupUpdateSubject(m.chat, nuovoNome)

  await conn.reply(
    m.chat,
`╭━━━〔 ✅ *NOME GRUPPO AGGIORNATO* 〕━━━┈
┃ Il nuovo nome è stato impostato:
┃ ➜ *${nuovoNome}*
╰━━━━━━━━━━━━━━━━━━┈`,
    m
  )
}

handler.help = ['𝐧𝐨𝐦𝐞𝐠𝐩 <𝐧𝐨𝐦𝐞>']
handler.tags = ['admin']
handler.command = /^(nomegp|setnomegp)$/i
handler.group = true
handler.admin = true

export default handler