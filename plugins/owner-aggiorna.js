import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const REPO_URL = 'https://github.com/artyompennini-a11y/888-BOT'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let handler = async (m, { conn, text, isOwner }) => {
 
  if (!isOwner) return conn.reply(m.chat, '『 ❌ 』- `Questo comando può essere utilizzato solo dal proprietario.`', m)

  try {
    await m.react('⏳')

    const rootDir = path.resolve(__dirname, '../') 
    const gitDir = path.join(rootDir, '.git')

    if (!fs.existsSync(gitDir)) {
      execSync('git init', { cwd: rootDir })
      execSync(`git remote add origin ${REPO_URL}`, { cwd: rootDir })
      execSync('git fetch origin', { cwd: rootDir })
      execSync('git checkout -f main || git checkout -f master', { cwd: rootDir })
    } else {
      try {
        execSync(`git remote set-url origin ${REPO_URL}`, { cwd: rootDir })
      } catch {
        execSync(`git remote add origin ${REPO_URL}`, { cwd: rootDir })
      }
    }

    execSync('git fetch origin', { cwd: rootDir, stdio: 'ignore' })
    let status = execSync('git status -uno', { cwd: rootDir, encoding: 'utf-8' })

    if (status.includes('Your branch is up to date') || status.includes('Il tuo branch è aggiornato') || status.includes('nothing to commit')) {
      await m.react('✅')
      return conn.reply(m.chat, '✅ *Il bot è già aggiornato all\'ultima versione.*', m)
    }

    let updateOutput = execSync('git reset --hard origin/main || git reset --hard origin/master && git pull --stat', { cwd: rootDir, encoding: 'utf-8' })
    let fileDetails = parseGitFileDetails(updateOutput)
    let message = ''
    let moduliRicaricati = 0

    if (fileDetails.length > 0) {
      let reportFiles = fileDetails.map((f, i) => {
        
        if (f.name.endsWith('.js')) {
          try {
            const percorsoAssoluto = path.resolve(__dirname, '../', f.name) 

            if (global.plugins && global.plugins[f.name]) {
              delete global.plugins[f.name]
            }

            const cacheKey = require.resolve(percorsoAssoluto)
            if (require.cache[cacheKey]) {
              delete require.cache[cacheKey]
            }
            
            moduliRicaricati++
          } catch (e) {
            console.log(`[Aggiornamento] Impossibile ricaricare: ${f.name}`, e.message)
          }
        }

        return `*FILE ${i + 1}:* \`${f.name}\`\n➕ Aggiunte: ${f.ins} | ➖ Rimosse: ${f.del}`
      }).join('\n\n')

      message = `🚀 *SISTEMA DI AGGIORNAMENTO*\n\n━━━━━━━━━━━━━━━━━━━━\n${reportFiles}\n━━━━━━━━━━━━━━━━━━━━\n\n🔄 *File ricaricati in memoria:* ${moduliRicaricati}\n✅ *𝟴𝟴𝟴 𝗕𝗢𝗧 aggiornato con successo senza sloggarsi!*`
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
    if (line.includes('changed') && (line.includes('insertion') || line.includes('deletion'))) continue

    let match = line.match(fileLineRegex)
    if (match) {
      let name = match[1].trim()
      let plusMinus = match[3].trim()

      let ins = (plusMinus.match(/\+/g) || []).length
      let del = (plusMinus.match(/-/g) || []).length

      if (ins === 0 && del === 0) {
        let totalChanges = parseInt(match[2])
        ins = totalChanges
      }

      files.push({ name, ins, del })
    }
  }
  return files
}

handler.help = ['aggiorna', 'update']
handler.tags = ['creatore']
handler.command = ['aggiorna', 'update', 'aggiornabot']
handler.rowner = true 

export default handler
