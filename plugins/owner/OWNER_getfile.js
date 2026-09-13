import fs from 'fs'
import syntaxError from 'syntax-error'
import path from 'path'

const _fs = fs.promises

function normalizza(str) {
  return str
    .toLowerCase()
    .replace(/[\-_\.\s]+/g, '')
    .replace(/\.js$/i, '')
}

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

function scoreSomiglianza(query, filename) {
  const q = normalizza(query)
  const f = normalizza(filename)
  if (q === f) return 100
  if (f.includes(q) || q.includes(f)) {
    const ratio = Math.min(q.length, f.length) / Math.max(q.length, f.length)
    return Math.round(85 + ratio * 10)
  }
  const dist = levenshtein(q, f)
  const maxLen = Math.max(q.length, f.length)
  return Math.max(0, Math.round((1 - dist / maxLen) * 100))
}

async function cercaFileSimili(query, dir, top = 5) {
  let files = []
  try { files = await _fs.readdir(dir) } catch { return [] }
  return files
    .filter(f => f.endsWith('.js'))
    .map(f => ({ file: f, score: scoreSomiglianza(query, f) }))
    .filter(x => x.score > 25)
    .sort((a, b) => b.score - a.score)
    .slice(0, top)
}

let handler = async (m, { text, usedPrefix, command, __dirname, conn }) => {
  const args = text ? text.trim().split(/\s+/) : []

  // MENU — Grafica Premium 888
  if (!text || args.length === 0) {
    return m.reply(`
📁 *FILE MANAGER 888*
Richiesta parametri

🔍 *Utilizzo*
• ${usedPrefix + command} <nome file> [script|file]

📌 *Esempi*
• ${usedPrefix}getplugin rpg_poker  
• ${usedPrefix}getfile config.js script  

Il sistema supporta ricerca flessibile.
`.trim())
  }

  const isPlugin = /p(lugin)?/i.test(command)
  const fileArg  = args[0]
  const option   = args[1]?.toLowerCase() || null

  let filename, pathFile

  if (isPlugin) {
    filename = fileArg.replace(/plugins?\//i, '') + (/\.js$/i.test(fileArg) ? '' : '.js')
    pathFile  = path.join(__dirname, filename)
  } else {
    filename = path.basename(fileArg)
    pathFile  = fileArg
  }

  const esiste = await _fs.access(pathFile).then(() => true).catch(() => false)

  // FILE NON TROVATO — Suggerimenti 888
  if (!esiste) {
    const dir    = isPlugin ? __dirname : path.dirname(pathFile)
    const simili = await cercaFileSimili(fileArg, dir)

    if (simili.length === 0) {
      return m.reply(`
❌ *FILE NON TROVATO*
Target: ${filename}
Nessun file simile rilevato.
`.trim())
    }

    const barre = simili.map((x, i) => {
      const filled = Math.round(x.score / 10)
      const bar    = '█'.repeat(filled) + '▒'.repeat(10 - filled)
      return `${i + 1}. [${bar}] ${x.score}% — _${x.file}_`
    }).join('\n')

    const buttons = simili.map(x => [
      `📄 ${x.file} (${x.score}%)`,
      `${usedPrefix + command} ${x.file}`
    ])

    return await conn.sendButton(
      m.chat,
      `
🔍 *FILE SUGGERITI 888*
Corrispondenze parziali

❓ Cercavi: ${filename}

🎯 Elementi rilevati:
${barre}

Seleziona un'opzione sotto.
`.trim(),
      '888 File Manager',
      null,
      buttons,
      m
    )
  }

  // FILE TROVATO — Scelta modalità 888
  if (!option) {
    return await conn.sendButton(
      m.chat,
      `
📁 *FILE RILEVATO 888*
File: ${filename}

Scegli la modalità di output:
`.trim(),
      '888 File Manager',
      null,
      [
        [`📄 Come script`, `${usedPrefix + command} ${text} script`],
        [`📎 Come documento`, `${usedPrefix + command} ${text} file`]
      ],
      m
    )
  }

  const isJS = /\.js$/i.test(filename)

  try {
    const fileContent = isJS
      ? await _fs.readFile(pathFile, 'utf8')
      : await _fs.readFile(pathFile)

    // INVIO FILE — Grafica Premium 888
    if (option === 'file') {
      await conn.sendMessage(
        m.chat,
        {
          document: isJS ? Buffer.from(fileContent, 'utf8') : fileContent,
          mimetype: isJS ? 'application/javascript' : undefined,
          fileName: filename,
          caption: `📎 *DOCUMENTO 888*\nElemento: ${filename}\nModulo inviato con successo.`
        },
        { quoted: m }
      )
    }

    // SCRIPT — Grafica Premium 888
    else if (option === 'script') {
      if (!isJS) throw 'L\'opzione script è disponibile solo per file JavaScript.'
      await m.reply(`// Codice di ${filename}\n\n${fileContent}`)
    }

    else {
      throw 'Opzione non valida! Usa *file* o *script*.'
    }

    // CHECK SINTASSI — Grafica Premium 888
    if (isJS) {
      const error = syntaxError(fileContent, filename, {
        sourceType: 'module',
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true
      })
      if (error) {
        await m.reply(`
⛔ *SINTASSI CORROTTA 888*
Modulo: ${filename}

💥 Errore:
${error}
`.trim())
      }
    }

  } catch (err) {
    await m.reply(`
❌ *ERRORE PROCESSO 888*
File: ${filename}

💥 Eccezione:
${err}
`.trim())
  }
}

handler.help = ['getplugin <nome file>', 'getfile <percorso file>']
handler.tags = ['owner']
handler.command = /^g(et)?(p(lugin)?|f(ile)?)$/i
handler.rowner = true

export default handler