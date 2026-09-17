// Plugin by Elixir, Dado
import fs from 'fs'

let handler = async (m, { conn, args, usedPrefix }) => {
  if (!args[0]) {
    return conn.sendMessage(m.chat, {
      text:
`🔧 *CHANGE PREFIX*

📌 Prefisso attuale: ${usedPrefix}

💡 Uso corretto:
${usedPrefix}newprefix <nuovo_prefisso>

📝 Esempi:
${usedPrefix}newprefix ?
${usedPrefix}newprefix !
${usedPrefix}newprefix #

⚠️ Nota: Usa solo un carattere`
    }, { quoted: m })
  }

  let newPrefix = args[0]

  if (newPrefix.length > 1) {
    return conn.sendMessage(m.chat, {
      text:
`❌ *Errore:* Il prefisso deve essere un singolo carattere!

📌 Esempio:
${usedPrefix}newprefix ?`
    }, { quoted: m })
  }

  if (/^[a-zA-Z0-9]$/.test(newPrefix)) {
    return conn.sendMessage(m.chat, {
      text:
`❌ *Errore:* Il prefisso non può essere una lettera o un numero!

📌 Caratteri consigliati:
? ! # $ % & * - + = ~ ^`
    }, { quoted: m })
  }

  if (newPrefix === usedPrefix) {
    return conn.sendMessage(m.chat, {
      text:
`⚠️ *Errore:* Il prefisso "${newPrefix}" è già in uso!

📌 Prefisso attuale: ${usedPrefix}`
    }, { quoted: m })
  }

  const escapedPrefix = newPrefix.replace(/[|\\{}()\[\]^$+*.\-^]/g, '\\$&')
  const oldPrefix = usedPrefix

  global.prefix = new RegExp('^[' + escapedPrefix + ']')

  if (!global.db.data.settings) global.db.data.settings = {}
  global.db.data.settings.prefix = newPrefix

  try {
    if (typeof global.db.write === 'function') {
      await global.db.write()
    } else if (global.db.data) {
      const dbPath = global.db.filename || 'database.json'
      fs.writeFileSync(dbPath, JSON.stringify(global.db.data, null, 2))
    }
  } catch (e) {
    console.error('❌ Errore salvataggio prefisso nel database:', e)
  }

  await conn.sendMessage(m.chat, {
    text:
`✅ *PREFIX CAMBIATO*

🔧 Nuovo prefisso: ${newPrefix}
📌 Prefisso precedente: ${oldPrefix}

💡 Ora puoi usare:
${newPrefix}ping, ${newPrefix}menu, ${newPrefix}play, ecc.

🔄 Per tornare indietro:
${newPrefix}newprefix ${oldPrefix}`
  }, { quoted: m })
}

handler.customPrefix = /^(.)/
handler.command = /^newprefix$/i
handler.help = ['newprefix']
handler.tags = ['utility']

export default handler