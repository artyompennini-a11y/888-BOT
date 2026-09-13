// Plugin by Elixir, Dado - Modificato per supporto @mention e scrittura permanente
import fs from 'fs'
import path from 'path'

function normalizeOwnerList(list) {
  return list
    .filter(entry => /^\+?\d{6,15}$/.test(entry[0]))
    .map(entry => [
      entry[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net',
      entry[1],
      entry[2]
    ])
}

let handler = async (m, { conn, args }) => {
  // Solo il creatore principale può usare questo comando
  if (m.sender.split('@')[0] !== '393297014539') {
    return conn.sendMessage(m.chat, {
      text: `⛔ *Accesso negato!*\n\nSolo il creatore può usare questo comando.`
    }, { quoted: m })
  }

  let number = ''
  let name = 'Owner'

  // Supporto per risposta a messaggio
  if (m.quoted) {
    number = m.quoted.sender.replace(/[^0-9]/g, '')
    name = await conn.getName(m.quoted.sender) || m.quoted.sender.split('@')[0]
  }
  // Supporto per @mention
  else if (m.mentionedJid && m.mentionedJid.length > 0) {
    number = m.mentionedJid[0].replace(/[^0-9]/g, '')
    let jid = number + '@s.whatsapp.net'
    name = await conn.getName(jid) || 'Owner'
  }
  // Supporto per numero come argomento
  else if (args[0]) {
    number = args[0].replace(/[^0-9]/g, '')
    let jid = number + '@s.whatsapp.net'
    name = await conn.getName(jid) || 'Owner'
  }

  if (!number || number.length < 10) {
    return conn.sendMessage(m.chat, {
      text: `╭━━━〔 👑 *ADD OWNER* 〕━━━┈\n┃\n┃ 💡 *Uso:*\n┃ .addowner <numero>\n┃ .addowner @utente\n┃ oppure rispondi a un messaggio\n┃\n┃ 📝 *Esempi:*\n┃ .addowner 393297014539\n┃ .addowner @utente\n┃ .addowner (rispondendo a un msg)\n┃\n╰━━━━━━━━━━━━━━━━━━┈`
    }, { quoted: m })
  }

  // Non permettere di aggiungere se stesso (il creatore)
  if (number === '393297014539') {
    return conn.sendMessage(m.chat, {
      text: `⚠️ *Errore:* Il creatore principale è già owner!`
    }, { quoted: m })
  }

  let ownerList = global.owner.map(o => o[0].replace('@s.whatsapp.net', ''))
  if (ownerList.includes(number)) {
    return conn.sendMessage(m.chat, {
      text: `⚠️ *Errore:* ${number} è già owner!`
    }, { quoted: m })
  }

  // Scrivi nel config.js in modo permanente
  let configPath = path.join(process.cwd(), 'config.js')
  let configContent = fs.readFileSync(configPath, 'utf8')

  let newEntry = `  ['${number}', '${name}', true],`
  let lastEntryRegex = /\['\d+',\s*'.+',\s*true\],(?!\s*\[')/

  if (lastEntryRegex.test(configContent)) {
    configContent = configContent.replace(lastEntryRegex, match => match + '\n' + newEntry)
  } else {
    configContent = configContent.replace(
      /global\.owner = normalizeOwnerList\(\[/,
      'global.owner = normalizeOwnerList([\n' + newEntry
    )
  }

  fs.writeFileSync(configPath, configContent)

  // Aggiorna la lista owner in memoria
  global.owner = normalizeOwnerList([
    ...global.owner.map(o => [o[0].replace('@s.whatsapp.net', ''), o[1], o[2]]),
    [number, name, true]
  ])

  // Aggiorna anche nel database
  if (!global.db.data.owners) global.db.data.owners = []
  if (!global.db.data.owners.includes(number + '@s.whatsapp.net')) {
    global.db.data.owners.push(number + '@s.whatsapp.net')
  }

  await conn.sendMessage(m.chat, {
    text: `╭━━━〔 ✅ *OWNER AGGIUNTO* 〕━━━┈\n┃\n┃ 👑 *Nome:* ${name}\n┃ 📱 *Numero:* ${number}\n┃ 💾 *Salvataggio:* Permanente\n┃\n╰━━━━━━━━━━━━━━━━━━┈`
  }, { quoted: m })
}

handler.command = /^addowner$/i
handler.help = ['addowner']
handler.tags = ['owner']
handler.rowner = true

export default handler