const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`❌ Formato: ${usedPrefix + command} <domanda> | <opz1> | <opz2> | <opz3>\n\nEsempio: ${usedPrefix + command} Cosa mangi? | Pizza | Pasta | Sushi`)
  }

  const parts = text.split('|').map(p => p.trim()).filter(p => p)
  if (parts.length < 3) {
    return m.reply('❌ Servono almeno una domanda e 2 opzioni.\nFormato: domanda | opz1 | opz2 | opz3...')
  }

  const question = parts[0]
  const options = parts.slice(1, 7)

  if (options.length < 2) {
    return m.reply('❌ Servono almeno 2 opzioni.')
  }

  try {
    const pollMessage = {
      pollCreationMessage: {
        name: question,
        options: options.map(opt => ({ optionName: opt })),
        selectableOptionsCount: 1,
      }
    }

    await conn.sendMessage(m.chat, pollMessage, { quoted: m })
  } catch (e) {
    m.reply(`❌ Errore nella creazione del sondaggio: ${e.message}`)
  }
}

handler.command = ['poll', 'sondaggio', 'vote']
handler.help = ['poll <domanda> | <opz1> | <opz2>']
handler.tags = ['group', 'utility']

export default handler
