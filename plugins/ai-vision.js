// Plugin by Elixir & 888 staff
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const q = m.quoted || {}
  const mediaTypes = ['imageMessage', 'stickerMessage', 'videoMessage']
  const hasMedia = q?.mtype && mediaTypes.includes(q.mtype)
  const hasAttachment = m.mtype && mediaTypes.includes(m.mtype)

  if (!hasMedia && !hasAttachment) {
    return m.reply(`⚠️ *Uso corretto:* ${usedPrefix + command} *[domanda]* rispondendo a una foto\n\nEsempio: rispondi a una foto con ${usedPrefix + command} cosa c'è in questa immagine?`)
  }

  const mediaMsg = hasMedia ? q : m
  let buffer
  try {
    buffer = await conn.downloadMediaMessage(mediaMsg)
  } catch (e) {
    return m.reply('❌ Impossibile scaricare il media. Riprova.')
  }

  await m.reply('🔍 *Analizzo l\'immagine...*')

  const base64 = buffer.toString('base64')
  const mime = hasMedia && q?.mtype === 'stickerMessage' ? 'image/webp' : (mediaMsg?.mtype?.includes('video') ? 'video/mp4' : 'image/jpeg')

  const question = text || 'Descrivi dettagliatamente cosa vedi in questa immagine'
  const prompt = `Sei un assistente AI. L'utente chiede: "${question}". Rispondi in italiano in modo chiaro e dettagliato.`

  try {
    const apiUrl = 'https://text.pollinations.ai/'
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } }
            ]
          }
        ],
        model: 'openai',
        seed: Math.floor(Math.random() * 100000)
      })
    })

    if (!response.ok) throw new Error('Errore API visione')
    const result = await response.text()

    await conn.sendMessage(m.chat, {
      text: `🔍 *RISULTATO ANALISI*\n\n${result}\n\n━━━━━━━━━━━━━━━━\n🤖 Analisi generata da 𝟴𝟴𝟴 𝗕𝗢𝗧 AI`
    }, { quoted: m })
  } catch (e) {
    m.reply('❌ *Errore durante l\'analisi dell\'immagine.* Riprova più tardi.')
  }
}

handler.help = ['aivision', 'vedi', 'analizza']
handler.tags = ['ai']
handler.command = /^(aivision|vedi|analizza|cosae)$/i

export default handler
