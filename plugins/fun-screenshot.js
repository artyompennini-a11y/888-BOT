import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import globalFetch from 'node-fetch' 

const ICON_PATH = path.join(process.cwd(), 'icone', 'Whatsapp.jpeg')
const FONT_FILES = [
  '/usr/share/fonts/truetype/ancient-scripts/Symbola_hint.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
]
const FONT_FILE = FONT_FILES.find((f) => fs.existsSync(f)) || FONT_FILES[1]

// Funzione di escaping robusta per il filtro drawtext di FFmpeg
const escapeFfmpeg = (text) => {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "'\\''") 
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/=/g, '\\=')
    .replace(/%/g, '\\%')
    .replace(/\n/g, '\\n')
}

const wrapText = (text, maxLen = 34) => {
  const words = String(text || '').split(' ')
  const lines = []
  let line = ''

  const pushWord = (word) => {
    if (word.length <= maxLen) {
      if (!line) line = word
      else if ((line + ' ' + word).length <= maxLen) line += ' ' + word
      else {
        lines.push(line)
        line = word
      }
      return
    }

    if (line) {
      lines.push(line)
      line = ''
    }

    let start = 0
    while (start < word.length) {
      lines.push(word.slice(start, start + maxLen))
      start += maxLen
    }
  }

  for (const w of words) {
    pushWord(w)
  }
  if (line) lines.push(line)
  return lines.slice(0, 10)
}

const renderPreview = async (name, message, avatarInput) => {
  const nameTxt = escapeFfmpeg(name)
  const msgLines = wrapText(message, 34).slice(0, 10)
  const lineCount = msgLines.length
  const fontSpec = `fontfile='${FONT_FILE}'`

  const nameFontSize = nameTxt.length > 22 ? 64 : nameTxt.length > 16 ? 72 : 80
  let msgFontSize = 74
  if (lineCount > 4) msgFontSize = 62
  if (lineCount > 6) msgFontSize = 56
  if (lineCount > 8) msgFontSize = 50

  const msgDrawtext = msgLines.map((line, idx) =>
    `drawtext=${fontSpec}:text='${escapeFfmpeg(line)}':fontcolor=white:fontsize=${msgFontSize}:x=390:y=(main_h/2)+20+${idx * (msgFontSize + 10)}:box=1:boxcolor=black@0.4:boxborderw=6`
  ).join(',')

  const filter =
    `[1:v]scale=280:280,format=rgba[avatar_scaled];` +
    `color=c=black:s=280x280,format=rgba,` +
    `geq=r='if(lte(hypot(X-140,Y-140),140),255,0)':` +
    `g='if(lte(hypot(X-140,Y-140),140),255,0)':` +
    `b='if(lte(hypot(X-140,Y-140),140),255,0)'[mask];` +
    `[avatar_scaled][mask]alphamerge[avatar_round];` +
    `[0:v][avatar_round]overlay=70:(main_h-280)/2:format=auto,` +
    `drawtext=${fontSpec}:text='${nameTxt}':fontcolor=white:fontsize=${nameFontSize}:x=390:y=(main_h/2)-100,` +
    `${msgDrawtext}`

  
  const args = [
    '-y',
    '-i', ICON_PATH,
    '-i', avatarInput,
    '-filter_complex', filter,
    '-frames:v', '1',
    '-f', 'image2',
    'pipe:1'
  ]

  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', args)
    const chunks = []
    let stderr = ''
    
    ff.stdout.on('data', (chunk) => chunks.push(chunk))
    ff.stderr.on('data', (chunk) => { stderr += chunk.toString() })
    ff.on('error', reject)
    ff.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg exit code ${code}: ${stderr}`))
      resolve(Buffer.concat(chunks))
    })
  })
}

const getMentionedUser = (msg) => {
  if (!msg) return null
  if (msg.quoted?.sender) return msg.quoted.sender
  if (Array.isArray(msg.mentionedJid) && msg.mentionedJid.length) return msg.mentionedJid[0]
  if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) return msg.message.extendedTextMessage.contextInfo.mentionedJid[0]
  if (Array.isArray(msg.mentioned) && msg.mentioned.length) return msg.mentioned[0]
  return null
}

const removeMentionText = (text, msg) => {
  if (!text) return ''
  let cleaned = String(text)
  const mentions = new Set()

  if (Array.isArray(msg.mentionedJid)) {
    msg.mentionedJid.forEach((jid) => mentions.add(`@${jid.split('@')[0]}`))
  }
  const extendedMentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
  if (Array.isArray(extendedMentions)) {
    extendedMentions.forEach((jid) => mentions.add(`@${jid.split('@')[0]}`))
  }
  if (Array.isArray(msg.mentioned)) {
    msg.mentioned.forEach((mention) => mentions.add(mention))
  }

  mentions.forEach((mention) => {
    const escaped = mention.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    cleaned = cleaned.replace(new RegExp(escaped, 'g'), '')
  })

  cleaned = cleaned.replace(/^\s*@\+?[0-9]{4,}\s*/, '')
  cleaned = cleaned.replace(/^\s*@[^\s]+\s*/, '')

  return cleaned.replace(/\s{2,}/g, ' ').trim()
}

const getMessageText = (msg, args) => {
  const raw = Array.isArray(args) && args.length > 0 ? args.join(' ').trim() : ''
  let content = raw

  if (!content) {
    if (msg.quoted?.text) content = msg.quoted.text
    else if (msg.quoted?.caption) content = msg.quoted.caption
    else if (msg.quoted?.conversation) content = msg.quoted.conversation
    else content = String(msg.text || msg.body || '').replace(/^\.(?:prova|test|screenshot)\b\s*/i, '').trim()
  }

  return removeMentionText(content, msg)
}

let handler = async (m, { conn, args, groupMetadata }) => {
  let tempAvatarPath = null
  try {
    const who = getMentionedUser(m)
    const messageText = getMessageText(m, args)

    if (!who) {
      return m.reply('⚠️ Tagga o rispondi a una persona con il messaggio da usare.\nEsempio: .screenshot @utente ciao')
    }

    if (!messageText) {
      return m.reply('⚠️ Scrivi il testo da mostrare.\nEsempio: .screenshot @utente ciao')
    }

    await m.reply('⏳ Genero l\'immagine...')
    
    let targetName = null
    if (!groupMetadata && m.chat?.endsWith('@g.us')) {
      groupMetadata = await conn.groupMetadata?.(m.chat).catch(() => null)
    }
    if (groupMetadata?.participants) {
      const participant = groupMetadata.participants.find((p) => p.id === who)
      if (participant) {
        targetName = participant.notify || participant.name || participant.vname || null
      }
    }
    if (!targetName && conn.getName) {
      try {
        targetName = await conn.getName(who)
      } catch {
        targetName = null
      }
    }
    if (!targetName && conn.contacts && conn.contacts[who]) {
      const contact = conn.contacts[who]
      targetName = contact.name || contact.notify || contact.vname || null
    }
    if (!targetName && m.quoted?.sender === who && m.quoted?.pushName) {
      targetName = m.quoted.pushName
    }
    
    targetName = targetName || who.split('@')[0]
    
    let avatarInput = ICON_PATH

    
    try {
      const profileUrl = await conn.profilePictureUrl(who, 'image')
      if (profileUrl && profileUrl !== ICON_PATH) {
        const fetchFn = typeof fetch !== 'undefined' ? fetch : globalFetch
        const res = await fetchFn(profileUrl)
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer())
          tempAvatarPath = path.join(process.cwd(), `temp_avatar_${Date.now()}.jpg`)
          fs.writeFileSync(tempAvatarPath, buffer)
          avatarInput = tempAvatarPath
        }
      }
    } catch (e) {
      avatarInput = ICON_PATH
    }

    const img = await renderPreview(targetName, messageText, avatarInput)
    
    // Pulizia immediata del file temporaneo se esiste
    if (tempAvatarPath && fs.existsSync(tempAvatarPath)) {
      fs.unlinkSync(tempAvatarPath)
      tempAvatarPath = null
    }

    if (!img) return m.reply('Errore nella generazione dell\'anteprima')

    await conn.sendFile(m.chat, img, 'anteprima.png', '', m)
  } catch (e) {
    console.error('Errore handler screenshot:', e)
    // Assicurati di pulire il file anche in caso di errore interno
    if (tempAvatarPath && fs.existsSync(tempAvatarPath)) {
      try { fs.unlinkSync(tempAvatarPath) } catch {}
    }
    try { await m.reply('Errore: ' + (e.message || e)) } catch {}
  }
}

handler.tags = ['fun']
handler.command = ['screenshot']
export default handler
