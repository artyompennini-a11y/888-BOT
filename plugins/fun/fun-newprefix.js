// Plugin by Elixir, Dado
import fs from 'fs'

let handler = async (m, { conn, args, usedPrefix }) => {
  if (!args[0]) {
    return conn.sendMessage(m.chat, {
      text: `╭━━━〔 🔧 *CHANGE PREFIX* 〕━━━┈\n┃\n┃ 📌 *Prefisso attuale:* ${usedPrefix}\n┃\n┃ 💡 *Uso corretto:*\n┃ ${usedPrefix}newprefix <nuovo_prefisso>\n┃\n┃ 📝 *Esempi:*\n┃ ${usedPrefix}newprefix ?\n┃ ${usedPrefix}newprefix !\n┃ ${usedPrefix}newprefix #\n┃\n┃ ⚠️ *Nota:* Usa solo un carattere\n┃\n╰━━━━━━━━━━━━━━━━━━┈`
    }, { quoted: m })
  }

  let newPrefix = args[0]

  if (newPrefix.length > 1) {
    return conn.sendMessage(m.chat, {
      text: `❌ *Errore:* Il prefisso deve essere un singolo carattere!\n\n📌 *Esempio:* ${usedPrefix}newprefix ?`
    }, { quoted: m })
  }

  if (/^[a-zA-Z0-9]$/.test(newPrefix)) {
    return conn.sendMessage(m.chat, {
      text: `❌ *Errore:* Il prefisso non può essere una lettera o un numero!\n\n📌 *Caratteri consigliati:* ? ! # $ % & * - + = ~ ^`
    }, { quoted: m })
  }

  if (newPrefix === usedPrefix) {
    return conn.sendMessage(m.chat, {
      text: `⚠️ *Errore:* Il prefisso "${newPrefix}" è già in uso!\n\n📌 *Prefisso attuale:* ${usedPrefix}`
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
    text: `╭━━━〔 ✅ *PREFIX CAMBIATO* 〕━━━┈\n┃\n┃ 🔧 *Nuovo prefisso:* ${newPrefix}\n┃ 📌 *Prefisso precedente:* ${oldPrefix}\n┃\n┃ 💡 *Ora puoi usare:*\n┃ ${newPrefix}ping, ${newPrefix}menu, ${newPrefix}play, ecc.\n┃\n┃ 🔄 *Per tornare indietro:*\n┃ ${newPrefix}newprefix ${oldPrefix}\n┃\n╰━━━━━━━━━━━━━━━━━━┈`
  }, { quoted: m })
}

handler.customPrefix = /^(.)/

handler.command = /^newprefix$/i

handler.help = ['newprefix']
handler.tags = ['utility']

export default handler