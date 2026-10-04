let handler = async (m, { conn }) => {

  const txt =
`⚡ *888 BOT — Sistema Ufficiale*
Benvenuto nel pannello principale.

🤖 *Info 888* 🤖

➤ *Creatori:*  
https://wa.me/393297014539
https://wa.me/79524931364

➤ *Nome Bot:* *888 BOT*

➤ *Versione:* 1.3

➤ *Sito Ufficiale:* https://888bot.netlify.app

➤ *Repo Ufficiale:* https://github.com/artyompennini-a11y/888-BOT

➤ *Stato:* *Online*

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

handler.command = /^(infobot)$/i
export default handler