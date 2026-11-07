import fetch from 'node-fetch'
import fs from 'fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb8Y0igGufJ0xMYJmU40'

const W = 1200
const H = 630

const fallbackImage = () => {
  try {
    return fs.readFileSync('icone/888.jpg')
  } catch {
    return Buffer.alloc(0)
  }
}

const downloadImage = async (url) => {
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
  } while (ctx.measureText(text).width > maxW && s > 18)
}

const drawBackground = (ctx, bg) => {
  if (bg) {
    const small = createCanvas(40, 21)
    small.getContext('2d').drawImage(bg, 0, 0, 40, 21)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(small, 0, 0, W, H)
  } else {
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, W, H)
  }
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, 'rgba(20,0,40,0.88)')
  g.addColorStop(1, 'rgba(0,25,45,0.88)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

const buildWelcomeCard = async ({ groupBuf, userBuf, userName, groupName, count }) => {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  const bg = await safeLoad(groupBuf)
  const avatar = await safeLoad(userBuf)

  drawBackground(ctx, bg)

  ctx.save()
  ctx.globalAlpha = 0.9
  const stripe = ctx.createLinearGradient(0, 0, W, 0)
  stripe.addColorStop(0, '#ff2d95')
  stripe.addColorStop(1, '#00e5ff')
  ctx.fillStyle = stripe
  ctx.beginPath()
  ctx.moveTo(W - 330, 0)
  ctx.lineTo(W - 250, 0)
  ctx.lineTo(W - 470, H)
  ctx.lineTo(W - 550, H)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.moveTo(W - 220, 0)
  ctx.lineTo(W - 190, 0)
  ctx.lineTo(W - 410, H)
  ctx.lineTo(W - 440, H)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  rr(ctx, 50, 50, W - 100, H - 100, 36)
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.stroke()

  const cx = 270
  const cy = H / 2
  const r = 140
  const ring = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  ring.addColorStop(0, '#ff2d95')
  ring.addColorStop(1, '#00e5ff')
  ctx.beginPath()
  ctx.arc(cx, cy, r + 12, 0, Math.PI * 2)
  ctx.fillStyle = ring
  ctx.shadowColor = '#00e5ff'
  ctx.shadowBlur = 35
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  if (avatar) {
    ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2)
  } else {
    ctx.fillStyle = '#2a2a3a'
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 140px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((userName[0] || '?').toUpperCase(), cx, cy + 6)
  }
  ctx.restore()

  const tx = 470
  const maxW = 560
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = '#00e5ff'
  ctx.font = 'bold 30px sans-serif'
  ctx.fillText('B E N V E N U T O / A', tx, 215)

  ctx.fillStyle = '#ffffff'
  fitText(ctx, userName, maxW, 74)
  ctx.fillText(userName, tx, 305)

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '28px sans-serif'
  ctx.fillText('è entrato/a in', tx, 355)

  ctx.fillStyle = '#ffffff'
  fitText(ctx, groupName, maxW, 48)
  ctx.fillText(groupName, tx, 415)

  const label = `MEMBRO #${count}`
  ctx.font = 'bold 28px sans-serif'
  const pw = ctx.measureText(label).width + 56
  rr(ctx, tx, 450, pw, 56, 28)
  const pill = ctx.createLinearGradient(tx, 0, tx + pw, 0)
  pill.addColorStop(0, '#ff2d95')
  pill.addColorStop(1, '#7a5cff')
  ctx.fillStyle = pill
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, tx + 28, 479)

  return canvas.toBuffer('image/png')
}

export async function before(m, { conn }) {
  try {
    if (!m.isGroup) return
    if (m.messageStubType !== 27 && m.messageStubType !== 31) return
    const participants_new = Array.isArray(m.messageStubParameters) ? m.messageStubParameters : []
    if (!participants_new.length) return

    let chat = global.db.data.chats[m.chat] || {}
    if (chat.welcome !== true) return

    let groupMetadata = null
    try {
      groupMetadata = await conn.groupMetadata(m.chat)
    } catch {}
    groupMetadata = groupMetadata || (conn.chats?.[m.chat] || {}).metadata
    if (!groupMetadata) return

    let groupPic = null
    try {
      groupPic = await conn.profilePictureUrl(m.chat, 'image')
    } catch {
      groupPic = null
    }
    const groupPicBuffer = await downloadImage(groupPic)
    const count = groupMetadata.participants.length

    for (let user of participants_new) {
      let profilePic = null
      try {
        profilePic = await conn.profilePictureUrl(user, 'image')
      } catch {
        profilePic = null
      }
      const ppBuffer = await downloadImage(profilePic)

      let userName = user.split('@')[0]
      try {
        const n = await conn.getName(user)
        if (n && typeof n === 'string') userName = n
      } catch {}

      let welcomeText = chat.sWelcome || `@${user.split('@')[0]} benvenuto/a nel gruppo\n${groupMetadata.subject}`
      welcomeText = welcomeText
        .replace(/@user/g, `@${user.split('@')[0]}`)
        .replace(/@group/g, groupMetadata.subject)
        .replace(/@count/g, count)
        .replace(/@desc/g, groupMetadata.desc?.toString() || 'Nessuna descrizione')
      welcomeText += `\n\n👥 Membri attuali: ${count}`

      let image
      try {
        image = await buildWelcomeCard({
          groupBuf: groupPicBuffer,
          userBuf: ppBuffer,
          userName,
          groupName: groupMetadata.subject,
          count
        })
      } catch {
        image = groupPicBuffer
      }

      const fakeWelcome = {
        key: {
          participants: '0@s.whatsapp.net',
          fromMe: false,
          id: '888Welcome'
        },
        message: {
          locationMessage: {
            name: 'Benvenuto 👋',
            jpegThumbnail: ppBuffer,
            vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Welcome;;;\nFN:Welcome\nEND:VCARD'
          }
        },
        participant: '0@s.whatsapp.net'
      }

      try {
        await conn.sendMessage(m.chat, {
          image,
          caption: welcomeText,
          footer: '',
          mentions: [user],
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
        }, { quoted: fakeWelcome })
      } catch {
        await conn.sendMessage(m.chat, {
          image,
          caption: `${welcomeText}\n\n📢 Canale: ${CHANNEL_URL}`,
          mentions: [user]
        }, { quoted: fakeWelcome })
      }
    }
  } catch {
  }
}
