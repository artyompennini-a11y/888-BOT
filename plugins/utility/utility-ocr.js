const handler = async (m, { conn, text, usedPrefix, command }) => {
  const quoted = m.quoted || m
  
  if (!['imageMessage', 'videoMessage'].includes(quoted.mtype)) {
    return m.reply(`❌ Rispondi a un'immagine con ${usedPrefix + command} per estrarre il testo.`)
  }

  try {
    const media = await quoted.download()
    
    if (!media || media.length === 0) {
      return m.reply('❌ Impossibile scaricare l\'immagine.')
    }

    const FormData = (await import('formdata-node')).FormData
    const form = new FormData()
    form.append('file', Buffer.from(media), 'image.jpg')
    form.append('language', 'ita+eng')
    form.append('isOverlayRequired', 'false')
    form.append('detectOrientation', 'true')

    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        ...form.headers
      },
      body: form
    })

    const data = await res.json()
    
    if (data.IsErroredOnProcessing || !data.ParsedResults || data.ParsedResults.length === 0) {
      return m.reply('❌ Impossibile estrarre testo da questa immagine.')
    }

    const extractedText = data.ParsedResults[0].ParsedText.trim()
    
    if (!extractedText) {
      return m.reply('❌ Nessun testo rilevato nell\'immagine.')
    }

    if (extractedText.length > 4000) {
      await conn.sendMessage(m.chat, {
        text: extractedText.substring(0, 4000) + '\n\n... (testo troncato)'
      }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, { text: extractedText }, { quoted: m })
    }

  } catch (e) {
    m.reply(`❌ Errore OCR: ${e.message}`)
  }
}

handler.command = ['ocr', 'read', 'leggi', 'testoimg']
handler.help = ['ocr [rispondi a img]']
handler.tags = ['utility', 'ai']

export default handler
