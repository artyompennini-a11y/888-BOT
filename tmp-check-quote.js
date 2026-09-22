const fs = require('fs')
const path = 'c:/888-BOT/plugins/fun/fun-quote.js'
const s = fs.readFileSync(path, 'utf8')

const checks = [
  'import { createCanvas, loadImage } from \'@napi-rs/canvas\'',
  'import { sticker } from \'../../lib/sticker.js\'',
  'async function drawAvatar(',
  'await loadImage(buffer)',
  'function wrapText(',
  'async function generateQuoteCard(',
  'const handler = async (m,',
  'export default handler',
  'function applyRoundedCorners(',
  'function bitmapOf(',
  'function roundRectCoverage(',
  'function blendPixel(',
  'function fillRoundRect(',
  'function fillRect(',
  'function fillCircle(',
  'function fillGradientVertical('
]

let clean = true
console.log('=== occorrenze per definizione (deve essere 1) ===')
for (const c of checks) {
  let n = 0
  let pos = 0
  while (true) {
    const idx = s.indexOf(c, pos)
    if (idx === -1) break
    n++
    pos = idx + 1
  }
  const mark = (n === 1) ? '' : '  !!'
  console.log((n + mark).padStart(2).padEnd(4) + '  ' + c.slice(0, 60))
  if (n !== 1) clean = false
}

console.log('')
console.log('CLEAN (ogni definizione presente 1 volta):', clean ? 'SI' : 'NO')
console.log('bytes totali:', Buffer.byteLength(s, 'utf8'))
console.log('righe totali:', s.split('\n').length)

// leftovers from old broken code
;['getJimp','getFont','Jimp','canvas.loadImage?','canvas.loadImage(buffer)'].forEach(k => {
  const i = s.indexOf(k)
  if (i !== -1) console.warn('LEFTOVER REF:', k, 'at', i)
})

// end check
const endsClean = /^[ \t\r\n]*$/.test(s.slice(-4))
console.log('termina solo con whitespace/newline:', endsClean ? 'SI' : 'NO')
console.log('BOM:', s.charCodeAt(0) === 0xFEFF ? 'SI' : 'NO')
