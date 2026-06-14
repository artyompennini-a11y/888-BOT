// Plugin by Elixir, Punisher & 888 staff
import { execSync } from 'child_process'
import path from 'path'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function truncate(text = '', max = 3500) {
  const str = String(text || '')
  return str.length > max ? str.slice(0, max) + '\n...' : str
}

let handler = async (m, { conn, command, usedPrefix: prefix }) => {
  try {
    console.log(`[update] Avvio processo di aggiornamento richiesto da: ${m.sender} tramite comando: ${command}`)
    await m.react('🔄')

    console.log('[update] Esecuzione git fetch origin...')
    execSync('git fetch origin', { encoding: 'utf-8' })

    console.log('[update] Controllo differenze con origin/main...')
    let diffStat = ''
    let diffStatus = ''
    
    try {
      diffStat = execSync('git diff --stat HEAD origin/main', { encoding: 'utf-8' }) || ''
      diffStatus = execSync('git diff --name-status HEAD origin/main', { encoding: 'utf-8' }) || ''
    } catch (gitErr) {
      console.warn('[update] Nessun commit o nessuna differenza rilevata dall\'estrazione stat:', gitErr.message)
    }

    const statMap = {}

    diffStat
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.includes('|'))
      .forEach(line => {
        const parts = line.split('|')
        if (parts.length >= 2) {
          const file = parts[0].trim()
          const changesRaw = parts[1] || ''
          const plus = (changesRaw.match(/\+/g) || []).length
          const minus = (changesRaw.match(/-/g) || []).length
          statMap[file] = { plus, minus }
        }
      })

    const updatedFiles = diffStatus
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split('\t')
        if (parts.length < 2) return null

        const status = parts[0] || ''
        const oldPath = parts[1] || ''
        const newPath = parts[2] || ''

        if (status.startsWith('R') && newPath) {
          const stats = statMap[newPath] || statMap[oldPath] || { plus: 0, minus: 0 }
          return ` ⮕ 🔁 ${oldPath} → ${newPath} (+${stats.plus}/-${stats.minus})`
        }

        if (status === 'A') {
          const stats = statMap[oldPath] || { plus: 0, minus: 0 }
          return ` ⮕ 🆕 ${oldPath} (+${stats.plus}/-${stats.minus})`
        }

        if (status === 'D') {
          const stats = statMap[oldPath] || { plus: 0, minus: 0 }
          return ` ⮕ 🗑 ${oldPath} (+${stats.plus}/-${stats.minus})`
        }

        const stats = statMap[oldPath] || { plus: 0, minus: 0 }
        return ` ⮕ 📄 ${oldPath} (+${stats.plus}/-${stats.minus})`
      })
      .filter(Boolean)

    console.log(`[update] File rilevati da aggiornare: ${updatedFiles.length}`)
    console.log('[update] Esecuzione git reset e git pull...')
    execSync('git reset --hard origin/main && git pull', { encoding: 'utf-8' })

    await sleep(1500)

    let filesContent = updatedFiles.length > 0 
      ? updatedFiles.join('\n┃') 
      : ' ⮕ Nessun file da aggiornare (Bot già aggiornato)'

    let resultMsg = 
`╭━━━〔 🔄 *AGGIORNAMENTO* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Livello:* Privilegi Amministratore
┃━━━━━━━━━━━━━━━━━━
┃ ⚙️ *Stato del Sistema:*
┃  ⮕ *Esito:* AGGIORNATO CON SUCCESSO ✅
┃  ⮕ *File Rilevati:* ${updatedFiles.length}
┃ 
┃ 📦 *Dettagli Modifiche:*
┃${filesContent}
╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici, 
> utilizza il comando *${prefix || '#'}ticket* per 
> segnalarlo subito allo staff.`.trim()

    await conn.reply(m.chat, truncate(resultMsg), m)
    await m.react('✅')
    console.log('[update] Processo di aggiornamento completato con successo.')

  } catch (err) {
    console.error('[update] Errore critico durante l\'aggiornamento:', err)
    await conn.reply(
      m.chat,
      `\`── ❌ UPDATE ERROR ──\`\n\n\`💥\` ${err.message}\n\n\`[⚡] 888 SYSTEM\``,
      m
    )
    await m.react('❌')
  }
}

handler.help = ['aggiorna']
handler.tags = ['owner']
handler.command = /^(aggiorna|update|aggiornabot)$/i
handler.owner = true

export default handler
