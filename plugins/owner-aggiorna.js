import { execSync } from 'child_process'

let handler = async (m, { conn, text }) => {
  if (conn.user.jid !== conn.user.jid) return 

  try {
    await m.react('⏳')

    execSync('git fetch')
    let status = execSync('git status -uno', { encoding: 'utf-8' })

    if (status.includes('Your branch is up to date') || status.includes('nothing to commit')) {
      await conn.reply(m.chat, '✅ *Il bot è già aggiornato.*', m)
      await m.react('✅')
      return
    }

    
    let updateOutput = execSync('git reset --hard && git pull --stat' + (m.fromMe && text ? ' ' + text : ''), { encoding: 'utf-8' })

    
    let fileDetails = parseGitFileDetails(updateOutput)

    let reportFiles = fileDetails.map((f, i) => {
      return `*FILE NUMERO ${i + 1}* (${f.name})\n➕ Aggiunte: ${f.ins} | ➖ Rimosse: ${f.del}`
    }).join('\n\n')

    let message = `
🚀 *PLUGIN AGGIORNATO*: Update System

━━━━━━━━━━━━━━━━━━━━
${reportFiles}
━━━━━━━━━━━━━━━━━━━━

✅ *𝟴𝟴𝟴 𝗕𝗢𝗧 𝚊𝚐𝚐𝚒𝚘𝚛𝚗𝚊𝚝𝚘 𝚌𝚘𝚗 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚘!*`.trim()

    await conn.reply(m.chat, message, m)
    await m.react('🍥')

  } catch (err) {
    await conn.reply(m.chat, `❌ *ERRORE*\n\n> ${err.message}`, m)
    await m.react('❌')
  }
}


function parseGitFileDetails(output) {
  const lines = output.split('\n')
  const files = []

  const fileLineRegex = /^\s+(.+)\s+\|\s+(\d+)\s+(.+)$/

  for (let line of lines) {
    let match = line.match(fileLineRegex)
    if (match) {
      let name = match[1].trim()
      let totalChanges = match[2]
      let plusMinus = match[3]

      let ins = (plusMinus.match(/\+/g) || []).length
      let del = (plusMinus.match(/-/g) || []).length

      files.push({ name, ins, del })
    }
  }
  return files
}

handler.help = ['aggiorna']
handler.tags = ['creatore']
handler.command = ['aggiorna', 'update', 'aggiornabot']

export default handler
