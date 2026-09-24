import PhoneNumber from 'awesome-phonenumber'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import NodeCache from 'node-cache'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const __filename = fileURLToPath(import.meta.url)

const nameCache = global.nameCache || (global.nameCache = new NodeCache({ stdTTL: 600, useClones: false }));
const groupMetaCache = global.groupCache || (global.groupCache = new NodeCache({ stdTTL: 300, useClones: false }));
const errorThrottle = new Map();
const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
const lastLogCache = { jid: null, time: 0 };

export function ensureMessageUpdateListener(conn = { ev: null, user: {} }) {
  if (!conn?.ev || global.messageUpdateListenerSet) return
  conn.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      const key = update?.key
      if (!key?.remoteJid || !key?.id) continue
      if (update.update?.message?.editedMessage?.message) {
        try {
          const editedContainer = update.update.message.editedMessage
          let editedMessage = editedContainer?.message || editedContainer
          if (editedMessage?.message) editedMessage = editedMessage.message
          if (!editedMessage) continue

          let originalMsg = null
          try {
            if (global.store?.getMessage) {
              originalMsg = await global.store.getMessage(key)
            } else if (global.store?.loadMessage) {
              const jid = conn.decodeJid(key.remoteJid)
              originalMsg = await global.store.loadMessage(jid, key.id)
            }
          } catch {}

          const participant = key.participant || originalMsg?.key?.participant || originalMsg?.participant || key.remoteJid
          const fakeMsg = {
            key: {
              ...key,
              participant,
              fromMe: false,
            },
            message: editedMessage,
            messageTimestamp: originalMsg?.messageTimestamp || update.update?.timestamp || update.update?.messageTimestamp,
            pushName: originalMsg?.pushName,
            broadcast: originalMsg?.broadcast,
          }

          if (typeof conn.handler === 'function') {
            await conn.handler({ messages: [fakeMsg], type: 'notify' })
          }
        } catch {}
        continue
      }
      if (update.update?.message === null) {
        continue
      }
    }
  })
  global.messageUpdateListenerSet = true
}

async function isUserAdmin(conn, chatId, userJid) {
  try {
    const metadata = await conn.groupMetadata(chatId)
    if (!metadata?.participants) return false
    const userId = conn.decodeJid(userJid)
    return metadata.participants.some(p => {
      const pid = conn.decodeJid(p.jid || p.id)
      return pid === userId && (p.admin === 'admin' || p.admin === 'superadmin')
    })
  } catch (e) {
    console.log('isUserAdmin error:', e)
    return false
  }
}

export default async function (m, conn = { user: {} }) {
  ensureMessageUpdateListener(conn)

  if (!m || !m.sender || !m.chat) return

  m.sender = conn.decodeJid(m.sender) || 'unknown@s.whatsapp.net';
  m.chat = conn.decodeJid(m.chat || '') || 'unknown@g.us';

  const protocolType = m?.message?.protocolMessage?.type
  const hasEditedMessage = !!(m?.message?.editedMessage || m?.message?.protocolMessage?.editedMessage || m?.message?.protocolMessage?.editedMessage?.message)
  const isEdit = hasEditedMessage || protocolType === 'MESSAGE_EDIT' || protocolType === 14
  const isDelete = m?.messageStubType === 68 || protocolType === 'REVOKE' || protocolType === 0
  if (isEdit || isDelete) return

  if (!m || m.key?.fromMe) return

  try {
    const senderJid = conn.decodeJid(m.sender)
    const chatJid = conn.decodeJid(m.chat || '')
    const botJid = conn.decodeJid(conn.user?.jid)

    if (!chatJid) {
      console.warn('chatJid is undefined, skipping print');
      return;
    }

    const getName = async (jid) => {
      if (!jid || typeof jid !== 'string') return 'Sconosciuto';

      let cached = nameCache.get(jid);
      if (cached) return cached;

      if (jid.endsWith('@newsletter')) {
        cached = 'Newsletter ' + jid.split('@')[0];
      } else if (jid.endsWith('@g.us')) {
        const meta = groupMetaCache.get(jid);
        cached = meta?.subject || '';
      }

      if (!cached) {
        const c = conn.contacts?.[jid] || global.store?.contacts?.[jid];
        cached = c?.notify || c?.name || '';
        if (!cached) {
          cached = await conn.getName(jid) || '';
        }
      }

      if (cached) nameCache.set(jid, cached);
      return cached || (jid.endsWith('@g.us') ? 'Chat Sconosciuta' : '');
    };

    const _name = await getName(senderJid);
    const sender = formatPhoneNumber(senderJid, _name);
    const chat = await getName(chatJid) || 'Chat Sconosciuta';

    const me = formatPhoneNumber(botJid || '', conn.user?.name || 'Bot')
    const now = Date.now();
    if (lastLogCache.jid === senderJid && now - lastLogCache.time < 1000) return;
    lastLogCache.jid = senderJid;
    lastLogCache.time = now;

    const isBot = senderJid === botJid

    const isOwner = global.isOwnerNumber(senderJid)

    const isGroup = chatJid.endsWith('@g.us');

    let groupMeta = null;
    if (isGroup) {
      try {
        groupMeta = groupMetaCache.get(chatJid);
        if (!groupMeta) {
          groupMeta = await conn.groupMetadata(chatJid);
          if (groupMeta) {
            groupMeta.fetchTime = Date.now();
            groupMetaCache.set(chatJid, groupMeta);
          }
        }
      } catch (e) {
        throttleError('Errore nel recupero dei metadati del gruppo:', e.message, 5000);
      }
    }

    const isAdmin = isGroup ? await isUserAdmin(conn, chatJid, senderJid) : false;
    const isBanned = global.DATABASE?.data?.users?.[senderJid]?.banned || false;
    const user = global.DATABASE?.data?.users?.[senderJid] || { exp: '?', diamonds: '?', level: '¿', '888coin': '?', bank: '?' }
    const filesize = getFileSize(m)
    const ts = formatTimestamp(m.messageTimestamp)
    const messageAge = getMessageAge(m.messageTimestamp)
    const c = getColorScheme()

    const topBorder = chalk.hex('#9b5bff')('─'.repeat(16)) +
                      chalk.hex('#4fd3ff')(' 888 BOT ') +
                      chalk.hex('#9b5bff')('─'.repeat(17));

    const bottomBorder = chalk.hex('#9b5bff')('─'.repeat(41));

    const righe = [
      topBorder,
      `${c.label('BOT')} ⇢ ${c.text(me)}`,
      `${c.label('ORARIO')} ⇢ ${c.text(ts)}${messageAge ? ` ${c.gray(`⟨${messageAge}⟩`)}` : ''}`,
      `${c.label('UTENTE')} ⇢ ${c.text(sender)}${(isGroup || isBot) ? ` ${c.gray('⟡ ' + getUserStatus(isBot, isOwner, isAdmin, isBanned, c))}` : ''}`,
      `${c.label('CHAT')} ⇢ ${c.text(chat)}${isGroup ? c.gray(' ⦿ GRUPPO') : c.gray(' ◉ PRIVATO')}`,
      `${c.label('TIPO')} ⇢ ${c.text(formatType(m))}${getMessageFlags(m, c)}`
    ]

    if (filesize) {
      righe.push(`${c.label('DIMENSIONE')} ⇢ ${c.text(formatSize(filesize))}`)
    }

    const commandText = getCommandText(m)
    if (commandText) {
      righe.push(`${c.label('CMD')} ⇢ ${c.text(commandText)}`)
    }

    if (isGroup) {
      const participantCount = groupMeta?.participants?.length || '?'
      righe.push(`${c.label('MEMBRI')} ⇢ ${c.text(participantCount)}`)
    }

    if (m.quoted) {
      const quotedSenderJid = conn.decodeJid(m.quoted.sender || m.quoted.participant)
      let qname = nameCache.get(quotedSenderJid);
      if (!qname) {
        qname = await conn.getName(quotedSenderJid) || 'Utente';
        nameCache.set(quotedSenderJid, qname);
      }
      const qtype = formatType(m.quoted)
      righe.push(`${c.label('Risposta a')} ⇢ ${c.text(qname)} ${c.secondary('(')}${c.meta(qtype)}${c.secondary(')')}`)
    }

    if (m.forwarded) {
      righe.push(`${c.label('Inoltrato')} ⇢ ${c.text('Sì')}`)
    }

    if (m.broadcast) {
      righe.push(`${c.label('Broadcast')} ⇢ ${c.text('Sì')}`)
    }

    righe.push(bottomBorder)

    console.log('\n' + righe.join('\n'))

    const logText = await formatText(m, conn)
    if (logText?.trim()) console.log(logText)

    if (m.messageStubParameters && Array.isArray(m.messageStubParameters)) {
      const decoded = m.messageStubParameters.map(jid =>
        chalk.gray(formatPhoneNumber(conn.decodeJid(jid), ''))
      ).join(', ')
      if (decoded.trim()) console.log(decoded)
    }

    logMessageSpecifics(m, c)

    if (m.reactions && m.reactions.length > 0) {
      const reactions = m.reactions.map(r => `${r.text} (${r.count})`).join(', ')
      console.log(`${c.secondary('REAZIONI:')} ${c.text(reactions)}`)
    }

    if (m.editedTimestamp) {
      const editTime = new Date(m.editedTimestamp * 1000).toLocaleTimeString('it-IT')
      console.log(`${c.secondary('MODIFICATO:')} ${c.text(editTime)}`)
    }

  } catch (error) {
    throttleError('Errore in print.js:', error.message, 5000);
  }
}

function logMessageSpecifics(m, c) {
  try {
    const mtype = m.mtype || ''

    if (mtype === 'locationMessage' || mtype === 'liveLocationMessage') {
      const lat = m.msg?.degreesLatitude
      const lng = m.msg?.degreesLongitude
      if (lat != null && lng != null) {
        console.log(`${c.secondary('POSIZIONE')} ⇢ ${c.text(`${lat}, ${lng}`)}`)
      }
      return
    }

    if (mtype === 'contactMessage' || mtype === 'contactsArrayMessage') {
      const displayName = m.msg?.displayName || (m.msg?.contacts?.map(x => x.displayName).join(', '))
      if (displayName) {
        console.log(`${c.secondary('CONTATTO')} ⇢ ${c.text(displayName)}`)
      }
      return
    }

    if (mtype === 'audioMessage') {
      const duration = m.msg?.seconds
      if (duration != null) {
        console.log(`${c.secondary('DURATA')} ⇢ ${c.text(formatDuration(duration))}`)
      }
      const isPtt = !!m.msg?.ptt
      console.log(`${c.secondary('TIPO AUDIO')} ⇢ ${c.text(isPtt ? 'Vocale' : 'Audio')}`)
      return
    }

    if (mtype === 'videoMessage') {
      const duration = m.msg?.seconds
      if (duration != null) {
        console.log(`${c.secondary('DURATA')} ⇢ ${c.text(formatDuration(duration))}`)
      }
      if (m.msg?.gifPlayback) {
        console.log(`${c.secondary('GIF')} ⇢ ${c.text('Sì')}`)
      }
      return
    }

    if (mtype === 'stickerMessage') {
      if (m.msg?.isAnimated) {
        console.log(`${c.secondary('STICKER')} ⇢ ${c.text('Animato')}`)
      }
      return
    }

    if (mtype === 'pollCreationMessage' || mtype === 'pollCreationMessageV2' || mtype === 'pollCreationMessageV3') {
      const name = m.msg?.name
      const options = m.msg?.options?.map(o => o.optionName).join(', ')
      if (name) console.log(`${c.secondary('SONDAGGIO')} ⇢ ${c.text(name)}`)
      if (options) console.log(`${c.secondary('OPZIONI')} ⇢ ${c.text(options)}`)
      return
    }

    if (mtype === 'buttonsMessage' || mtype === 'templateMessage' || mtype === 'interactiveMessage' || mtype === 'listMessage') {
      console.log(`${c.secondary('INTERATTIVO')} ⇢ ${c.text(mtype.replace(/Message/gi, ''))}`)
      return
    }
  } catch {}
}

async function formatText(m, conn) {
  const c = getColorScheme();

  const rawText = (m.text || m.caption || '').toString();
  if (!rawText.trim()) return '';

  let text = rawText.replace(/\s+/g, ' ').trim();
  if (text.length > 500) {
    text = text.slice(0, 500) + '…';
  }

  const urls = text.match(urlRegex) || [];

  let out = '';
  out += `${c.secondary('MESSAGGIO')} ⇢ ${c.text(text)}`;

  if (urls.length) {
    out += '\n' + `${c.secondary('URL')} ⇢ ${c.text(urls.join(', '))}`;
  }

  return out;
}

function throttleError(message, error, delay) {
  const key = message + error;
  const now = Date.now();
  const lastTime = errorThrottle.get(key);
  if (!lastTime || now - lastTime > delay) {
    console.error(chalk.red(message), error);
    errorThrottle.set(key, now);
    if (errorThrottle.size > 50) {
      const oldestKey = errorThrottle.keys().next().value;
      errorThrottle.delete(oldestKey);
    }
  }
}

function formatPhoneNumber(jid, name) {
  if (!jid || typeof jid !== 'string') return 'Sconosciuto';

  if (jid.endsWith('@newsletter')) {
    return `Newsletter: ${jid.split('@')[0]}${name ? ` ~${name}` : ''}`;
  }

  let userPart = jid.split('@')[0] || '';
  let cleanNumber = userPart.split(':')[0] || '';

  try {
    const number = PhoneNumber('+' + cleanNumber).getNumber('international');
    return number + (name ? ` ~${name}` : '');
  } catch {
    return (cleanNumber || 'Sconosciuto') + (name ? ` ~${name}` : '');
  }
}

function getFileSize(m) {
  return m.msg?.fileLength ||
         m.msg?.fileSha256?.length ||
         m.text?.length ||
         m.caption?.length ||
         0
}

function formatTimestamp(timestamp) {
  const date = timestamp ? new Date(timestamp * 1000) : new Date()
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function getMessageAge(timestamp) {
  if (!timestamp) return ''
  const now = Date.now() / 1000
  const sec = now - timestamp
  if (sec < 60) return `${Math.floor(sec)}s fa`
  if (sec < 3600) return `${Math.floor(sec / 60)}m fa`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h fa`
  return ''
}

function getColorScheme() {
  const violet = color => chalk.hex(color)
  return {
    label: violet('#6349d8ff').bold,
    text: violet('#ffffffff'),
    secondary: violet('#6944ceff'),
    meta: violet('#5f40ceff'),
    bright: violet('#7247e7ff'),
    bold: chalk.bold,
    italic: chalk.italic,
    white: chalk.whiteBright,
    gray: chalk.gray,
    cyan: chalk.cyanBright,
    magenta: chalk.magentaBright,
    blue: chalk.blueBright,
    green: chalk.greenBright,
    red: chalk.redBright,
    yellow: chalk.yellowBright,
    background: chalk.bgMagentaBright,
    info: violet('#F8F8FF'),
    warning: violet('#FFB6C1'),
    error: violet('#FF6347'),
    success: violet('#a298fbff')
  }
}

function formatType(m) {
  return (m.mtype || 'unknown').replace(/Message/gi, '')
}

function getUserStatus(isBot, isOwner, isAdmin, isBanned, c) {
  let status = []
  if (isBot) status.push(c.blue('🤖 BOT'))
  if (isOwner) status.push(c.success('👑 OWNER'))
  if (isAdmin) status.push(c.warning('ADMIN'))
  if (isBanned) status.push(c.error('🚫 BANNATO'))
  return status.length ? `${status.join(' • ')}` : c.text('User')
}

function getMessageFlags(m, c) {
  let flags = []
  if (m.isCommand) flags.push(c.label('COMANDO:'))
  if (m.quoted) flags.push(c.meta('MESSAGGIO IN RISPOSTA'))
  return flags.length ? ` ${c.secondary('•')} ${flags.join(' ')}` : ''
}

function getCommandText(m) {
  if (!m.text && !m.caption) return ''
  const text = (m.text || m.caption || '').trim()
  if (!text) return ''
  const prefixes = ['.', '!', '/', '#', '$', '%', '&', '*', '-', '+', '=', '?', '@']
  let command = ''
  for (const prefix of prefixes) {
    if (text.startsWith(prefix)) {
      const withoutPrefix = text.slice(prefix.length)
      command = withoutPrefix.split(' ')[0]
      break
    }
  }
  if (!command && text.includes(' ')) {
    const firstWord = text.split(' ')[0]
    if (firstWord && (firstWord.startsWith('.') || firstWord.startsWith('!'))) {
      command = firstWord.slice(1)
    }
  }
  return command || ''
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)) + ' ' + sizes[i]
}

function formatDuration(sec) {
  if (typeof sec !== 'number' || isNaN(sec) || sec < 0) return ''
  const hours = Math.floor(sec / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  const seconds = Math.floor(sec % 60)
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
