// Plugin by elixir, punisher & 888 staff
import { importCanvas } from '../../lib/canvas-fallback.js'
import jsQR from 'jsqr'
import { createHash } from 'crypto'

const HASHES = new Set()
const HASH_MAX = 500

const PROMO_PATTERNS = [
  { id: 'telegram', label: 'Telegram', re: /(?:t\.me|telegram\.me|telegram\.dog|youtu\.be)/i },
  { id: 'canale', label: 'Canale/Gruppo', re: /(?:whatsapp\.com\/channel|chat\.whatsapp\.com|wa\.me|discord\.gg|discord\.com\/invite|t\.me\/)/i },
  { id: 'social', label: 'Social', re: /(?:instagram\.com|fb\.me|facebook\.com|tiktok\.com|youtu\.be|twitter\.com|x\.com|onlyfans)/i },
  { id: 'crypto', label: 'Crypto', re: /(?:binance|coinbase|bybit|withdraw\?|airdrop|giveaway|airdrop)/i }
]

const hash = (buf) => createHash('sha1').update(buf).digest('hex')

const toPng = async (buffer) => {
  try {
    const { default: Jimp } = await import('jimp')
    const img = await Jimp.read(buffer)
    return img.getBufferAsync(Jimp.MIME_PNG)
  } catch {
    return buffer
  }
}

const readQrFromImage = async (buffer) => {
  let lib
  try { lib = await importCanvas() } catch { return null }
  if (typeof lib.createCanvas !== 'function') return null

  try {
    const png = await toPng(buffer)
    const { createCanvas, Image } = lib
    const img = new Image()
    img.src = png
    const w = img.width
    const h = img.height
    if (!w || !h) return null
    const canvas = createCanvas(w, h)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    const data = ctx.getImageData(0, 0, w, h)
    const qr = jsQR(new Uint8ClampedArray(data.data), w, h)
    return qr?.data || null
  } catch (e) {
    return null
  }
}

const classify = (text) => {
  if (!text) return null
  const clean = String(text).trim()
  for (const p of PROMO_PATTERNS) {
    if (p.re.test(clean)) return { id: p.id, label: p.label, url: clean }
  }
  if (/^https?:\/\//i.test(clean)) return { id: 'link', label: 'Link', url: clean }
  return null
}

const deleteMsg = async (conn, m) => {
  try {
    await conn.sendMessage(m.chat, {
      delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.sender }
    })
  } catch {}
}

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
  try {
    if (m.fromMe) return true
    if (!m.isGroup) return false

    const chat = global.db?.data?.chats?.[m.chat]
    if (!chat || chat.isBanned) return true
    if (chat.antiraidlink !== true) return true

    if (isOwner || isROwner || isAdmin || !isBotAdmin) return true

    const isImage = /imageMessage/.test(m.mtype || '') || m.message?.imageMessage
    const isSticker = /stickerMessage/.test(m.mtype || '') || m.message?.stickerMessage
    if (!isImage || isSticker) return true

    let buffer = null
    try { buffer = await m.download() } catch { return true }
    if (!buffer?.length) return true

    const id = hash(buffer)
    if (HASHES.has(id)) return true
    if (HASHES.size >= HASH_MAX) HASHES.delete(HASHES.values().next().value)
    HASHES.add(id)

    const qrText = await readQrFromImage(buffer)
    if (!qrText) return true

    const hit = classify(qrText)
    if (!hit) return true

    await deleteMsg(conn, m)

    const action = chat.antiraidlinkPunish === 'ban' ? 'ban' : 'kick'
    let removed = false
    try {
      await conn.groupParticipantsUpdate(m.chat, [m.sender], action)
      removed = true
    } catch {}

    const warn = chat.antiraidlinkSilent === true
    if (!warn) {
      await conn.sendMessage(m.chat, {
        text:
`🚫 *ANTI-RAIDLINK*
━━━━━━━━━━━━━━━━━━━━━
⚠️ Ho trovato un QR promo in un'immagine.
🔗 Tipo: *${hit.label}*
🎯 Azione: *${action.toUpperCase()}*
${removed ? '✅ Utente rimosso' : '⚠️ Non sono riuscito a rimuoverlo'}
━━━━━━━━━━━━━━━━━━━━━
🔐 *888 SECURITY*`,
        contextInfo: { mentionedJid: [m.sender] },
        mentions: [m.sender]
      }).catch(() => {})
    }

    return false
  } catch (e) {
    console.error('[antiraidlink]', e?.message || e)
    return true
  }
}

const handler = m => m
handler.help = ['attiva antiraidlink']
handler.tags = ['anti']
handler.command = [/^antiraidlink$/i]

export default handler