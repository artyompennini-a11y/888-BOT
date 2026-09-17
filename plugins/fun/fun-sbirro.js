let handler = async (m, { conn, command, text }) => {

  let target = m.mentionedJid?.[0] 
    || m.quoted?.sender 
    || m.sender

  let number = target.split("@")[0]
  let width = Math.floor(Math.random() * 101)

  let finalPhrase =
    width >= 30
      ? "⚠️ *Attenzione!* Potrebbe esserci uno sbirro tra noi.\n> 888 BOT"
      : "Mh, direi che possiamo stare tranquilli.\n> 888 BOT"

  let message = 
`🔍 *Analisi in corso...*

👤 Utente analizzato:
@${number}

🚨 Percentuale sbirro:
*${width}%*

${finalPhrase}`

  m.reply(message, null, { mentions: conn.parseMention(message) })
}

handler.command = /^(sbirro)$/i
handler.help = ['sbirro']
handler.tags = ['fun']

export default handler