//Plugin by Punisher, elixir & 888 staff

import fs from 'fs'
import path from 'path'

let handler = async (m, { text, __dirname }) => {
  if (!text) throw 'Inserisci il path del file da editare'
  if (!m.quoted?.text) throw 'Rispondi al messaggio che contiene il nuovo contenuto del file'

  let filePath = path.resolve(__dirname, text)
  const normalized = path.normalize(filePath).replace(/\\/g, '/')
  if (normalized.includes('/plugins/crediti.js') || normalized.includes('.protected_plugins'))
    throw 'Questo file è protetto e non può essere modificato.'

  if (!fs.existsSync(filePath)) throw 'Il file non esiste'

  fs.writeFileSync(filePath, m.quoted.text)

  let responseMessage = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: 'EditFile'
    },
    message: {
      locationMessage: {
        name: 'File Editato',
        jpegThumbnail: await (await fetch('https://telegra.ph/file/876cc3f192ec040e33aba.png')).buffer(),
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;File;;;\nFN:File\nEND:VCARD'
      }
    },
    participant: '0@s.whatsapp.net'
  }

  conn.reply(m.chat, `Il file "${text}" è stato editato con successo`, responseMessage)
}

handler.tags = ['owner']
handler.help = ['editfile']
handler.command = /^editfile$/i
handler.rowner = true

export default handler
