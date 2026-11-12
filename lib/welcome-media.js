import fetch from 'node-fetch'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const execFileP = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const iconsDir = path.join(__dirname, '..', 'icone')

export const CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb8Y0igGufJ0xMYJmU40'

const DURATION = 5
const TARGET_W = 720
const CW = 1200
const CH = 630

const GIFS = {
  welcome: ['icone/welcome.mp4'],
  bye: ['icone/bye.mp4']
}

const THEMES = {
  welcome: {
    s1: '#ff2d95',
    s2: '#00e5ff',
    glow: '#00e5ff',
    kc: '#00e5ff',
    p1: '#ff2d95',
    p2: '#7a5cff',
    bg1: 'rgba(20,0,40,0.88)',
    bg2: 'rgba(0,25,45,0.88)',
    dim: 0,
    kicker: 'B E N V E N U T O / A',
    verb: 'è entrato/a in',
    title: 'Benvenuto/a',
    pill: (n) => `MEMBRO #${n}`
  },
  bye: {
    s1: '#ff7a18',
    s2: '#ff2d55',
    glow: '#ff2d55',
    kc: '#ff7a18',
    p1: '#ff7a18',
    p2: '#ff2d55',
    bg1: 'rgba(45,5,15,0.9)',
    bg2: 'rgba(10,10,35,0.9)',
    dim: 0.25,
    kicker: 'A R R I V E D E R C I',
    verb: 'ha lasciato',
    title: 'Arrivederci',
    pill: (n) => `RIMASTI ${n}`
  }
}

let chain = Promise.resolve()

export const enqueue = (task) => {
  chain = chain.then(task).catch((error) => {
    console.error('[WELCOME-MEDIA] Errore nella coda:', error)
  })
  return chain
}

const fallbackImage = () => {
  try {
    return fs.readFileSync(path.join(iconsDir, '888.jpg'))
  } catch {
    return Buffer.alloc(0)
  }
}

export const downloadImage = async (url) => {
  try {
    if (!url) return fallbackImage()
    const response = await fetch(url, { timeout: 8000 })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.buffer()
  } catch {
    return fallbackImage()
  }
}

const safeLoad = async (buf) => {
  try {
    if (!buf || !buf.length) return null
    return await loadImage(buf)
  } catch {
    return null
  }
}

const rr = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const fitText = (ctx, text, maxW, size, weight = 'bold') => {
  let s = size
  do {
    ctx.font = `${weight} ${s}px sans-serif`
    s -= 2
  } while (ctx.measureText(text).width > maxW && s > 14)
}

const drawAvatar = (ctx, avatar, userName, cx, cy, r, theme) => {
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  if (avatar) {
    ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2)
    if (theme.dim) {
      ctx.fillStyle = `rgba(0,0,0,${theme.dim})`
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    }
  } else {
    ctx.fillStyle = '#2a2a3a'
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.round(r)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((userName[0] || '?').toUpperCase(), cx, cy + r * 0.04)
  }
  ctx.restore()
}

const buildOverlay = async ({ W, H, avatarBuf, userName, theme }) => {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  const avatar = await safeLoad(avatarBuf)

  const shade = ctx.createLinearGradient(0, H * 0.3, 0, H)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(1, 'rgba(0,0,0,0.78)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, W, H)

  const r = Math.round(Math.min(W, H) * 0.2)
  const cx = W / 2
  const cy = Math.round(H * 0.4)
  drawAvatar(ctx, avatar, userName, cx, cy, r, theme)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  const drawBold = (text, y, color, maxW, size) => {
    fitText(ctx, text, maxW, size, '900')
    const px = parseInt(ctx.font.match(/(\d+)px/)[1], 10)
    ctx.lineJoin = 'round'
    ctx.lineWidth = Math.max(2, px * 0.05)
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.strokeText(text, cx, y)
    ctx.fillText(text, cx, y)
  }

  const drawThin = (text, y, color, maxW, size) => {
    fitText(ctx, text, maxW, size, '300')
    ctx.fillStyle = color
    ctx.fillText(text, cx, y)
  }

  const ty = cy + r + Math.round(H * 0.17)
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 14
  drawBold(theme.title, ty, '#ffffff', W * 0.86, Math.round(W * 0.115))
  drawThin(userName, ty + Math.round(H * 0.1), 'rgba(255,255,255,0.92)', W * 0.8, Math.round(W * 0.052))
  ctx.shadowBlur = 0

  return canvas.toBuffer('image/png')
}

const pickGif = (mode) => {
  const list = (GIFS[mode] || [])
    .map((file) => path.join(iconsDir, file.replace(/^icone[\\/]/, '')))
    .filter((file) => fs.existsSync(file))
  return list.length ? list[Math.floor(Math.random() * list.length)] : null
}

const probe = async (file) => {
  const { stdout } = await execFileP('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-of', 'csv=s=x:p=0',
    file
  ])
  const [w, h] = stdout.trim().split('x').map(Number)
  if (!w || !h) throw new Error('probe')
  return { w, h }
}

const even = (n) => Math.max(2, Math.round(n / 2) * 2)

const buildAnimated = async ({ mode, avatarBuf, userName }) => {
  const src = pickGif(mode)
  if (!src) throw new Error('nogif')

  const { w, h } = await probe(src)
  const W = even(TARGET_W)
  const H = even(h * (W / w))

  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const overlayPath = path.join(os.tmpdir(), `ov_${id}.png`)
  const outPath = path.join(os.tmpdir(), `wl_${id}.mp4`)

  try {
    fs.writeFileSync(
      overlayPath,
      await buildOverlay({ W, H, avatarBuf, userName, theme: THEMES[mode] })
    )

    const loopArgs = /\.gif$/i.test(src) ? ['-ignore_loop', '0'] : ['-stream_loop', '-1']

    await execFileP(
      'ffmpeg',
      [
        '-y', '-hide_banner', '-loglevel', 'error',
        ...loopArgs, '-i', src,
        '-loop', '1', '-i', overlayPath,
        '-filter_complex', `[0:v]scale=${W}:${H}:flags=lanczos,setsar=1[bg];[bg][1:v]overlay=0:0,format=yuv420p`,
        '-t', String(DURATION),
        '-r', '24',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '21',
        '-movflags', '+faststart',
        '-an',
        outPath
      ],
      { timeout: 60000 }
    )

    return fs.readFileSync(outPath)
  } finally {
    for (const f of [overlayPath, outPath]) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f)
      } catch {}
    }
  }
}

const buildStaticCard = async ({ mode, groupBuf, userBuf, userName, groupName, count }) => {
  const theme = THEMES[mode]
  const canvas = createCanvas(CW, CH)
  const ctx = canvas.getContext('2d')
  const bg = await safeLoad(groupBuf)
  const avatar = await safeLoad(userBuf)

  if (bg) {
    const small = createCanvas(40, 21)
    small.getContext('2d').drawImage(bg, 0, 0, 40, 21)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(small, 0, 0, CW, CH)
  } else {
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, CW, CH)
  }
  const g = ctx.createLinearGradient(0, 0, CW, CH)
  g.addColorStop(0, theme.bg1)
  g.addColorStop(1, theme.bg2)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, CW, CH)

  ctx.save()
  ctx.globalAlpha = 0.9
  const stripe = ctx.createLinearGradient(0, 0, CW, 0)
  stripe.addColorStop(0, theme.s1)
  stripe.addColorStop(1, theme.s2)
  ctx.fillStyle = stripe
  ctx.beginPath()
  ctx.moveTo(CW - 330, 0)
  ctx.lineTo(CW - 250, 0)
  ctx.lineTo(CW - 470, CH)
  ctx.lineTo(CW - 550, CH)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.moveTo(CW - 220, 0)
  ctx.lineTo(CW - 190, 0)
  ctx.lineTo(CW - 410, CH)
  ctx.lineTo(CW - 440, CH)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  rr(ctx, 50, 50, CW - 100, CH - 100, 36)
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.stroke()

  drawAvatar(ctx, avatar, userName, 270, CH / 2, 140, theme)

  const tx = 470
  const maxW = 560
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = theme.kc
  ctx.font = 'bold 30px sans-serif'
  ctx.fillText(theme.kicker, tx, 215)

  ctx.fillStyle = '#ffffff'
  fitText(ctx, userName, maxW, 74, '300')
  ctx.fillText(userName, tx, 305)

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '28px sans-serif'
  ctx.fillText(theme.verb, tx, 355)

  ctx.fillStyle = '#ffffff'
  fitText(ctx, groupName, maxW, 48)
  ctx.fillText(groupName, tx, 415)

  const label = theme.pill(count)
  ctx.font = 'bold 28px sans-serif'
  const pw = ctx.measureText(label).width + 56
  rr(ctx, tx, 450, pw, 56, 28)
  const pill = ctx.createLinearGradient(tx, 0, tx + pw, 0)
  pill.addColorStop(0, theme.p1)
  pill.addColorStop(1, theme.p2)
  ctx.fillStyle = pill
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, tx + 28, 479)

  return canvas.toBuffer('image/png')
}

export const deliver = async (conn, m, opts) => {
  const { mode, user, userName, caption, groupBuf, ppBuf, groupName, count, quoted } = opts

  let media = null
  try {
    const video = await buildAnimated({ mode, avatarBuf: ppBuf, userName })
    media = { video, gifPlayback: true, mimetype: 'video/mp4' }
  } catch (error) {
    console.warn(`[WELCOME-MEDIA] Video ${mode} non disponibile: ${error.message}`)
  }

  if (!media) {
    try {
      const image = await buildStaticCard({
        mode,
        groupBuf,
        userBuf: ppBuf,
        userName,
        groupName,
        count
      })
      media = { image }
    } catch (error) {
      console.warn(`[WELCOME-MEDIA] Card ${mode} non generata: ${error.message}`)
      if (groupBuf?.length) media = { image: groupBuf }
    }
  }

  const content = {
    ...(media || {}),
    caption,
    mentions: [user]
  }

  try {
    await conn.sendMessage(
      m.chat,
      {
        ...content,
        footer: '',
        interactiveButtons: [
          {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: '📢 Unisciti al canale',
              url: CHANNEL_URL,
              merchant_url: CHANNEL_URL
            })
          }
        ]
      },
      { quoted }
    )
  } catch {
    try {
      await conn.sendMessage(
        m.chat,
        { ...content, caption: `${caption}\n\n📢 Canale: ${CHANNEL_URL}` },
        { quoted }
      )
    } catch (error) {
      console.warn(`[WELCOME-MEDIA] Invio media ${mode} fallito; provo testo: ${error.message}`)
      await conn.sendMessage(
        m.chat,
        { text: `${caption}\n\n📢 Canale: ${CHANNEL_URL}`, mentions: [user] },
        { quoted }
      )
    }
  }
}