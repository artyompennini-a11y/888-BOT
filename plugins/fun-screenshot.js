// Plugin by Elixir, Punisher & 888 Staff
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const ICON_PATH = path.join(process.cwd(), 'icone', 'Whatsapp.jpeg')

const isWin = process.platform === 'win32'
const FONT_FILES = isWin 
  ? [
      'C:\\Windows\\Fonts\\arial.ttf',
      'C:\\Windows\\Fonts\\segoeui.ttf'
    ]
  : [
      '/usr/share/fonts/truetype/ancient-scripts/Symbola_hint.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    ]

const FONT_FILE = FONT_FILES.find((f) => fs.existsSync(f)) || (isWin ? 'Arial' : 'sans-serif')

const normalizeText = (text) => {
  if (!text) return ''
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const escapeFfmpeg = (text) => {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
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

const renderPreview = async (name, message, profileUrl) => {
  const cleanName = normalizeText(name) || "Utente WhatsApp"
  const nameTxt = escapeFfmpeg(cleanName)
  
  const msgLines = wrapText(message, 34).slice(0, 10)
  const lineCount = msgLines.length

  const sanitizedFontPath = FONT_FILE.replace(/\\/g, '/').replace(/:/g, '\\:')
  const fontSpec = `fontfile='${sanitizedFontPath}'`

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
  `drawtext=${fontSpec}:` +
  `text='${nameTxt}':` +
  `fontcolor=white:` +
  `fontsize=${nameFontSize}:` +
  `x=390:` +
  `y=(main_h/2)-100,` +
  `${msgDrawtext}`

  const inputs = [ICON_PATH, profileUrl || ICON_PATH]
  const args = ['-y', '-i', inputs[0], '-i', inputs[1], '-filter_complex', filter, '-frames:v', '1', '-f', 'image2', 'pipe:1']

  const buf = await new Promise((resolve, reject) => {
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

  if (buf && buf.length) return buf
  throw new Error('Impossibile generare anteprima: ffmpeg drawtext fallito')
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    let who = null
    if (m.quoted?.sender) {
      who = m.quoted.sender
    } else if (Array.isArray(m.mentionedJid) && m.mentionedJid.length > 0) {
      who = m.mentionedJid[0]
    } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      who = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
    }

    if (!who) who = m.sender

    let messageText = args.join(' ').trim()

    if (!messageText && m.quoted) {
      messageText = m.quoted.text || m.quoted.caption || m.quoted.conversation || ''
    }

    messageText = messageText.replace(/^\s*@\+?[0-9]{4,}\s*/, '').replace(/^\s*@[^\s]+\s*/, '').trim()

    if (!messageText) {
      return conn.sendMessage(m.chat, {
        text: `⚠️ *Specifica il testo o tagga qualcuno!*\nUso: *${usedPrefix}${command}* @utente <testo>`,
      }, { quoted: m })
    }

    await conn.sendMessage(m.chat, { text: '⏳ Genero l\'anteprima...' }, { quoted: m })

    let targetName = null

    if (m.quoted && m.quoted.sender === who && m.quoted.pushName) {
      targetName = m.quoted.pushName
    }

    if (!targetName && who === m.sender && m.pushName) {
      targetName = m.pushName
    }

    if (!targetName && m.chat.endsWith('@g.us')) {
      try {
        const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
        if (groupMetadata?.participants) {
          const participant = groupMetadata.participants.find((p) => p.id === who)
          if (participant) {
            targetName = participant.notify || participant.name || participant.vname || null
          }
        }
      } catch {}
    }

    if (!targetName && conn.getName) {
      try {
        let fetchedName = await conn.getName(who)
        if (fetchedName && !fetchedName.includes('@') && !/^\d+$/.test(fetchedName.replace(/[\s+]/g, ''))) {
          targetName = fetchedName
        }
      } catch {}
    }

    if (!targetName || /^\d+$/.test(targetName.replace(/[\s+]/g, ''))) {
      if (who && who.includes('@')) {
        targetName = who.split('@')[0]
      } else {
        targetName = "Utente WhatsApp"
      }
    }

    let profileUrl = ICON_PATH
    try {
      profileUrl = await conn.profilePictureUrl(who, 'image')
    } catch {
      profileUrl = ICON_PATH
    }

    const img = await renderPreview(targetName, messageText, profileUrl)
    if (!img) throw new Error('Buffer immagine vuoto')

    await conn.sendMessage(m.chat, {
      image: img,
      caption: '',
      mimetype: 'image/png',
    }, { quoted: m })

  } catch (e) {
    console.error('[screenshot] Errore critico:', e)
    try {
      await conn.sendMessage(m.chat, { text: `❌ Errore: ${e.message || e}` }, { quoted: m })
    } catch {}
  }
}

handler.tags = ['fun']
handler.command = ['screenshot']
handler.group = false
handler.register = false

export default handler
