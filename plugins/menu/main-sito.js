const handler = async (m, { conn }) => {
  const jid = m.chat

  await conn.sendMessage(
    jid,
    {
      text: `⚡ *888‑BOT — Sistema Ufficiale*\nBenvenuto nel pannello principale.`,
      cards: [
        {
          image: { url: './media/888.jpeg.jpeg' },

          title: `✨ 888‑BOT — Premium Edition`,
          body: `🤖 *Sistema modulare avanzato*
🚀 *Prestazioni e stabilità al top*
💎 *Grafica 888 Premium*

𓂀 𝟴𝟴𝟴 𝗦𝗧𝗔𝗙𝗙`,

          buttons: [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "Pannello 888",
                sections: [
                  {
                    title: "🔗 Collegamenti Ufficiali",
                    highlight_label: "888",
                    rows: [
                      { id: "https://888bot.netlify.app", title: "🌐 Sito Ufficiale", description: "Pagina ufficiale 888-BOT" },
                      { id: "https://github.com/artyompennini-a11y/888-BOT", title: "💻 GitHub", description: "Repository del bot" },
                      { id: "https://wa.me/573117824583", title: "💬 WhatsApp", description: "Contatto diretto" },
                      { id: "https://instagram.com/elixir._regna", title: "📸 Instagram — Elixir", description: "Profilo Elixir" },
                      { id: "https://www.instagram.com/arty.340", title: "📸 Instagram — Punisher", description: "Profilo Punisher" },
                      { id: "mailto:elixir888project@outlook.it", title: "📧 Email", description: "Supporto via email" }
                    ]
                  }
                ]
              })
            }
          ]
        }
      ]
    },
    { quoted: m }
  )
}

handler.command = ['888', 'sito888']
handler.tags = ['main']
handler.help = ['888', 'sito888']
export default handler