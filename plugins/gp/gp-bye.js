import fetch from 'node-fetch'
import fs from 'fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { removeWhitelistEntry } from '../../lib/whitelist.js'

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
  g.addColorStop(0, 'rgba(45,5,15,0.9)')
  g.addColorStop(1, 'rgba(10,10,35,0.9)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

const buildByeCard = async ({ groupBuf, userBuf, userName, groupName, count }) => {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  const bg = await safeLoad(groupBuf)
  const avatar = await safeLoad(userBuf)

  drawBackground(ctx, bg)

  ctx.save()
  ctx.globalAlpha = 0.9
  const stripe = ctx.createLinearGradient(0, 0, W, 0)
  stripe.addColorStop(0, '#ff7a18')
  stripe.addColorStop(1, '#ff2d55')
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
  ring.addColorStop(0, '#ff7a18')
  ring.addColorStop(1, '#ff2d55')
  ctx.beginPath()
  ctx.arc(cx, cy, r + 12, 0, Math.PI * 2)
  ctx.fillStyle = ring
  ctx.shadowColor = '#ff2d55'
  ctx.shadowBlur = 35
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  if (avatar) {
    ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
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

  ctx.fillStyle = '#ff7a18'
  ctx.font = 'bold 30px sans-serif'
  ctx.fillText('A R R I V E D E R C I', tx, 215)

  ctx.fillStyle = '#ffffff'
  fitText(ctx, userName, maxW, 74)
  ctx.fillText(userName, tx, 305)

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '28px sans-serif'
  ctx.fillText('ha lasciato', tx, 355)

  ctx.fillStyle = '#ffffff'
  fitText(ctx, groupName, maxW, 48)
  ctx.fillText(groupName, tx, 415)

  const label = `RIMASTI ${count}`
  ctx.font = 'bold 28px sans-serif'
  const pw = ctx.measureText(label).width + 56
  rr(ctx, tx, 450, pw, 56, 28)
  const pill = ctx.createLinearGradient(tx, 0, tx + pw, 0)
  pill.addColorStop(0, '#ff7a18')
  pill.addColorStop(1, '#ff2d55')
  ctx.fillStyle = pill
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, tx + 28, 479)

  return canvas.toBuffer('image/png')
}

export async function before(m, { conn }) {
  if (!m.isGroup) return

  if (m.messageStubType !== 28) return
  const participants_new = Array.isArray(m.messageStubParameters) ? m.messageStubParameters : []
  if (!participants_new.length) return

  try {
    let chat = global.db.data.chats[m.chat]
    if (!chat || chat.bye !== true) return

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
      if (chat.topBlasphemy && chat.topBlasphemy[user]) delete chat.topBlasphemy[user]
      if (chat.topUsers && chat.topUsers[user]) delete chat.topUsers[user]
      removeWhitelistEntry('antinuke', m.chat, user)
      removeWhitelistEntry('antibot', m.chat, user)

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

      let byeText = chat.sBye || `@${user.split('@')[0]} ha lasciato il gruppo\n${groupMetadata.subject}`
      byeText = byeText
        .replace(/@user/g, `@${user.split('@')[0]}`)
        .replace(/@group/g, groupMetadata.subject)
        .replace(/@count/g, count)
      byeText += `\n\n👥 Membri rimanenti: ${count}`

      let image
      try {
        image = await buildByeCard({
          groupBuf: groupPicBuffer,
          userBuf: ppBuffer,
          userName,
          groupName: groupMetadata.subject,
          count
        })
      } catch {
        image = groupPicBuffer
      }

      const fakeBye = {
        key: {
          participants: '0@s.whatsapp.net',
          fromMe: false,
          id: '888Bye'
        },
        message: {
          locationMessage: {
            name: 'Addio 👋',
            jpegThumbnail: ppBuffer,
            vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Bye;;;\nFN:Bye\nEND:VCARD'
          }
        },
        participant: '0@s.whatsapp.net'
      }

      try {
        await conn.sendMessage(m.chat, {
          image,
          caption: byeText,
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
        }, { quoted: fakeBye })
      } catch {
        await conn.sendMessage(m.chat, {
          image,
          caption: `${byeText}\n\n📢 Canale: ${CHANNEL_URL}`,
          mentions: [user]
        }, { quoted: fakeBye })
      }
    }
  } catch {
  }
}
