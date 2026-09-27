let handler = async (m, { conn }) => {
  let metadata = await conn.groupMetadata(m.chat)
  let members = metadata.participants.map(p => p.id)
  let randomUser = members[Math.floor(Math.random() * members.length)]

  let msg = `Oggi eiaculo su quella troietta di @${randomUser.split('@')[0]}`

  await conn.sendMessage(
    m.chat,
    {
      text: msg,
      mentions: [randomUser],
      buttons: [
        {
          buttonId: 'sborra_again',
          buttonText: { displayText: 'sborra di nuovo🤤' },
          type: 1
        }
      ]
    },
    { quoted: m }
  )
}

handler.before = async (m, { conn }) => {
  if (m?.message?.buttonsResponseMessage?.selectedButtonId === 'sborra_again') {
    let metadata = await conn.groupMetadata(m.chat)
    let members = metadata.participants.map(p => p.id)
    let randomUser = members[Math.floor(Math.random() * members.length)]

    let msg = `Oggi eiaculo su quella troietta di  @${randomUser.split('@')[0]}`

    await conn.sendMessage(
      m.chat,
      {
        text: msg,
        mentions: [randomUser],
        buttons: [
          {
            buttonId: 'sborra_again',
            buttonText: { displayText: 'sborra di nuovo🤤' },
            type: 1
          }
        ]
      }
    )
  }
}

handler.customPrefix = /sborra/i
handler.command = new RegExp

export default handler