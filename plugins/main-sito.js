const handler = async (m, { conn }) => {
  const jid = m.chat

  await conn.sendMessage(
    jid,
    {
      text: `〖 ⚡ 〗 \`Benvenuto in 888-BOT!\``,
      title: '',
      footer: ``,
      cards: [
        {
          image: { url: 'media/888bot.jpeg.jfil' }, // Cambia con il tuo file
          title: `\`by Elixir/Punisher aka 888\``,
          body: `〖 🤖 〗 *Sistema modulare avanzato*\n〖 🚀 〗 *Prestazioni e stabilità al top*`,
          footer: '˗ˏˋ  𝟴𝟴𝟴 𝗕𝗢𝗧  ˎˊ˗',
          buttons: [
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '🌐 Sito Ufficiale 888BOT',
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
                display_text: '📸 Instagram',
                url: 'https://www.instagram.com/arty.340'
              })
            },
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '📧 Email',
                url: 'elixir888project@outlook.it'
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
