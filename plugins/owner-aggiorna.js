import { execSync } from 'child_process'

let handler = async (m, { conn, isOwner }) => {
  if (!isOwner) return conn.reply(m.chat, '『 ❌ 』- `Questo comando può essere utilizzato solo dal proprietario.`', m)

  try {
    await m.react('⏳')

    execSync('git fetch origin', { stdio: 'ignore' })
    
    let status = execSync('git status -uno', { encoding: 'utf-8' })
 
    if (status.includes('Your branch is up to date') || status.includes('Il tuo branch è aggiornato') || status.includes('nothing to commit')) {
      await m.react('✅')
      return conn.reply(m.chat, '✅ *Il bot è già aggiornato all\'ultima versione.*', m)
    }

    execSync('git reset --hard origin/main', { encoding: 'utf-8' }) 
    let updateOutput = execSync('git diff HEAD@{1} --numstat', { encoding: 'utf-8' }).trim()

    let message = ''
    if (updateOutput) {
      let lines = updateOutput.split('\n')
      let reportFiles = lines.map((line, i) => {
        let [ins, del, name] = line.trim().split(/\s+/)
        return `*FILE ${i + 1}:* \`${name}\`\n➕ Aggiunte: ${ins} | ➖ Rimosse: ${del}`
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

handler.help = ['aggiorna', 'update']
handler.tags = ['creatore']
handler.command = ['aggiorna', 'update', 'aggiornabot']
handler.rowner = true 

export default handler
