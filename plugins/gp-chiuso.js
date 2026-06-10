let handler = async (m, { conn }) => {
 
  await conn.sendMessage(m.chat, { react: { text: '🔒', key: m.key } })

  
  await conn.groupSettingUpdate(m.chat, 'announcement')

  const message = "« 🔒 »  *SILENZIO DI STATO*\n\n> *Le porte si chiudono. Solo le divinità regnano in questo spazio.*"

  
  const buttons = [
    {
      buttonId: '.aperto',
      buttonText: { displayText: '🔓 Apri Gruppo' },
      type: 1
    }
  ]

  const buttonMessage = {
    text: message,
    footer: '⚙️ Pannello Rapido Amministrazione',
    buttons: buttons,
    headerType: 1,
    contextInfo: {
      externalAdReply: {
        title: '〔 ACCESS DENIED 〕',
        body: 'Gestionale Sistema 𝟴𝟴𝟴 𝗕𝗢𝗧',
        thumbnailUrl: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=500', 
        sourceUrl: '',
        mediaType: 1,
        renderLargerThumbnail: false
      },
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: `120363427251015414@newsletter',
        newsletterName: `✦ ${global.db?.data?.nomedelbot || '𝟴𝟴𝟴 𝗕𝗢𝗧'} ✦`,
        serverMessageId: 143
      }
    }
  }

  await conn.sendMessage(m.chat, buttonMessage, { quoted: m })
}

handler.help = ['chiudi']
handler.tags = ['group']
handler.command = ['chiudi']
handler.admin = true
handler.botAdmin = true

export default handler
