// Plugin by Elixir, Dado - Modificato per supporto @mention e scrittura permanente
import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, args }) => {
  // Solo il creatore principale può usare questo comando
  if (m.sender.split('@')[0] !== '393297014539') {
    return conn.sendMessage(m.chat, {
      text: `⛔ *Accesso negato!*\n\nSolo il creatore può usare questo comando.`
    }, { quoted: m })
  }

  let number = ''

  // Supporto per risposta a messaggio
  if (m.quoted) {
    number = m.quoted.sender.replace(/[^0-9]/g, '')
  }
  // Supporto per @mention
  else if (m.mentionedJid && m.mentionedJid.length > 0) {
    number = m.mentionedJid[0].replace(/[^0-9]/g, '')
  }
  // Supporto per numero come argomento
  else if (args[0]) {
    number = args[0].replace(/[^0-9]/g, '')
  }

  if (!number || number.length < 10) {
    return conn.sendMessage(m.chat, {
      text: `╭━━━〔 🗑️ *DEL OWNER* 〕━━━┈\n┃\n┃ 💡 *Uso:*\n┃ .delowner <numero>\n┃ .delowner @utente\n┃ oppure rispondi a un messaggio\n┃\n┃ 📝 *Esempi:*\n┃ .delowner 393297014539\n┃ .delowner @utente\n┃ .delowner (rispondendo a un msg)\n┃\n┃ 👑 *Owner attuali:*\n${global.owner.map((o, i) => `┃ ${i + 1}. ${o[0].split('@')[0]} (${o[1]})`).join('\n')}\n┃\n╰━━━━━━━━━━━━━━━━━━┈`
    }, { quoted: m })
  }

  // Non permettere di rimuovere se stesso (il creatore)
  if (number === '393297014539') {
    return conn.sendMessage(m.chat, {
      text: `⚠️ *Errore:* Non puoi rimuovere il creatore principale!`
    }, { quoted: m })
  }

  let ownerList = global.owner.map(o => o[0].replace('@s.whatsapp.net', ''))
  if (!ownerList.includes(number)) {
    return conn.sendMessage(m.chat, {
      text: `⚠️ *Errore:* ${number} non è un owner!`
    }, { quoted: m })
  }

  if (global.owner.length <= 1) {
    return conn.sendMessage(m.chat, {
      text: `⚠️ *Errore:* Devi avere almeno un owner!`
    }, { quoted: m })
  }

  // Rimuovi dal config.js in modo permanente
  let configPath = path.join(process.cwd(), 'config.js')
  let configContent = fs.readFileSync(configPath, 'utf8')

  let entryRegex = new RegExp(`\\['${number}','[^']*',true\\],?\\n?`)
  configContent = configContent.replace(entryRegex, '')

  fs.writeFileSync(configPath, configContent)

  // Aggiorna la lista owner in memoria
  global.owner = global.owner.filter(o => o[0].replace('@s.whatsapp.net', '') !== number)

  // Rimuovi anche dal database
  if (global.db.data.owners) {
    global.db.data.owners = global.db.data.owners.filter(v => v !== number + '@s.whatsapp.net')
  }

  await conn.sendMessage(m.chat, {
    text: `╭━━━〔 ✅ *OWNER RIMOSSO* 〕━━━┈\n┃\n┃ 📱 *Numero:* ${number}\n┃\n┃ 👑 *Owner rimanenti:* ${global.owner.length}\n┃ 💾 *Salvataggio:* Permanente\n┃\n╰━━━━━━━━━━━━━━━━━━┈`
  }, { quoted: m })
}

handler.command = /^delowner$/i
handler.help = ['delowner']
handler.tags = ['owner']
handler.rowner = true

export default handler