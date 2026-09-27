let handler = async (m, { conn }) => {
  const videoPath = './media/VID-20260914-WA0015.mp4'

  await conn.sendMessage(
    m.chat,
    {
      video: { url: videoPath },
      caption: 'MY NEGA 🥺'
    },
    { quoted: m }
  )
}

handler.help = ['nigga']
handler.tags = ['tools']
handler.command = /^(nigga)$/i

export default handler