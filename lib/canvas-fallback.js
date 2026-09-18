import fs from 'fs'

let cached

export async function importCanvas() {
  if (cached) return cached

  // 1) Prefer @napi-rs/canvas (binari precompilati, veloce)
  try {
    const mod = await import('@napi-rs/canvas')
    const lib = mod.createCanvas ? mod : mod.default

    const emojiFont = [
      '/system/fonts/NotoColorEmoji.ttf',
      '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
    ].find((p) => fs.existsSync(p))

    if (emojiFont) lib.GlobalFonts.registerFromPath(emojiFont, 'NotoColorEmoji')

    cached = lib
    return lib
  } catch {}

  // 2) Fallback al pacchetto classico "canvas"
  try {
    const mod = await import('canvas')
    const lib = mod.createCanvas ? mod : mod.default
    cached = lib
    return lib
  } catch {}

  // 3) Nessun canvas disponibile: ritorna un "sentinel" di fallback.
  //    I plugin che usano importCanvas() devono gestire questo caso
  //    (es. inviare un messaggio testuale invece di un'immagine).
  cached = { __placeholder: true, createCanvas: null }
  return cached
}

export function canvasAvailable() {
  if (!cached) return false
  if (cached.__placeholder) return false
  return typeof cached.createCanvas === 'function'
}
