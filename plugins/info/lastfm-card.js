//Plugin by Elixir

/**
 * lastfm-card.js
 * Genera la card Last.fm come Buffer PNG e la invia su WhatsApp.
 *
 * Uso nel plugin:
 *   import { makeCard, sendImage } from './lastfm-card.js'
 *   const buf = await makeCard(track, username)
 *   await sendImage(conn, m, buf, caption, buttons)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';



function buildHTML(track, username) {
  const albumArt =
    track.image?.find(i => i.size === 'extralarge')?.[`#text`] ||
    track.image?.find(i => i.size === 'large')?.[`#text`] ||
    'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';

  const isPlaying  = track['@attr']?.nowplaying === 'true';
  const songName   = track.name            || 'Sconosciuto';
  const artistName = track.artist['#text'] || 'Sconosciuto';
  const albumName  = track.album?.['#text'] || 'Album sconosciuto';

  const titleSize  = Math.max(16, 34 - Math.max(0, songName.length   - 20) * 0.5);
  const artistSize = Math.max(13, 22 - Math.max(0, artistName.length - 25) * 0.3);
  const albumSize  = Math.max(11, 16 - Math.max(0, albumName.length  - 30) * 0.2);

  const statusColor = isPlaying ? '#1DB954' : '#888888';
  const statusText  = isPlaying ? 'In riproduzione' : 'Ultimo brano';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:800px; height:400px; overflow:hidden;
  font-family:'DM Sans',sans-serif; background:#0d0d0f;
}
.card {
  position:relative; width:800px; height:400px; display:flex;
  align-items:center; overflow:hidden;
  background:linear-gradient(135deg, rgba(15,15,18,1), rgba(10,10,12,1));
}
.card::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0));
  z-index:0;
}
.bg-blur {
  position:absolute; inset:0;
  background-image:url('${albumArt}');
  background-size:cover; background-position:center;
  filter:blur(26px) brightness(0.38) saturate(1.15);
  transform:scale(1.12); z-index:0;
}
.cover-wrap {
  position:relative; z-index:1;
  width:290px; height:290px;
  margin:55px 0 55px 46px;
  border-radius:18px;
  overflow:hidden;
  background:#09090b;
  border:1px solid rgba(255,255,255,0.08);
  box-shadow:0 18px 42px rgba(0,0,0,0.72);
}
.cover {
  width:100%; height:100%; display:block;
  object-fit:cover; object-position:center; background:#111;
}
.info {
  position:relative; z-index:1; display:flex; flex-direction:column;
  justify-content:center; padding:34px 34px 30px 28px; flex:1; overflow:hidden;
}
.status {
  display:inline-flex; align-items:center; gap:8px;
  padding:6px 12px; border-radius:999px; font-size:10px; font-weight:700;
  letter-spacing:.14em; text-transform:uppercase; margin-bottom:18px;
  width:fit-content;
  background:${isPlaying ? 'rgba(29,185,84,0.12)' : 'rgba(255,255,255,0.05)'};
  color:${statusColor};
  border:1px solid ${isPlaying ? 'rgba(29,185,84,0.38)' : 'rgba(255,255,255,0.08)'};
}
.dot {
  width:7px; height:7px; border-radius:50%; background:${statusColor};
  box-shadow:0 0 12px ${statusColor};
}
.song-title {
  font-family:'Syne',sans-serif; font-weight:800; color:#f6f6f6;
  line-height:1.02; margin-bottom:10px;
  font-size:${titleSize}px;
  overflow:hidden; display:-webkit-box; -webkit-box-orient:vertical;
  -webkit-line-clamp:2; word-break:break-word; letter-spacing:-0.05em;
}
.artist {
  font-size:${artistSize}px; font-weight:500; color:#d7d7d7;
  margin-bottom:16px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;
  letter-spacing:0.02em;
}
.meta {
  display:flex; align-items:center; gap:8px; color:#8d8d8d; font-size:12px;
  margin-top:auto;
}
.meta strong {
  color:#ececec; font-weight:700;
}
</style>
</head>
<body>
<div class="card">
  <div class="bg-blur"></div>
  <div class="cover-wrap">
    <img class="cover" src="${albumArt}" alt="Cover">
  </div>
  <div class="info">
    <div class="status"><span class="dot"></span> ${statusText}</div>
    <div class="song-title">${songName}</div>
    <div class="artist">${artistName}</div>
    <div class="meta"><span>🎧 ascoltato da</span><strong>@${username}</strong></div>
  </div>
</div>
</body>
</html>`;
}

async function renderWithPuppeteer(html) {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    ]
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buf = await page.screenshot({ type: 'png' });
    return Buffer.from(buf);
  } finally {
    await browser.close();
  }
}


async function loadImage(url) {
  const { createCanvas, loadImage: loadImg } = await import('canvas');
  return loadImg(url);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function renderWithCanvas(track, username) {
  const { createCanvas, loadImage: loadImg } = await import('canvas');
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  const albumArt =
    track.image?.find(i => i.size === 'extralarge')?.[`#text`] ||
    track.image?.find(i => i.size === 'large')?.[`#text`] ||
    'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';

  const isPlaying  = track['@attr']?.nowplaying === 'true';
  const songName   = track.name            || 'Sconosciuto';
  const artistName = track.artist['#text'] || 'Sconosciuto';
  const albumName  = track.album?.['#text'] || 'Album sconosciuto';

  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, 800, 400);

  try {
    const cover = await loadImg(albumArt);
    ctx.save();
    roundRect(ctx, 30, 30, 340, 340, 12);
    ctx.clip();
    ctx.drawImage(cover, 30, 30, 340, 340);
    ctx.restore();
  } catch {
    ctx.fillStyle = '#333';
    ctx.fillRect(30, 30, 340, 340);
  }

  const x = 400;
  const titleSize  = Math.max(16, 32 - Math.max(0, songName.length   - 18) * 0.45);
  const artistSize = Math.max(12, 19 - Math.max(0, artistName.length - 22) * 0.25);

  ctx.fillStyle = '#0d0d0f';
  ctx.fillRect(0, 0, 800, 400);

  try {
    const cover = await loadImg(albumArt);
    ctx.save();
    roundRect(ctx, 46, 55, 290, 290, 18);
    ctx.clip();
    ctx.drawImage(cover, 46, 55, 290, 290);
    ctx.restore();
  } catch {
    ctx.fillStyle = '#222';
    roundRect(ctx, 46, 55, 290, 290, 18);
    ctx.fill();
  }

  ctx.fillStyle = '#8d8d8d';
  ctx.font = 'bold 10px Arial';
  ctx.fillText((isPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO BRANO').toUpperCase(), x, 120);

  ctx.fillStyle = '#f6f6f6';
  ctx.font = `bold ${titleSize}px Arial`;
  ctx.fillText(songName.length > 24 ? songName.slice(0, 24) + '…' : songName, x, 175);

  ctx.fillStyle = '#d7d7d7';
  ctx.font = `${artistSize}px Arial`;
  ctx.fillText(artistName.length > 28 ? artistName.slice(0, 28) + '…' : artistName, x, 214);

  ctx.fillStyle = '#8d8d8d';
  ctx.font = '12px Arial';
  ctx.fillText(`🎧 ascoltato da @${username}`, x, 330);

  return canvas.toBuffer('image/png');
}


/**
 * Genera la card come Buffer PNG.
 * Prova puppeteer poi canvas.
 */
export async function makeCard(track, username) {
  try {
    const html = buildHTML(track, username);
    const buf  = await renderWithPuppeteer(html);
    if (buf && buf.length > 0) return buf;
  } catch (e) {
    console.warn('[lastfm-card] puppeteer fallito, provo canvas:', e.message);
  }

  try {
    const buf = await renderWithCanvas(track, username);
    if (buf && buf.length > 0) return buf;
  } catch (e) {
    console.warn('[lastfm-card] canvas fallito:', e.message);
  }

  throw new Error('[lastfm-card] Nessun renderer disponibile (installa puppeteer o canvas)');
}

/**
 * Invia un'immagine Buffer su WhatsApp con @chatunity/baileys.
 * Salva su file temp e passa url: filepath — unico formato accettato dalla lib.
 */
export async function sendImage(conn, m, buffer, caption = '', buttons = [], opts = {}) {
  if (!buffer || buffer.length === 0) throw new Error('Buffer immagine vuoto');

  const base = {
    caption,
    footer: opts.footer || ' 𝟴𝟴𝟴 𝗕𝗢𝗧 - Last.fm',
    contextInfo: {
      ...(opts.externalAdReply ? { externalAdReply: opts.externalAdReply } : {}),
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363341274693350@newsletter',
        serverMessageId: -1,
        newsletterName: '𝟴𝟴𝟴 𝗕𝗢𝗧'
      }
    }
  };

  if (buttons.length > 0) {
    base.buttons = buttons;
  }

  const tmp = `C:/Users/admin/Documents/888-BOT/temp/lastfm_${Date.now()}.png`;
  
  // Assicurati che la directory temp esista
  const tempDir = path.dirname(tmp);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  fs.writeFileSync(tmp, buffer);

  try {
    await conn.sendMessage(m.chat, { image: { url: tmp }, ...base }, {
      quoted: m,
      upload: conn.waUploadToServer
    });
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
}
