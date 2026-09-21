// Plugin by 888
//
// FOTO PROFILO DEL BOT — .setpp / .setppbot / .immagineprofilo
//
// Uso:
//   • rispondi a un'immagine con .setppbot  (funziona anche con i "visualizza una volta")
//   • oppure allega l'immagine al comando
//   • oppure passa un link: .setppbot https://esempio.com/foto.jpg
//
// La foto viene ritagliata al centro in formato quadrato, ridimensionata
// (max 640px) e convertita in JPEG. Compatibile con jimp v0.x e v1.x:
// nessuna dipendenza nativa, quindi funziona anche su Termux.

import fetch from 'node-fetch'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileTypeFromBuffer } from 'file-type'

const AVATAR_SIZE = 640
const JPEG_QUALITY = 92
const IMAGE_MIME = /^image\/(jpe?g|png|gif|bmp|tiff?|webp)$/i
const MEDIA_TYPES = /^(imageMessage|stickerMessage|documentMessage)$/
const URL_REGEX = /https?:\/\/[^\s"'<>]+/i

/** Errore "parlante": il messaggio viene mostrato all'utente così com'è */
class UserError extends Error {}

// ────────────────────────────────────────────────────────────────
//  Jimp — compatibile con la v0.x (API statica "legacy") e con
//  la v1.x (API modulare: mod.Jimp, resize/crop a oggetto, ...)
// ────────────────────────────────────────────────────────────────

let jimpContext = null

async function getJimp () {
  if (!jimpContext) {
    const mod = await import('jimp')
    const JimpClass = mod.Jimp || mod.default || mod

    jimpContext = {
      mod,
      JimpClass,
      legacy:
        typeof JimpClass.MIME_PNG === 'string' ||
        typeof JimpClass.FONT_SANS_16_WHITE !== 'undefined'
    }
  }

  return jimpContext
}

function bitmapSize (image) {
  const bitmap = image.bitmap || {}
  return {
    width: bitmap.width || image.width || 0,
    height: bitmap.height || image.height || 0
  }
}

function cropImage (ctx, image, x, y, w, h) {
  if (ctx.legacy) image.crop(x, y, w, h)
  else image.crop({ x, y, w, h })
  return image
}

function resizeImage (ctx, image, w, h) {
  if (ctx.legacy) image.resize(w, h)
  else image.resize({ w, h })
  return image
}

async function toJpegBuffer (ctx, image) {
  if (typeof image.getBufferAsync === 'function') {
    if (typeof image.quality === 'function') image.quality(JPEG_QUALITY)
    return image.getBufferAsync(ctx.JimpClass.MIME_JPEG || 'image/jpeg')
  }

  return image.getBuffer('image/jpeg', { quality: JPEG_QUALITY })
}

/** Ritaglio quadrato centrato + resize (mai ingrandito) + JPEG */
async function buildAvatar (buffer) {
  const ctx = await getJimp()
  const image = await ctx.JimpClass.read(buffer)
  const { width, height } = bitmapSize(image)

  if (!width || !height) throw new UserError('❌ Immagine non valida.')

  const side = Math.min(width, height)

  if (side < width || side < height) {
    cropImage(
      ctx,
      image,
      Math.floor((width - side) / 2),
      Math.floor((height - side) / 2),
      side,
      side
    )
  }

  const size = Math.min(AVATAR_SIZE, side)
  if (side !== size) resizeImage(ctx, image, size, size)

  return { buffer: await toJpegBuffer(ctx, image), size }
}

/** jimp v0 non legge il WEBP: lo converto con ffmpeg (già usato da lib/sticker.js) */
async function convertToPng (buffer, ext = 'webp') {
  const { default: ffmpeg } = await import('fluent-ffmpeg')

  const base = path.join(os.tmpdir(), `setpp_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  const input = `${base}.${ext}`
  const output = `${base}.png`

  await fs.promises.writeFile(input, buffer)

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(input)
        .on('error', reject)
        .on('end', resolve)
        .save(output)
    })

    return await fs.promises.readFile(output)
  } finally {
    await fs.promises.unlink(input).catch(() => {})
    await fs.promises.unlink(output).catch(() => {})
  }
}

// ────────────────────────────────────────────────────────────────
//  Da media scaricato → foto profilo quadrata JPEG
// ────────────────────────────────────────────────────────────────

async function avatarFromBuffer (buffer) {
  const detected = (await fileTypeFromBuffer(buffer)) || {}
  const mime = detected.mime || ''

  if (mime && !IMAGE_MIME.test(mime)) {
    throw new UserError(`❌ Il file non è un'immagine (${mime}).`)
  }

  try {
    return await buildAvatar(buffer)
  } catch (e) {
    if (e instanceof UserError) throw e

    // Sticker/WEBP: jimp v0 non li legge, jimp v1 sì → provo ffmpeg
    if (/webp/i.test(mime)) {
      try {
        return await buildAvatar(await convertToPng(buffer, detected.ext))
      } catch (conversionError) {
        console.warn('[setppbot] conversione webp fallita:', conversionError.message)
        throw new UserError('❌ Sticker non convertibile: rispondi a una foto JPG/PNG.')
      }
    }

    throw new UserError(`❌ Immagine non leggibile (${e.message}). Prova con un JPG o PNG.`)
  }
}

// ────────────────────────────────────────────────────────────────
//  Recupero dell'immagine: citata, allegata o da link
// ────────────────────────────────────────────────────────────────

function pickMedia (m) {
  const quoted = m.quoted

  if (quoted && quoted.mediaMessage && MEDIA_TYPES.test(quoted.mediaType || '')) return quoted
  if (m.mediaMessage && MEDIA_TYPES.test(m.mediaType || '')) return m

  return null
}

async function resolveImageBuffer (m, text) {
  const source = pickMedia(m)

  if (source) {
    const buffer = await source.download().catch(() => null)
    if (!buffer || !buffer.length) throw new UserError('❌ Non riesco a scaricare il media: riprova.')
    return buffer
  }

  // Media sì, ma non un'immagine (video/audio)
  const otherMedia = m.quoted?.mediaType || m.mediaType
  if (otherMedia && !MEDIA_TYPES.test(otherMedia)) {
    throw new UserError("❌ Questo non è un'immagine: rispondi a una foto (JPG/PNG).")
  }

  const url = String(text || '').match(URL_REGEX)?.[0]
  if (url) {
    const res = await fetch(url, { timeout: 20000 }).catch(() => null)
    if (!res || !res.ok) throw new UserError('❌ Link non raggiungibile o non valido.')

    const buffer = Buffer.from(await res.arrayBuffer())
    if (!buffer.length) throw new UserError("❌ Il link non contiene un'immagine.")

    return buffer
  }

  return null
}

// ────────────────────────────────────────────────────────────────
//  Permessi: il framework blocca già i non-owner (handler.owner),
//  qui controllo anche global.owner come rete di sicurezza.
// ────────────────────────────────────────────────────────────────

function isBotOwner (m, { isOwner, isROwner, isGab } = {}) {
  if (isOwner || isROwner || isGab) return true

  const senderJid = String(m.sender || '')
  const senderNumber = senderJid.replace(/\D/g, '')
  const owners = Array.isArray(global.owner) ? global.owner : []

  return owners.some((entry) => {
    const value = Array.isArray(entry) ? entry[0] : entry
    if (!value) return false

    const ownerNumber = String(value).replace(/\D/g, '')
    return Boolean(ownerNumber) && (ownerNumber === senderNumber || String(value) === senderJid)
  })
}

const handler = async (m, { conn, text, usedPrefix, command, isOwner, isROwner, isGab }) => {
  if (!isBotOwner(m, { isOwner, isROwner, isGab })) {
    return conn.sendMessage(m.chat, {
      text: '⛔ Comando riservato agli owner del bot.'
    }, { quoted: m })
  }

  const target = String(conn.user?.jid || conn.user?.id || '').replace(/:\d+@/, '@')
  if (!target.includes('@')) {
    return conn.sendMessage(m.chat, {
      text: '❌ Il bot non è ancora collegato a WhatsApp: riprova tra qualche secondo.'
    }, { quoted: m })
  }

  const react = (emoji) =>
    conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }).catch(() => {})

  await react('⏳')

  try {
    const raw = await resolveImageBuffer(m, text)

    if (!raw) {
      await react('❌')
      return conn.sendMessage(m.chat, {
        text: [
          '🖼️ *Imposta la foto profilo del bot*',
          '',
          `• Rispondi a un'immagine con *${usedPrefix + command}*`,
          `• Oppure allega la foto al comando *${usedPrefix + command}*`,
          `• Oppure usa un link: *${usedPrefix + command} https://esempio.com/foto.jpg*`
        ].join('\n')
      }, { quoted: m })
    }

    const { buffer, size } = await avatarFromBuffer(raw)

    try {
      await conn.updateProfilePicture(target, buffer)
    } catch (e) {
      // WhatsApp ri-processa la foto dentro Baileys, che usa jimp v0:
      // se nel progetto è installata la v1 l'update fallisce.
      const message = e.message || String(e)
      const jimpLikely = /jimp|ERR_REQUIRE_ESM|getBufferAsync|MIME_JPEG|Cannot read properties of undefined/i.test(message)
      console.error('[setppbot] updateProfilePicture:', message)

      throw new UserError(
        `❌ WhatsApp ha rifiutato la foto: ${message}\n💡 ` +
        (jimpLikely
          ? 'Causa probabile: versione di *jimp* incompatibile (Baileys usa la v0). Forza la v0 con: `npm i jimp@0.22.12`'
          : 'Se il problema è *jimp*, forza la v0 con: `npm i jimp@0.22.12`')
      )
    }

    await react('✅')
    return conn.sendMessage(m.chat, {
      image: buffer,
      caption: `✅ *Foto profilo del bot aggiornata!*\n📐 ${size}x${size} px · JPEG`
    }, { quoted: m })
  } catch (e) {
    console.error('[setppbot]', e.message || e)
    await react('❌')
    return conn.sendMessage(m.chat, {
      text: e instanceof UserError
        ? e.message
        : `❌ Errore durante l'aggiornamento della foto profilo:\n${e.message || e}`
    }, { quoted: m })
  }
}

handler.help = ['setppbot']
handler.tags = ['owner']
handler.command = /^(setpp|setppbot|immagineprofilo)$/i
handler.owner = true

export default handler
