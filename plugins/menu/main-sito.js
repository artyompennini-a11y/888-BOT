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


𓂀 𝟴𝟴𝟴 𝗦𝗧𝗔𝗙𝗙`,

          buttons: [
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '🌐 Sito Ufficiale',
                url: 'https://888bot.netlify.app'
              })
            },
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '💻 GitHub',
                url: 'https://github.com/artyompennini-a11y/888-BOT'
              })
            },
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '💬 WhatsApp',
                url: 'https://wa.me/573117824583'
              })
            },
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '📸 Instagram — Elixir',
                url: 'https://instagram.com/elixir._regna'
              })
            },
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '📸 Instagram — Punisher',
                url: 'https://www.instagram.com/arty.340'
              })
            },
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '📧 Email',
                url: 'mailto:elixir888project@outlook.it'
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