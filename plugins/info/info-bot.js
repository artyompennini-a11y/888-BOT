let handler = async (m, { conn }) => {

  const txt =
`⚡ *888 BOT — Sistema Ufficiale*
Benvenuto nel pannello principale.

✨ *Pannello Informazioni 888* ✨

👑 *Creatori:*  
• https://wa.me/393297014539  
• https://wa.me/79524931364  

🤖 *Nome Bot:* 888 BOT  
📦 *Versione:* 1.3  
🌐 *Sito:* https://888bot.netlify.app  
💻 *Repository:* https://github.com/artyompennini-a11y/888-BOT  

📡 *Stato:* Online  
👥 *Gruppi:* ${Object.keys(global.db.data.chats).length}  
🧩 *Plugins:* ${Object.keys(global.plugins).length}  

📜 *Comandi:* Usa .menu per vedere la lista completa`;

  await conn.sendMessage(m.chat, {
    text: txt,
    footer: "Seleziona un’opzione qui sotto.",
    templateButtons: [
      {
        urlButton: {
          displayText: "🌐 Sito Ufficiale",
          url: "https://888bot.netlify.app"
        }
      },
      {
        urlButton: {
          displayText: "💻 Repository GitHub",
          url: "https://github.com/artyompennini-a11y/888-BOT"
        }
      },
      {
        quickReplyButton: {
          displayText: "🟢 Menu Comandi",
          id: ".menu"
        }
      }
    ]
  }, { quoted: m });
}

handler.help = ['infobot']
handler.tags = ['info']
handler.customPrefix = /^\./
handler.command = /^(infobot|info888)$/i
handler.fail = null

export default handler