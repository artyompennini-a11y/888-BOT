let handler = async (m, { text }) => {

  if (!text) {
    return m.reply(`🧠 *CALCOLATRICE 888*

Scrivi un'operazione da calcolare.

📌 *Esempi:*
• .calcola 2+2
• .calcola 10*5
• .calcola (20+5)/5`)
  }

  try {
    if (!/^[0-9+\-*/().\s]+$/.test(text)) {
      return m.reply("❌ Espressione non valida.")
    }

    let result = eval(text)

    if (result === Infinity || isNaN(result)) {
      return m.reply("❌ Operazione non valida.")
    }

    m.reply(
`🧮 *CALCOLO EFFETTUATO*

📥 *Input:*
${text}

📤 *Risultato:*
*${result}*`
    )

  } catch (e) {
    m.reply("❌ Errore nel calcolo.")
  }
}

handler.command = /^calcola$/i
handler.tags = ['utility']
handler.help = ['calcola <operazione>']

export default handler