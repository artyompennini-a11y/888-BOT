import fs from 'fs'
import syntaxError from 'syntax-error'
import path from 'path'
import { fileURLToPath } from 'url'

const _fs = fs.promises

function normalizza(str) {

  return str
    .replace(/\.js$/i, '')
    .toLowerCase()
    .replace(/[\-_\.\s]+/g, '')
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


const HERE = path.dirname(fileURLToPath(import.meta.url))
const PLUGINS_DIR = path.resolve(HERE, '..')

const esiste = (p) => _fs.access(p).then(() => true).catch(() => false)

let _cache = null
let _cacheT = 0

async function listaPlugin(root = PLUGINS_DIR, out = [], depth = 0) {
  if (depth > 6) return out
  let entries = []
  try { entries = await _fs.readdir(root, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue
    const full = path.join(root, e.name)
    if (e.isDirectory()) await listaPlugin(full, out, depth + 1)
    else if (e.isFile() && e.name.endsWith('.js')) out.push(full)
  }
  return out
}

async function tuttiIPlugin() {
  const ora = Date.now()
  if (_cache && ora - _cacheT < 30000) return _cache
  _cache = await listaPlugin()
  _cacheT = ora
  return _cache
}

const percorsoRelativo = (full) => path.relative(PLUGINS_DIR, full).split(path.sep).join('/')


async function cercaInPlugins(query, top = 6) {
  const tutti = await tuttiIPlugin()
  const qn = normalizza(query)
  return tutti
    .map((p) => ({
      path: p,
      file: path.basename(p),
      rel: percorsoRelativo(p),
      score: scoreSomiglianza(query, path.basename(p)),
      esatto: normalizza(path.basename(p)) === qn
    }))
    .filter((x) => x.score > 30)
    .sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel))
    .slice(0, top)
}


async function risolviFile(raw, isPlugin) {
  const haCartella = raw.includes('/') || raw.includes('\\')
  const nomeFile = path.basename(raw).replace(/^plugins?[/\\]/i, '').replace(/^\.\.?[/\\]/, '')
  const filename = /\.[a-z0-9]+$/i.test(nomeFile) ? nomeFile : nomeFile + '.js'

  let pathFile
  if (isPlugin) {
    if (haCartella) {

      const dir = path.dirname(raw)
      pathFile = path.isAbsolute(raw)
        ? path.join(dir, filename)
        : path.resolve(PLUGINS_DIR, dir, filename)
    } else {
      pathFile = path.join(HERE, filename)
    }
  } else {
    pathFile = path.isAbsolute(raw) ? raw : path.resolve(raw)
  }

  let cartella = ''
  const trovato = await esiste(pathFile)

  if (!trovato && isPlugin) {
    const candidati = await cercaInPlugins(raw)

    const primo = candidati.find((x) => x.esatto)
    if (primo) {
      pathFile = primo.path
      cartella = primo.rel
    }
  }

  return { pathFile, filename: path.basename(pathFile), cartella, trovato: await esiste(pathFile) }
}

let handler = async (m, { text, usedPrefix, command, __dirname, conn }) => {
  const args = text ? text.trim().split(/\s+/) : []


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


  const { pathFile, filename, cartella, trovato } = await risolviFile(fileArg.trim(), isPlugin)


  if (!trovato) {
    const simili = isPlugin ? await cercaInPlugins(fileArg) : []

    if (simili.length === 0) {
      return m.reply(`
❌ *FILE NON TROVATO*
Target: ${filename}
Nessun file simile in *plugins*.
`.trim())
    }

    const righe = simili.map((x, i) => {
      const barra = '█'.repeat(Math.max(1, Math.round(x.score / 20))) + '▒'.repeat(10 - Math.max(1, Math.round(x.score / 20)))
      return `${i + 1}. \`${x.file}\`  [${barra}] ${x.score}%\n    📂 ${x.rel}`
    }).join('\n')

    const buttons = simili.map(x => [
      `📄 ${x.file} (${x.score}%)`,
      `${usedPrefix + command} ${x.rel}`
    ])

    return await conn.sendButton(
      m.chat,
      `
🔎 *FORSE CERCAVI*
Non esiste \`${filename}\` dentro *plugins*.
Questi i plugin simili:

${righe}

Tocca quello giusto qui sotto.
`.trim(),
      '888 File Manager',
      null,
      buttons,
      m
    )
  }


  if (!option) {
    return await conn.sendButton(
      m.chat,
      `
📁 *FILE RILEVATO 888*
File: ${filename}${cartella ? '\nCartella: *' + cartella + '*' : ''}

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

 
    else if (option === 'script') {
      if (!isJS) throw 'L\'opzione script è disponibile solo per file JavaScript.'
      await m.reply(`// Codice di ${filename}\n\n${fileContent}`)
    }

    else {
      throw 'Opzione non valida! Usa *file* o *script*.'
    }

   
    if (isJS) {
      const error = syntaxError(fileContent, filename, {
        sourceType: 'module',
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true,
        ecmaVersion: 12
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
