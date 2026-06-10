import { execSync } from 'child_process'

let handler = async (m, { conn, text, isOwner }) => {
 
  if (!isOwner) return conn.reply(m.chat, '『 ❌ 』- `Questo comando può essere utilizzato solo dal proprietario.`', m)

  try {
    await m.react('⏳')

  
    execSync('git fetch', { stdio: 'ignore' })
    let status = execSync('git status -uno', { encoding: 'utf-8' })

  
    if (status.includes('Your branch is up to date') || status.includes('Il tuo branch è aggiornato') || status.includes('nothing to commit')) {
      await m.react('✅')
      return conn.reply(m.chat, '✅ *Il bot è già aggiornato all\'ultima versione.*', m)
    }

  
    let updateOutput = execSync('git reset --hard && git pull --stat', { encoding: 'utf-8' })

   
    let fileDetails = parseGitFileDetails(updateOutput)
    let message = ''

    if (fileDetails.length > 0) {
      let reportFiles = fileDetails.map((f, i) => {
        return `*FILE ${i + 1}:* \`${f.name}\`\n➕ Aggiunte: ${f.ins} | ➖ Rimosse: ${f.del}`
      }).join('\n\n')

      message = `🚀 *SISTEMA DI AGGIORNAMENTO*\n\n━━━━━━━━━━━━━━━━━━━━\n${reportFiles}\n━━━━━━━━━━━━━━━━━━━━\n\n✅ *𝟴𝟴𝟴 𝗕𝗢𝗧 aggiornato con successo!*`
    } else {
      message = `🚀 *SISTEMA DI AGGIORNAMENTO*\n\n✅ *𝟴𝟴𝟴 𝗕𝗢𝗧 aggiornato con successo!* (Modifiche generiche alla repository)`
    }

    await conn.reply(m.chat, message.trim(), m)
    await m.react('🍥')

  } catch (err) {
    console.error('Errore durante l\'aggiornamento:', err)
    await conn.reply(m.chat, `❌ *ERRORE DURANTE L'AGGIORNAMENTO*\n\n> \`${err.message}\``, m)
    await m.react('❌')
  }
}

function parseGitFileDetails(output) {
  const lines = output.split('\n')
  const files = []

 
  const fileLineRegex = /^\s*(.+?)\s*\|\s*(\d+)\s+(.*)$/

  for (let line of lines) {
    let match = line.match(fileLineRegex)
    if (match) {
      let name = match[1].trim()
      let plusMinus = match[3]

     
      if (name.includes('file changed') || name.includes('files changed')) continue

      let ins = (plusMinus.match(/\+/g) || []).length
      let del = (plusMinus.match(/-/g) || []).length

      
      if (ins === 0 && del === 0 && plusMinus.includes('(+)') || plusMinus.includes('(-)')) {
        let insMatch = plusMinus.match(/(\d+)\s*\(\+\)/)
        let delMatch = plusMinus.match(/(\d+)\s*\(-\)/)
        ins = insMatch ? parseInt(insMatch[1]) : 0
        del = delMatch ? parseInt(delMatch[1]) : 0
      }

      files.push({ name, ins, del })
    }
  }
  return files
}

handler.help = ['aggiorna', 'update']
handler.tags = ['creatore']
handler.command = ['aggiorna', 'update', 'aggiornabot']
handler.rowner = true // Forza il comando solo per i veri Owner del bot

export default handler
