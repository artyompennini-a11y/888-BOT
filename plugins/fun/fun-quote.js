// Plugin by Elixir
import { createCanvas, createImageBitmap } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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