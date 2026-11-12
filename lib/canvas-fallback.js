/**
 * canvas-fallback.js - Sostituzione definitiva di 'canvas' con Jimp + Browserless.
 * NON importa mai il pacchetto nativo 'canvas' (rompe Termux).
 * Ordine: 1) @napi-rs/canvas (opzionale, prebuilt) 2) jimp-fallback.js (pure-JS).
 */
let cached = null

export async function importCanvas() {
  if (cached) return cached
  // 1) Prova @napi-rs/canvas (binari prebuilt, ok su Termux se installato)
  try {
    const mod = await import('@napi-rs/canvas')
    const lib = mod?.createCanvas ? mod : mod?.default
    if (lib && typeof lib.createCanvas === 'function') {
      cached = lib
      return lib
    }
  } catch {}
  // 2) Fallback pure-JS Jimp (mai 'canvas' nativo!)
  try {
    const lib = await import('./jimp-fallback.js')
    cached = lib
    return lib
  } catch (e) {
    console.error('[canvas-fallback] jimp fallback fallito:', e?.message || e)
  }
  cached = { __placeholder: true, createCanvas: null, loadImage: null }
  return cached
}

export function canvasAvailable() {
  if (!cached) return false
  if (cached.__placeholder) return false
  return typeof cached.createCanvas === 'function'
}
