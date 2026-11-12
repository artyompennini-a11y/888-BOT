/**
 * browserless.js - Helper unico per il rendering immagini via Browserless.
 * Pattern preso da fun-quote.js: POST html a chrome.browserless.io e
 * ritorna un Buffer. Token letto da global.browserless (config.js).
 */
import axios from 'axios'

export function browserlessAvailable() {
  return typeof global.browserless === 'string' && global.browserless.length > 0
}

export async function screenshot(html, {
  width = 1000,
  height = 600,
  type = 'jpeg',
  quality = 92,
  retries = 3,
  timeout = 20000
} = {}) {
  const token = global.browserless
  if (!token) throw new Error('Browserless key non configurata')

  let lastErr
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.post(
        `https://chrome.browserless.io/screenshot?token=${token}`,
        { html, options: { type, quality }, viewport: { width, height } },
        { responseType: 'arraybuffer', timeout }
      )
      return Buffer.from(data)
    } catch (e) {
      lastErr = e
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1500))
    }
  }
  throw lastErr
}
