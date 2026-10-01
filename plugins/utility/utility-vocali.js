// Plugin by elixir, punisher & 888 staff
import { MsEdgeTTS } from 'msedge-tts'

const MAX_CHARS = 200

const LANGS = {
  it: 'it-IT-IT-DiegoNeural',
  en: 'en-US-AriaNeural',
  fr: 'fr-FR-DeniseNeural',
  es: 'es-ES-ElviraNeural',
  de: 'de-DE-KatjaNeural',
  pt: 'pt-BR-FranciscaNeural'
}

const NAMES = {
  'it-IT-IT-DiegoNeural': 'Italiano (Diego)',
  'en-US-AriaNeural': 'Inglese (Aria)',
  'fr-FR-DeniseNeural': 'Francese (Denise)',
  'es-ES-ElviraNeural': 'Spagnolo (Elvira)',
  'de-DE-KatjaNeural': 'Tedesco (Katja)',
  'pt-BR-FranciscaNeural': 'Portoghese BR (Francisca)'
}

const sanitize = (t) => String(t || '')
  .replace(/[*_~`#>|]/g, '')
  .replace(/\s+/g, ' ')
  .trim()

const handler = async (m, { conn, args, usedPrefix }) => {
  const sub = (args[0] || '').toLowerCase()

  if (sub === 'help' || sub === 'aiuto') {
    const lines = Object.entries(LANGS)
      .map(([k, v]) => `${usedPrefix}vocali ${k} <testo> — ${NAMES[v]}`)
      .join('\n')
    return m.reply(
`🎙️ *VOCALI 888*

${lines}

🇮🇹 Predefinito: italiano
🔊 Rispondi a un messaggio con *${usedPrefix}vocali* per convertirlo.
📝 Limite: ${MAX_CHARS} caratteri.`
    )
  }

  let voice = LANGS.it
  let text = ''

  if (LANGS[sub]) {
    voice = LANGS[sub]
    text = args.slice(1).join(' ')
  } else {
    text = args.join(' ')
  }

  if (!text && m.quoted?.text) text = m.quoted.text

  const clean = sanitize(text)

  if (!clean) {
    return m.reply(`❌ Scrivi il testo da pronunciare.\nEsempio: *${usedPrefix}vocali ciao mondo*`)
  }

  if (clean.length > MAX_CHARS) {
    return m.reply(`❌ Testo troppo lungo: *${clean.length}* caratteri (max ${MAX_CHARS}).`)
  }

  let tts
  try {
    tts = new MsEdgeTTS()
    const buffer = Buffer.from(await tts.toStream(clean, voice))

    if (!buffer.length) {
      tts.close()
      return m.reply('❌ Audio generato vuoto, riprova.')
    }

    await conn.sendMessage(m.chat, {
      audio: buffer,
      mimetype: 'audio/mpeg',
      fileName: 'vocali.mp3'
    }, { quoted: m })

    tts.close()
  } catch (e) {
    console.error('[vocali]', e?.message || e)
    try { tts?.close() } catch {}
    return m.reply('❌ Errore nella sintesi vocale. Riprova più tardi.')
  }
}

handler.help = ['vocali <testo>', 'vocali en <testo>']
handler.tags = ['utility', 'fun']
handler.command = /^vocali$/i

export default handler