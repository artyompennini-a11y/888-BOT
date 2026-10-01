// Plugin by elixir, punisher & 888 staff
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawnSync } from 'child_process'
import ai from '../../lib/ai.js'

const MAX_TOKENS = 2200
const TEMP = 0.25

const SYSTEM = "Sei un sviluppatore JavaScript esperto.\nRicevi una descrizione in italiano e devi generare UN SOLO file di plugin per un bot WhatsApp basato su Baileys.\n\nREQUISITI OBBLIGATORI:\n1. Rispondi ESCLUSIVAMENTE con codice JavaScript valido, senza testo introduttivo e senza spiegazioni.\n2. NON usare blocchi markdown. Solo codice puro.\n3. Inizia SEMPRE con: // Plugin by elixir\n4. Usa import ESM, mai require.\n5. La struttura minima e OBBLIGATORIA e:\n\n// Plugin by elixir\nimport fetch from 'node-fetch'\n\nlet handler = async (m, { conn, text }) => {\n    if (!text) return m.reply('Scrivi qualcosa.')\n    return m.reply('Hai scritto: ' + text)\n}\n\nhandler.help = ['eco <testo>']\nhandler.tags = ['fun']\nhandler.command = /^(eco)$/i\n\nexport default handler\n\n6. handler.command puo essere stringa, array di stringhe o RegExp.\n7. Per i gruppi aggiungi handler.group = true.\n8. Per comandi admin aggiungi handler.admin = true.\n9. Rispondi con m.reply(testo).\n10. Massimo 150 righe. Sii conciso ma funzionante.\n11. Librerie disponibili: jimp, node-fetch, axios, moment-timezone, libphonenumber-js, uuid, jsqr, canvas."

const RULES = "RICORDA: solo codice, niente markdown, niente spiegazioni.\nIl file deve iniziare con: // Plugin by elixir\nIl file deve terminare con: export default handler"

const BT = String.fromCharCode(96)
const NL = String.fromCharCode(10)

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const stripFences = (raw) => {
  const text = String(raw || '').trim()
  const ticks = BT + BT + BT
  const start = text.indexOf(ticks)
  if (start === -1) return text
  const body = text.slice(start + ticks.length)
  const end = body.indexOf(ticks)
  let out = end === -1 ? body : body.slice(0, end)
  out = out.replace(new RegExp('^(?:js|javascript)?' + NL, 'i'), '')
  return out.trim()
}

const extractCode = (raw) => {
  const text = stripFences(raw)
  const first = text.indexOf('import ')
  const alt = text.indexOf('let handler')
  const start = first >= 0 ? first : (alt >= 0 ? alt : 0)
  const exp = text.lastIndexOf('export default')
  let out = exp >= 0 ? text.slice(0, text.indexOf(NL, exp) + 1 || text.length) : text
  out = out.slice(start)
  if (!out.trim().startsWith('// Plugin by elixir')) {
    out = '// Plugin by elixir' + NL + out
  }
  return out.replace(/\s+$/, '') + NL
}

const looksLikePlugin = (code) => {
  if (!/export default/.test(code)) return false
  if (!/handler\s*\.\s*command/.test(code)) return false
  if (/\bprocess\.exit\b/.test(code)) return false
  return true
}

const validate = (code) => {
  let dir
  try {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cpl-'))
    const file = path.join(dir, 'check.js')
    fs.writeFileSync(file, code, 'utf8')
    const res = spawnSync(process.execPath, ['--check', file], { timeout: 5000, encoding: 'utf8' })
    return {
      valid: res.status === 0,
      reason: (res.stderr || '').split(NL).filter(Boolean).slice(0, 3).join(' | ')
    }
  } catch (e) {
    return { valid: null, reason: e?.message || 'errore' }
  } finally {
    try { if (dir) fs.rmSync(dir, { recursive: true, force: true }) } catch {}
  }
}
const askAI = (prompt) => ai.ask([
  { role: 'system', content: SYSTEM },
  { role: 'user', content: prompt + NL + NL + RULES }
], { maxTokens: MAX_TOKENS, temperature: TEMP })

const STOP_WORDS = ['plugin', 'comando', 'crea', 'creami', 'vorrei', 'un', 'una', 'per', 'che', 'con', 'deve', 'quando', 'ogni']

const guessName = (prompt) => {
  const words = String(prompt || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.includes(w))
  const slug = words.slice(0, 2).join('-') || 'plugin'
  return slug.replace(/^-+|-+$/g, '').slice(0, 24) || 'plugin'
}
const handler = async (m, { conn, text, usedPrefix }) => {
  const prompt = String(text || '').trim()

  if (!prompt) {
    return m.reply([
      'CREAPLUGIN 888',
      '',
      'Descrivi cosa deve fare il plugin e te lo mando qui come file .js.',
      '',
      'Esempi:',
      usedPrefix + 'creaplugin rispondi buongiorno quando ricevo ciao',
      usedPrefix + 'creaplugin conta le bestemmie del giorno',
      usedPrefix + 'creaplugin manda foto di un gatto quando dico gatto',
      '',
      'Il codice arriva come documento .js. Leggi e decidi tu se usarlo.',
      'Descrivi bene: piu dettagli dai, piu il plugin sara utile.'
    ].join(NL))
  }

  if (!ai.available().length) {
    return m.reply('Nessuna API IA configurata. Aggiungi groq, gemini o openrouter in global.APIKeys dentro config.js.')
  }

  await m.reply('Sto scrivendo il plugin...')

  let raw
  try {
    raw = (await askAI(prompt)).text
  } catch (e) {
    console.error('[creaplugin]', e?.message || e)
    return m.reply('Errore nel generare il plugin: ' + (e?.message || e) + '. Riprova tra poco.')
  }

  const code = extractCode(raw)

  if (!looksLikePlugin(code)) {
    return m.reply('Il modello non ha restituito un plugin valido. Riformula la richiesta.')
  }

  const check = validate(code)
  const name = guessName(prompt)
  const lines = code.split(NL).length

  let status
  if (check.valid === true) {
    status = 'Sintassi verificata'
  } else if (check.valid === false) {
    status = 'ATTENZIONE: sintassi non valida' + NL + check.reason
  } else {
    status = 'Sintassi non verificata'
  }

  await m.reply(
    'PLUGIN GENERATO' + NL +
    'Richiesta: ' + prompt + NL +
    'File: ' + name + '.js' + NL +
    'Righe: ' + lines + NL +
    status + NL + NL +
    'Il file e allegato. Aprilo, leggilo, e decidi tu se usarlo.'
  )

  await conn.sendMessage(m.chat, {
    document: Buffer.from(code, 'utf8'),
    mimetype: 'application/javascript',
    fileName: name + '.js',
    caption: name + '.js - ' + lines + ' righe, generato dall IA. Rivedilo prima di usarlo.'
  })

  global.__lastCreatedPlugin = { name, code, at: Date.now() }
}

handler.help = ['creaplugin <descrizione>']
handler.tags = ['owner', 'tools']
handler.command = /^creaplugin$/i
handler.owner = true

export default handler
