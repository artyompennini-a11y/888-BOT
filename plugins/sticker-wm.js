import { addExif } from '../lib/sticker.js'

let handler = async (m, { conn, text }) => {
  
  if (!m.quoted) return m.reply(`『 ✧ 』 - \`Rispondi allo sticker che vuoi personalizzare\``)
  
  
  let mime = m.quoted.mimetype || ''
  if (!/webp/.test(mime)) return m.reply(`『 ✧ 』- \`Rispondi a uno sticker\``)

  let stiker = false
  try {
    
    if (!text) {
      let name = conn.getName(m.sender)
      text = `${name}|𝟴𝟴𝟴 𝗕𝗢𝗧`
    }
    
    
    let [packname, ...authorArr] = text.split('|')
    let author = authorArr.join('|') || '' // Gestisce i casi senza autore dopo il '|'
    
    
    let img = await m.quoted.download()
    if (!img) return m.reply(`${global.errore || 'Errore nel download dello sticker.'}`)
    
  
    stiker = await addExif(img, packname.trim(), author.trim())
    
  } catch (e) {
    console.error('Errore in sticker-wm:', e)
    if (Buffer.isBuffer(e)) stiker = e
  } finally {
    
    if (stiker) {
      await conn.sendFile(m.chat, stiker, 'wm.webp', '', m)
    } else {
      m.reply(`${global.errore || 'Impossibile modificare lo sticker.'}`)
    }
  }
}

handler.help = ['wm <nome|autore>']
handler.tags = ['sticker', 'strumenti']
handler.command = ['take', 'wm']
handler.register = false

export default handler
