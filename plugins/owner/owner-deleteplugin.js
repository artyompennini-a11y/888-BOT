//Plugin by punisher, elixir & 888 staff

import { join } from 'path'
import { unlinkSync, existsSync, readdirSync } from 'fs'

const PROTECTED_PLUGIN_NAMES = new Set(['crediti', 'crediti.js'])

const handler = async (m, { conn, args, text, __dirname }) => {
  const input = (args?.[0] || text || '').trim()
  if (!input) throw '📌 *_Esempio uso:_*\n*#deleteplugin Menu-official*'

  const pluginName = input.replace(/\.js$/i, '')

  if (PROTECTED_PLUGIN_NAMES.has(pluginName.toLowerCase())) {
    throw 'Questo plugin è protetto e non può essere eliminato.'
  }

  const pluginPath = join(__dirname, `${pluginName}.js`)
  if (!existsSync(pluginPath)) {
    // Mostra lista plugin disponibili
    const files = readdirSync(__dirname).filter(f => f.endsWith('.js'))
    const list = files.map((f, i) => `${i + 1}. ${f.replace('.js', '')}`).join('\n')
    throw `*🗃️ Plugin non trovato!*\n\n📋 Plugin disponibili:\n${list}`
  }

  unlinkSync(pluginPath)
  return conn.reply(m.chat, `✅ Il plugin "${pluginName}.js" è stato eliminato con successo.`, m)
}

handler.tags = ['owner']
handler.help = ['deleteplugin <nome>']
handler.command = /^(deleteplugin|dp|deleteplu)$/i
handler.rowner = true

export default handler
