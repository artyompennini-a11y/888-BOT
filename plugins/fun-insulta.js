let handler = async (m, {
conn, text
}) => {
if (!m.isGroup)
throw ''
let gruppi = global.db.data.chats[m.chat]
if (gruppi.spacobot === false)
throw ''
let menzione = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text
if (!menzione) throw 'Chi vuoi menzionare?'
if (menzione === conn.user.jid) {
    const botResponses = [
  `Ricevuto! Hai menzionato il sistema.`,
  `Sono qui per aiutarti, come posso servirti?`,
  `Hai attirato la mia attenzione.`,
  `Sistema operativo pronto all'azione.`,
  `Messaggio ricevuto correttamente.`
];

    conn.reply(m.chat, pickRandom(botResponses), m);
    return;
  }
const randomPhrases = [
  'è un utente molto attivo in questo gruppo!',
  'ha appena ricevuto una menzione speciale.',
  'sta partecipando alla conversazione.',
  'è stato selezionato casualmente dal sistema.',
  'riceve un saluto virtuale.'
];

conn.reply(m.chat, `@${menzione.split`@`[0]} ${pickRandom(randomPhrases)}`, null, {
mentions: [menzione]
})
}

handler.command = ['menziona']
handler.help = [' @'];
handler.tags = ['fun'];
export default handler
function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)]
}
