// Plugin by Elixir
import fetch from 'node-fetch'

const quotes = [
  "\"La vita è ciò che ti succede mentre sei impegnato a fare altri piani.\" — John Lennon",
  "\"Chi non rischiando non rosica.\" — Proverbio italiano",
  "\"Il vero viaggiatore è colui che prende il treno numero 9 e in una città che non ha mai visitato.\" — Bill Bryson",
  "\"Non preoccuparti e fatti sotto.\" — Niente panico",
  "\"Sì, va bene, ma tu riflettono su questo.\" — Sarcasmo quotidiano",
  "\"Il tempo è relativo, ha solo senso se la cucina è vuota.\" — Einstein (presunto)",
  "\"C'è due modi per scrivere errori senza errori.\" — Tony Hoare",
  "\"Prima della programmazione, c'è solo la programmazione.\" — Lloyd Bock",
  "\"640K dovrebbe essere abbastanza per chiunque.\" — Bill Gates (forse)",
  "\"La scienza non è altro che la percezione.\" — Zen proverbio",
  "\"La speranza è la cosa con le wing.\" — Emily Dickinson",
  "\"Le cose moverse sono quelle che ti mantengono in movimento.\" — Albert Einstein"
]

const CARD_W = 500
const CARD_H = 220
const PADDING = 30
const AVATAR_SIZE = 160
const AVATAR_X = PADDING
const AVATAR_Y = PADDING
const TEXT_X = PADDING + AVATAR_SIZE + 30
const TEXT_Y = PADDING + 30
const TEXT_MAX_WIDTH = CARD_W - TEXT_X - PADDING

const GRADIENT_START = [138, 43, 226]
const GRADIENT_END = [135, 206, 250]

let jimpCtx = null
const jimpFontCache = new Map()

async function getJimp() {
  if (jimpCtx) return jimpCtx
  const mod = await import('jimp')
  const JimpClass = mod.Jimp || mod.default || mod
  const legacy = typeof JimpClass.FONT_SANS_16_WHITE !== 'undefined' || typeof JimpClass.MIME_PNG === 'string'
  jimpCtx = { mod, JimpClass, legacy }
  return jimpCtx
}

function nearestFontSize(sizes, wanted) {
  return sizes.slice().sort((a, b) => Math.abs(a - wanted) - Math.abs(b - wanted) || b - a)[0]
}

async function getFont(size) {
  const cacheKey = String(size)
  if (jimpFontCache.has(cacheKey)) return jimpFontCache.get(cacheKey)
  const { mod, JimpClass, legacy } = await getJimp()
  let font
  if (legacy) {
    const sizes = [8, 10, 12, 14, 16, 32, 64, 128].filter(s => JimpClass[`FONT_SANS_${s}_WHITE`] !== undefined)
    const target = nearestFontSize(sizes, size)
    font = await JimpClass.loadFont(JimpClass[`FONT_SANS_${target}_WHITE`])
  } else {
    const fonts = await import('jimp/fonts')
    const sizes = Object.keys(fonts).filter(k => /^SANS_\d+_WHITE$/.test(k)).map(k => parseInt(k.slice(5), 10))
    const target = nearestFontSize(sizes, size)
    font = await mod.loadFont(fonts[`SANS_${target}_WHITE`])
  }
  jimpFontCache.set(cacheKey, font)
  return font
}

function textWidth(ctx, font, text) {
  const measure = ctx.JimpClass.measureText || ctx.mod.measureText
  if (typeof measure === 'function') return measure(font, String(text))
  return String(text).length * 10
}

function newImage(ctx, width, height, color) {
  return ctx.legacy ? new ctx.JimpClass(width, height, color) : new ctx.JimpClass({ width, height, color })
}

function bitmapOf(image) {
  const b = image.bitmap
  return { data: b.data, width: b.width || image.width, height: b.height || image.height }
}


function roundRectCoverage(x, y, width, height, radius) {
  if (radius <= 0) return 1
  const cx = Math.min(Math.max(x + 0.5, radius), width - radius)
  const cy = Math.min(Math.max(y + 0.5, radius), height - radius)
  const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
  return Math.max(0, Math.min(1, radius - dist + 0.5))
}

function fillRoundRect(image, boxX, boxY, width, height, radius, rgba) {
  const { data, width: imgW, height: imgH } = bitmapOf(image)
  for (let y = 0; y < height; y++) {
    const py = boxY + y
    if (py < 0 || py >= imgH) continue
    for (let x = 0; x < width; x++) {
      const px = boxX + x
      if (px < 0 || px >= imgW) continue
      const coverage = roundRectCoverage(x, y, width, height, radius)
      if (coverage <= 0) continue
      blendPixel(data, ((py * imgW) + px) << 2, rgba, (rgba[3] / 255) * coverage)
    }
  }
  return image
}

function fillRect(image, x, y, width, height, rgba) {
  return fillRoundRect(image, x, y, width, height, 0, rgba)
}

function fillCircle(image, centerX, centerY, radius, rgba) {
  const { data, width: imgW, height: imgH } = bitmapOf(image)
  const startX = Math.max(0, Math.floor(centerX - radius))
  const endX = Math.min(imgW - 1, Math.ceil(centerX + radius))
  const startY = Math.max(0, Math.floor(centerY - radius))
  const endY = Math.min(imgH - 1, Math.ceil(centerY + radius))
  for (let py = startY; py <= endY; py++) {
    for (let px = startX; px <= endX; px++) {
      const dist = Math.hypot(px + 0.5 - centerX, py + 0.5 - centerY)
      const coverage = Math.max(0, Math.min(1, radius - dist + 0.5))
      if (coverage <= 0) continue
      blendPixel(data, ((py * imgW) + px) << 2, rgba, (rgba[3] / 255) * coverage)
    }
  }
  return image
}

function fillGradientVertical(image, startColor, endColor) {
  const { data, width, height } = bitmapOf(image)
  for (let y = 0; y < height; y++) {
    const t = y / height
    const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * t)
    const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * t)
    const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * t)
    for (let x = 0; x < width; x++) {
      const idx = ((y * width) + x) << 2
      data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255
    }
  }
  return image
}

function applyRoundedCorners(image, radius) {
  const { data, width, height } = bitmapOf(image)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const coverage = roundRectCoverage(x, y, width, height, radius)
      if (coverage >= 1) continue
      const idx = ((y * width) + x) << 2
      data[idx + 3] = Math.round(data[idx + 3] * coverage)
    }
  }
  return image
}

async function toPngBuffer(ctx, image) {
  if (typeof image.getBufferAsync === 'function') return image.getBufferAsync(ctx.JimpClass.MIME_PNG || 'image/png')
  return image.getBuffer('image/png')
}

async function drawAvatar(ctx, card, avatarUrl, x, y, size) {
  let avatarImg
  try {
    const response = await fetch(avatarUrl)
    const buffer = Buffer.from(await response.arrayBuffer())
    avatarImg = await ctx.JimpClass.read(buffer)
  } catch {
    avatarImg = newImage(ctx, size, size, 0x888888FF)
  }
  
  const scale = size / Math.max(avatarImg.width, avatarImg.height)
  const newW = Math.round(avatarImg.width * scale)
  const newH = Math.round(avatarImg.height * scale)
  if (avatarImg.resize) avatarImg.resize(newW, newH)
  
  const squareSize = Math.max(newW, newH)
  const square = newImage(ctx, squareSize, squareSize, 0x00000000)
  const src = bitmapOf(avatarImg)
  const dst = bitmapOf(square)
  const offX = Math.floor((squareSize - newW) / 2)
  const offY = Math.floor((squareSize - newH) / 2)
  
  for (let py = 0; py < newH; py++) {
    for (let px = 0; px < newW; px++) {
      const si = ((py * newW) + px) << 2
      const di = (((py + offY) * squareSize) + (px + offX)) << 2
      dst.data[di] = src.data[si]; dst.data[di + 1] = src.data[si + 1]; dst.data[di + 2] = src.data[si + 2]; dst.data[di + 3] = src.data[si + 3]
    }
  }
  
  fillCircle(square, squareSize / 2, squareSize / 2, squareSize / 2 - 2, [255, 255, 255, 255])
  
  const cd = bitmapOf(card)
  for (let py = 0; py < squareSize; py++) {
    for (let px = 0; px < squareSize; px++) {
      const si = ((py * squareSize) + px) << 2
      if (dst.data[si + 3] === 0) continue
      const dx = x + px - squareSize / 2 + newW / 2
      const dy = y + py - squareSize / 2 + newH / 2
      if (dx < 0 || dx >= CARD_W || dy < 0 || dy >= CARD_H) continue
      const di = ((dy * CARD_W) + dx) << 2
      cd.data[di] = dst.data[si]; cd.data[di + 1] = dst.data[si + 1]; cd.data[di + 2] = dst.data[si + 2]; cd.data[di + 3] = dst.data[si + 3]
    }
  }
  return card
}

function wrapText(text, maxWidth, font, ctx) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''
  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word
    const w = textWidth(ctx, font, testLine)
    if (w > maxWidth && currentLine) { lines.push(currentLine); currentLine = word }
    else currentLine = testLine
  }
  if (currentLine) lines.push(currentLine)
  return lines
}
function blendPixel(data, index, rgb, alpha) {
  if (alpha <= 0) return
  const dstAlpha = data[index + 3] / 255
  const outAlpha = alpha + dstAlpha * (1 - alpha)
  if (outAlpha <= 0) { data[index + 3] = 0; return }
  for (let c = 0; c < 3; c++) data[index + c] = Math.round((rgb[c] * alpha + data[index + c] * dstAlpha * (1 - alpha)) / outAlpha)
  data[index + 3] = Math.round(outAlpha * 255)
}

const quotes = [
  "\"La vita è ciò che ti succede mentre sei impegnato a fare altri piani.\" — John Lennon",
  "\"Chi non rischiando non rosica.\" — Proverbio italiano",
  "\"Il vero viaggiatore è colui che prende il treno numero 9 e in una città che non ha mai visitato.\" — Bill Bryson",
  "\"Non preoccuparti e fatti sotto.\" — Niente panico",
  "\"Sì, va bene, ma tu riflettono su questo.\" — Sarcasmo quotidiano",
  "\"Il tempo è relativo, ha solo senso se la cucina è vuota.\" — Einstein (presunto)",
  "\"C'è due modi per scrivere errori senza errori.\" — Tony Hoare",
  "\"Prima della programmazione, c'è solo la programmazione.\" — Lloyd Bock",
  "\"640K dovrebbe essere abbastanza per chiunque.\" — Bill Gates (forse)",
  "\"La scienza non è altro che la percezione.\" — Zen proverbio",
  "\"La speranza è la cosa con le wing.\" — Emily Dickinson",
  "\"Le cose moverse sono quelle che ti mantengono in movimento.\" — Albert Einstein"
];
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 220;
const PADDING = 30;
const AVATAR_SIZE = 160;
const GRADIENT_COLORS = {
  start: { r: 138, g: 43, b: 226 },
  end: { r: 135, g: 206, b: 250 }
};
function createLinearGradient(ctx, x, y, width, height, colorStart, colorEnd) {
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, `rgb(${colorStart.r}, ${colorStart.g}, ${colorStart.b})`);
  gradient.addColorStop(1, `rgb(${colorEnd.r}, ${colorEnd.g}, ${colorEnd.b})`);
  return gradient;
}
function drawCircularAvatar(ctx, image, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, x - 20, y - 20, size + 40, size + 40);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 2, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();
}
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
async function generateQuoteCard(imageUrl, messageText, senderName) {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.filter = 'blur(2px)';
  const gradient = createLinearGradient(ctx, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, GRADIENT_COLORS.start, GRADIENT_COLORS.end);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  for (let i = 0; i < 50; i++) {
    ctx.fillRect(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, 2, 2);
  }
  let avatarBuffer;
  try {
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    avatarBuffer = buffer;
  } catch (e) {
    const fallbackCanvas = createCanvas(AVATAR_SIZE, AVATAR_SIZE);
    const fallbackCtx = fallbackCanvas.getContext('2d');
    fallbackCtx.fillStyle = '#888888';
    fallbackCtx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
    avatarBuffer = fallbackCanvas.toBuffer('image/png');
  }
  const avatarImage = await createImageBitmap(avatarBuffer);
  drawCircularAvatar(ctx, avatarImage, PADDING, PADDING, AVATAR_SIZE);
  const textStartX = PADDING + AVATAR_SIZE + 30;
  const textMaxWidth = CANVAS_WIDTH - textStartX - PADDING;
  const textStartY = PADDING + 30;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(senderName || 'Utente', textStartX, textStartY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(textStartX, textStartY + 28);
  ctx.lineTo(CANVAS_WIDTH - PADDING, textStartY + 28);
  ctx.stroke();
  const messageLines = wrapText(ctx, messageText, textMaxWidth);
  const lineHeight = 26;
  let currentY = textStartY + 40;
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px Arial';
  ctx.textBaseline = 'top';
  for (const line of messageLines.slice(0, 6)) {
    if (currentY + 30 > CANVAS_HEIGHT - PADDING) break;
    ctx.fillText(line, textStartX, currentY);
    currentY += lineHeight;
  }
  if (messageLines.length > 6) ctx.fillText('...', textStartX, currentY);
  const cornerRadius = 15;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(CANVAS_WIDTH - cornerRadius, 0);
  ctx.quadraticCurveTo(CANVAS_WIDTH, 0, CANVAS_WIDTH, cornerRadius);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - cornerRadius);
  ctx.quadraticCurveTo(CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_WIDTH - cornerRadius, CANVAS_HEIGHT);
  ctx.lineTo(cornerRadius, CANVAS_HEIGHT);
  ctx.quadraticCurveTo(0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT - cornerRadius);
  ctx.lineTo(0, cornerRadius);
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
  ctx.closePath();
  ctx.stroke();
  return canvas.toBuffer('image/png');
}
const handler = async (m, { conn, text, usedPrefix, command, quoted, isGroup }) => {
  try {
    if (quoted) {
      const from = quoted.sender || m.sender;
      const messageText = quoted.text || quoted.body || '';
      if (!messageText || messageText.trim() === '') {
        return m.reply('❌ Il messaggio selezionato non contiene testo.');
      }
      let pfpUrl = '';
      try {
        pfpUrl = await conn.profilePictureUrl(from);
      } catch (e) {
        try {
          pfpUrl = await conn.profilePictureUrl(m.chat);
        } catch (e2) {
          pfpUrl = '';
        }
      }
      let displayName = 'Utente';
      try {
        if (isGroup) {
          const metadata = await conn.groupMetadata(m.chat);
          const participant = metadata.participants.find(p => p.id === from);
          if (participant) displayName = participant.name || 'Utente';
        } else {
          displayName = from.split('@')[0];
        }
      } catch (e) {
        displayName = from.split('@')[0] || 'Utente';
      }
      const loadingMsg = await m.reply('⏳ Genero la quote card...');
      try {
        const imageBuffer = await generateQuoteCard(pfpUrl, messageText.trim(), displayName);
        await conn.sendMessage(m.chat, {
          document: {
            url: imageBuffer
          },
          fileName: 'quote-card.png',
          mimetype: 'image/png',
          caption: `📜 *QUOTE CARD*\n\n💬 Messaggio di: ${displayName}`
        }, { quoted: loadingMsg });
        await conn.sendMessage(m.chat, { delete: loadingMsg.key }).catch(() => {});
      } catch (genErr) {
        console.error('[fun-quote] Errore generazione card:', genErr);
        await conn.sendMessage(m.chat, {
          text: `❌ Errore nella generazione della card\n\n${messageText}`
        }, { quoted: loadingMsg });
      }
      return;
    }
    if (text && !isNaN(text)) {
      const index = parseInt(text) - 1;
      if (index >= 0 && index < quotes.length) {
        await conn.sendMessage(m.chat, {
          text: `📜 *CITAZIONE #${index + 1}*\n\n${quotes[index]}`
        }, { quoted: m });
        return;
      } else {
        return m.reply(`❌ Numero non valido! Usa da 1 a ${quotes.length}`);
      }
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    await conn.sendMessage(m.chat, {
      text: `📜 *CITAZIONE CASUALE*\n\n${quote}`
    }, { quoted: m });
  } catch (err) {
    console.error('[fun-quote] Errore:', err);
    m.reply('❌ Errore durante il recupero della citazione!');
  }
};
handler.help = ['quote <numero>', 'quote (rispondi a un messaggio)'];
handler.tags = ['fun', 'utils'];
handler.command = /^quote$/i;
handler.prefix = false;
export default handler;