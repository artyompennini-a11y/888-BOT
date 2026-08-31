import jsQR from 'jsqr'
import webp from 'node-webpmux'

let inviteCache = {}
let lastCheck = {}

// Regex "non-global" così possiamo usare .test() senza problemi di lastIndex.
const WHATSAPP_LINK_REGEX = /(?:https?:\/\/)?(?:www\.|chat\.|api\.|business\.)?whatsapp\.com(?:\/channel)?\/[0-9A-Za-z_-]+/
const WA_ME_REGEX = /(?:https?:\/\/)?(?:www\.)?wa\.me\/[0-9+]+/
const WHATSAPP_DOMAIN_REGEX = /(?:chat\.|www\.)?whatsapp\.com|wa\.me/i

/**
 * Raccoglie in un'unica stringa tutto il testo (e gli URL) reperibile dal messaggio.
 * Fondamentale perché:
 *  - nelle "link preview" WhatsApp mette l'URL solo in msg.contextInfo.matchedText;
 *  - nei messaggi inoltrati il link può stare in externalAdReply / quoted text;
 *  - in un messaggio con @mention (bot taggato) il testo contiene il link, mentre un
 *    link "nudo" viene relegato nei campi contextInfo e m.text può risultare vuoto.
 */
function extractLinkText(m) {
  const chunks = []
  const add = (v) => { if (v && typeof v === 'string') chunks.push(v) }

  add(m.text)
  add(m.caption)

  const msg = m.msg
  if (msg && typeof msg === 'object') {
    add(msg.text)
    add(msg.conversation)
    add(msg.caption)
    add(msg.contentText)
    add(msg.canonicalUrl)
    const ci = msg.contextInfo
    if (ci) {
      add(ci.matchedText)
      add(ci.quotedText)
      const eat = ci.externalAdReply
      if (eat) {
        add(eat.sourceUrl)
        add(eat.url)
        add(eat.originalUrl)
        add(eat.canonicalUrl)
      }
    }
  }

  // Se è una risposta (quoted), prende in considerazione anche l'originale citato.
  // Il getter m.quoted può caricare il messaggio dal store: lo proteggiamo per non
  // far lanciare eccezioni e saltare la rilevazione.
  try {
    if (m.quoted) add(m.quoted.text)
  } catch {}

  return chunks.length ? chunks.join('\n') : ''
}

function isWebP(buffer) {
  return buffer?.length >= 12 &&
    buffer.subarray(0, 4).toString() === 'RIFF' &&
    buffer.subarray(8, 12).toString() === 'WEBP'
}

async function decodeQrFromWebpBuffer(buffer) {
  await webp.Image.initLib()
  const image = new webp.Image()
  await image.load(buffer)

  let rgba
  const width = image.width
  const height = image.height

  rgba = image.hasAnim
    ? await image.getFrameData(0)
    : await image.getImageData()

  if (!rgba || !width || !height) return null
  const qr = jsQR(rgba, width, height)
  return qr?.data || null
}

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (m.isBaileys && m.fromMe) return true
  if (!m.isGroup) return false

  const chat = global.db.data.chats[m.chat]
  if (!chat.antiLink || chat.isBanned) return true

  // Se admin/owner → bypass totale
  if (isAdmin) {
    console.log('🔒 Admin/Owner ha inviato un messaggio con link → bypass')
    return true
  }

  if (!isBotAdmin) return true

  const text = extractLinkText(m)
  const isWhatsAppLink = WHATSAPP_LINK_REGEX.test(text) || WA_ME_REGEX.test(text) || WHATSAPP_DOMAIN_REGEX.test(text)

  if (lastCheck[m.chat] && Date.now() - lastCheck[m.chat] < 3000) return true

  // ============================
  //        LINK NORMALI
  // ============================
  if (isWhatsAppLink) {

    lastCheck[m.chat] = Date.now()

    let thisGroupCode = inviteCache[m.chat]

    if (!thisGroupCode) {
      try {
        thisGroupCode = await conn.groupInviteCode(m.chat)
        inviteCache[m.chat] = thisGroupCode
        setTimeout(() => delete inviteCache[m.chat], 10 * 60 * 1000)
      } catch (e) {
        console.log('Errore invite:', e)
        return true
      }
    }

    if (thisGroupCode && text.toLowerCase().includes(thisGroupCode.toLowerCase())) return true

    // --- Cancella messaggio ---
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.sender
      }
    })

    let warningMessage = `🚫 𝐔𝐓𝐄𝐍𝐓𝐄 𝐄𝐒𝐏𝐔𝐋𝐒𝐎 𝐏𝐄𝐑 𝐋𝐈𝐍𝐊!\n\n`
    warningMessage += `👤 Utente: @${m.sender.split('@')[0]}\n`
    warningMessage += `📝 Motivo: Link whatsapp non consentito\n`
    warningMessage += `⚠️ Azione: Messaggio eliminato e utente espulso`

    await conn.sendMessage(m.chat, {
      text: warningMessage,
      contextInfo: { mentionedJid: [m.sender] }
    })

    // --- Controllo admin bot + admin utente ---
    const metadata = await conn.groupMetadata(m.chat)
    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net'

    const botIsAdmin = metadata.participants.some(p =>
      p.id === botNumber && (p.admin === 'admin' || p.admin === 'superadmin')
    )

    if (!botIsAdmin) {
      console.log('❌ Il bot non è admin, impossibile espellere.')
      return true
    }

    const targetIsAdmin = metadata.participants.some(p =>
      p.id === m.sender && (p.admin === 'admin' || p.admin === 'superadmin')
    )

    if (targetIsAdmin) {
      console.log('⚠️ Utente admin, non posso espellere.')
      return true
    }

    // --- Espulsione ---
    try {
      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
    } catch (e) {
      console.error('Errore durante espulsione:', e)
    }

    return false
  }

  // ============================
  //        QR CODE
  // ============================
  async function handleQrMedia(m, buffer, isSticker = false) {
    let qrText = null

    if (isSticker || isWebP(buffer)) {
      try {
        qrText = await decodeQrFromWebpBuffer(buffer)
      } catch (err) {
        console.log('Errore lettura sticker QR WebP:', err)
      }
    }

    if (!qrText) {
      try {
        let createCanvas, loadImage
        try {
          ({ createCanvas, loadImage } = await import('@napi-rs/canvas'))
        } catch {
          ({ createCanvas, loadImage } = await import('canvas'))
        }

        const img = await loadImage(buffer)
        const canvas = createCanvas(img.width, img.height)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const qr = jsQR(imageData.data, canvas.width, canvas.height)
        qrText = qr?.data || null
      } catch (e) {
        console.log('Errore lettura QR con canvas:', e)
      }
    }

    if (!qrText) return true

    const qrTextLower = qrText.toLowerCase()
    if (!qrTextLower.includes('chat.whatsapp.com') && !qrTextLower.includes('wa.me')) return true

    if (lastCheck[m.chat] && Date.now() - lastCheck[m.chat] < 3000) return true
    lastCheck[m.chat] = Date.now()

    let thisGroupCode = inviteCache[m.chat]
    if (!thisGroupCode) {
      try {
        thisGroupCode = await conn.groupInviteCode(m.chat)
        inviteCache[m.chat] = thisGroupCode
        setTimeout(() => delete inviteCache[m.chat], 10 * 60 * 1000)
      } catch (e) {
        console.log('Errore invite QR:', e)
        return true
      }
    }

    if (qrTextLower.includes(thisGroupCode)) return true

    // --- Cancella messaggio ---
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.sender
      }
    })

    let warningMessage = `🚫 𝐔𝐓𝐄𝐍𝐓𝐄 𝐄𝐒𝐏𝐔𝐋𝐒𝐎 𝐏𝐄𝐑 𝐐𝐑 𝐂𝐎𝐍 𝐋𝐈𝐍𝐊!\n\n`
    warningMessage += `👤 Utente: @${m.sender.split('@')[0]}\n`
    warningMessage += `📝 Motivo: QR con link whatsapp\n`
    warningMessage += `⚠️ Azione: Messaggio eliminato e utente espulso`

    await conn.sendMessage(m.chat, {
      text: warningMessage,
      contextInfo: { mentionedJid: [m.sender] }
    })

    // --- Controllo admin bot + admin utente ---
    const metadata = await conn.groupMetadata(m.chat)
    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net'

    const botIsAdmin = metadata.participants.some(p =>
      p.id === botNumber && (p.admin === 'admin' || p.admin === 'superadmin')
    )

    if (!botIsAdmin) {
      console.log('❌ Il bot non è admin, impossibile espellere.')
      return true
    }

    const targetIsAdmin = metadata.participants.some(p =>
      p.id === m.sender && (p.admin === 'admin' || p.admin === 'superadmin')
    )

    if (targetIsAdmin) {
      console.log('⚠️ Utente admin, non posso espellere.')
      return true
    }

    try {
      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
    } catch (e) {
      console.error('Errore espulsione QR:', e)
    }

    return false
  }

  if (m.mtype === 'imageMessage' || m.mtype === 'stickerMessage') {
    try {
      let buffer = await m.download()
      return await handleQrMedia(m, buffer, m.mtype === 'stickerMessage')
    } catch (e) {
      console.log('Errore QR:', e)
    }
  }

  return true
}

export const disabled = false
