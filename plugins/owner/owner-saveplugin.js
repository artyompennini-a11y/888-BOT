//Plugin by Gab, Lucifero & 888 staff

import fs from 'fs'
import { join } from 'path'

const PROTECTED_PLUGIN_NAMES = new Set(['crediti', 'crediti.js'])

let handler = async (m, { text, __dirname }) => {
  if (!text) throw 'Inserisci il nome del plugin da salvare'
  if (!m.quoted?.text) throw 'Rispondi al messaggio che contiene il codice del plugin da salvare'

  // Permetti / per plugin in sottocartelle (es: owner/menu-principale)
  const pluginName = text.trim().replace(/\.js$/i, '').replace(/[^a-zA-Z0-9_\-/]/g, '').toLowerCase()
  if (!pluginName) throw 'Nome plugin non valido'
  if (PROTECTED_PLUGIN_NAMES.has(pluginName)) throw 'Questo plugin è protetto e non può essere salvato o sovrascritto.'

  const pluginPath = join(__dirname, `${pluginName}.js`)
  fs.writeFileSync(pluginPath, m.quoted.text, 'utf8')

  await m.reply(`✅ Plugin salvato: ${pluginName}.js`)
}

handler.help = ['saveplugin <nome>']
handler.tags = ['owner']
handler.command = /^(saveplugin|salvar|editplugin)$/i
handler.rowner = true

export default handler
