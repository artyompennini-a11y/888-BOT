import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
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
    let richiedeRiavvioCompleto = false

    if (fileDetails.length > 0) {
      let reportFiles = await Promise.all(fileDetails.map(async (f, i) => {
        
        if (f.name.endsWith('.js')) {
          if (!f.name.startsWith('plugins/')) {
            richiedeRiavvioCompleto = true
          } else {
            try {
              let nomePlugin = path.basename(f.name)
              const percorsoAssoluto = path.resolve(rootDir, f.name)
              const fileUrlConTimestamp = `${pathToFileURL(percorsoAssoluto).href}?update=${Date.now()}`
              
              if (global.plugins && global.plugins[nomePlugin]) {
                delete global.plugins[nomePlugin]
              } else if (global.plugins && global.plugins[f.name]) {
                delete global.plugins[f.name]
              }

              const moduloAggiornato = await import(fileUrlConTimestamp)
              if (global.plugins) {
                global.plugins[nomePlugin] = moduloAggiornato.default || moduloAggiornato
              }
              
              moduliRicaricati++
            } catch (e) {
              console.log(`[Aggiornamento] Errore ricaricamento a caldo per: ${f.name}`, e.message)
              richiedeRiavvioCompleto = true
            }
          }
        }

        return `*FILE ${i + 1}:* \`${f.name}\`\n➕ Aggiunte: ${f.ins} | ➖ Rimosse: ${f.del}`
      }))

      if (richiedeRiavvioCompleto) {
        message = `🚀 *SISTEMA DI AGGIORNAMENTO*\n\n━━━━━━━━━━━━━━━━━━━━\n${reportFiles.join('\n\n')}\n━━━━━━━━━━━━━━━━━━━━\n\n⚠️ *Rilevate modifiche al Core o errori strutturali.*\n🔄 *Il bot si sta riavviando automaticamente per applicare tutto...*`
        await conn.reply(m.chat, message.trim(), m)
        await m.react('🔄')
        
        setTimeout(() => {
          process.exit(0)
        }, 1500)
        return
      }

      message = `🚀 *SISTEMA DI AGGIORNAMENTO*\n\n━━━━━━━━━━━━━━━━━━━━\n${reportFiles.join('\n\n')}\n━━━━━━━━━━━━━━━━━━━━\n\n🔄 *Moduli aggiornati a caldo:* ${moduliRicaricati}\n✅ *𝟴𝟴𝟴 𝗕𝗢𝗧 aggiornato con successo senza sloggarsi!*`
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

export default handler
