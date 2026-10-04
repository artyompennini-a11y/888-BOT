let handler = async (m, { conn }) => {

  const txt =
`⚡ *InfoPanel — Sistema Ufficiale*
Benvenuto nel pannello principale.

🤖 *InfoPanel* 🤖

➤ *Creatore:*  
https://wa.me/00000000000

➤ *Nome Bot:* 

➤ *Versione:* 1.3

➤ *Sito Ufficiale:* https://example.site

➤ *Instagram:* https://instagram.com/example

➤ *Stato:* *Online*

➤ *Creato il:* 04/10/2026

➤ *Gruppi:* ${Object.keys(global.db.data.chats).length}
➤ *Plugins:* ${Object.keys(global.plugins).length}

➤ *Comandi:*  
Usa .menu per vedere i comandi

Premi un pulsante qui sotto.`

  await conn.sendMessage(m.chat, {
    text: txt,
    buttons: [
      {
        buttonId: '.menu',
        buttonText: { displayText: '🟢 Menu Comandi' },
        type: 1
      },
      {
        buttonId: '.sito',
        buttonText: { displayText: '🌐 Sito Ufficiale' },
        type: 1
      }
    ]
  })
}

handler.command = /^(infopanel|info)$/i
export default handler