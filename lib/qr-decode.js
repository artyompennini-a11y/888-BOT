/**
 * qr-decode.js - Decodifica un QR da un buffer immagine (JPEG/PNG/WebP).
 * Jimp NON supporta WebP, quindi l'ordine è:
 *   1) @napi-rs/image  (supporta WebP/JPEG/PNG, binari prebuilt)
 *   2) node-webpmux    (WebP, puro JS)
 *   3) jimp            (JPEG/PNG)
 */
import jsQR from 'jsqr'

const isWebP = (buf) =>
  buf?.length >= 12 &&
  buf.subarray(0, 4).toString() === 'RIFF' &&
  buf.subarray(8, 12).toString() === 'WEBP'

async function viaNapi(buffer) {
  const { Image } = await import('@napi-rs/image')
  const img = new Image(buffer)
  const { width, height, data } = img.rgba()
  return jsQR(new Uint8ClampedArray(data), width, height)?.data || null
}

async function viaWebpmux(buffer) {
  const mod = await import('node-webpmux')
  const webp = mod.default || mod
  await webp.Image.initLib()
  const image = new webp.Image()
  await image.load(buffer)
  if (!image.loaded) return null
  const rgba = await image.getImageData()
  return jsQR(new Uint8ClampedArray(rgba), image.width, image.height)?.data || null
}

async function viaJimp(buffer) {
  const Jimp = (await import('jimp')).default
  const img = await Jimp.read(buffer)
  const { width, height, data } = img.bitmap
  return jsQR(new Uint8ClampedArray(data), width, height)?.data || null
}

export async function decodeQr(buffer) {
  if (!buffer?.length) return null
  if (isWebP(buffer)) {
    for (const fn of [viaNapi, viaWebpmux]) {
      try { const r = await fn(buffer); if (r) return r } catch {}
    }
    return null
  }
  for (const fn of [viaNapi, viaJimp]) {
    try { const r = await fn(buffer); if (r) return r } catch {}
  }
  return null
}