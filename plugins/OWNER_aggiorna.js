// Plugin by Elixir, Punisher & 888 staff
import { execSync } from 'child_process'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function truncate(text = '', max = 3500) {
  const str = String(text || '')
  return str.length > max ? str.slice(0, max) + '\n...' : str
}

let handler = async (m, { conn, text, command }) => {
  if (!m.isCreator && conn.user.jid !== m.sender) {
    return m.reply('⚠️ *Questo comando è riservato al proprietario del bot.*')
  }

  try {
    await m.react('🔄')

    execSync('git fetch origin', { encoding: 'utf-8' })

    const diffStat = execSync('git diff --stat HEAD origin/main', {
      encoding: 'utf-8'
    })

    const diffStatus = execSync('git diff --name-status HEAD origin/main', {
      encoding: 'utf-8'
    })

    const statMap = {}

    diffStat
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.includes('|'))
      .forEach(line => {
        const [file, changesRaw] = line.split('|').map(s => s.trim())
        const plus = (changesRaw.match(/\+/g) || []).length
        const minus = (changesRaw.match(/-/g) || []).length
        statMap[file] = { plus, minus }
      })

    const updatedFiles = diffStatus
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split('\t')
        const status = parts[0]
        const oldPath = parts[1]
        const newPath = parts[2]

        if (status.startsWith('R')) {
          const stats = statMap[newPath] || statMap[oldPath] || { plus: 0, minus: 0 }
          return `\`🔁\` ${oldPath} \`→\` ${newPath} \`(+${stats.plus}/-${stats.minus})\``
        }

        if (status === 'A') {
          const stats = statMap[oldPath] || { plus: 0, minus: 0 }
          return `\`🆕\` ${oldPath} \`(+${stats.plus}/-${stats.minus})\``
        }

        if (status === 'D') {
          const stats = statMap[oldPath] || { plus: 0, minus: 0 }
          return `\`🗑\` ${oldPath} \`(+${stats.plus}/-${stats.minus})\``
        }

        const stats = statMap[oldPath] || { plus: 0, minus: 0 }
        return `\`📄\` ${oldPath} \`(+${stats.plus}/-${stats.minus})\``
      })

    execSync('git reset --hard origin/main && git pull', {
      encoding: 'utf-8'
    })

    await sleep(1500)

    let resultMsg = `\`── ✅ UPDATE COMPLETE ──\``

    if (updatedFiles.length > 0) {
      resultMsg += `\n\n\`📦 File aggiornati:\` ${updatedFiles.length}\n\n${updatedFiles.join('\n')}`
    } else {
      resultMsg += `\n\n\`ℹ️ Nessun file da aggiornare\``
    }

    resultMsg += `\n\n\`[⚡] 888 SYSTEM\``

    await conn.reply(m.chat, truncate(resultMsg), m)
    await m.react('✅')

  } catch (err) {
    await conn.reply(
      m.chat,
      `\`── ❌ UPDATE ERROR ──\`\n\n\`💥\` ${err.message}\n\n\`[⚡] 888 SYSTEM\``,
      m
    )
    await m.react('❌')
  }
}

handler.help = ['aggiorna']
handler.tags = ['creatore']
handler.command = /^(aggiorna|update|aggiornabot)$/i
handler.owner = true

export default handler
