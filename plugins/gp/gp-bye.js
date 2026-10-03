import fetch from 'node-fetch'
import { removeWhitelistEntry } from '../../lib/whitelist.js'

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

    let groupPic
    try {
      groupPic = await conn.profilePictureUrl(m.chat, 'image')
    } catch {
      groupPic = 'https://telegra.ph/file/8ca14ef9fa43e99d1d196.jpg'
    }

    let groupPicBuffer
    try {
      groupPicBuffer = await (await fetch(groupPic)).buffer()
    } catch {
      groupPicBuffer = await (await fetch('https://telegra.ph/file/8ca14ef9fa43e99d1d196.jpg')).buffer()
    }

    for (let user of participants_new) {
      if (chat.topBlasphemy && chat.topBlasphemy[user]) delete chat.topBlasphemy[user]
      if (chat.topUsers && chat.topUsers[user]) delete chat.topUsers[user]
      removeWhitelistEntry('antinuke', m.chat, user)
      removeWhitelistEntry('antibot', m.chat, user)

      let profilePic
      try {
        profilePic = await conn.profilePictureUrl(user, 'image')
      } catch {
        profilePic = 'https://telegra.ph/file/8ca14ef9fa43e99d1d196.jpg'
      }

      let ppBuffer
      try {
        ppBuffer = await (await fetch(profilePic)).buffer()
      } catch {
        ppBuffer = await (await fetch('https://telegra.ph/file/8ca14ef9fa43e99d1d196.jpg')).buffer()
      }

      let byeText = chat.sBye || `@${user.split('@')[0]} 𝐡𝐚 𝐥𝐚𝐬𝐜𝐢𝐚𝐭𝐨 𝐢𝐥 𝐠𝐫𝐮𝐩𝐩𝐨`
      byeText = byeText
        .replace(/@user/g, `@${user.split('@')[0]}`)
        .replace(/@group/g, groupMetadata.subject)
        .replace(/@count/g, groupMetadata.participants.length)

      byeText += `\n\n👥 𝐌𝐞𝐦𝐛𝐫𝐢 𝐫𝐢𝐦𝐚𝐧𝐞𝐧𝐭𝐢: ${groupMetadata.participants.length}`

      const fakeBye = {
        key: {
          participants: '0@s.whatsapp.net',
          fromMe: false,
          id: '888Bye'
        },
        message: {
          locationMessage: {
            name: '𝐀𝐝𝐝𝐢𝐨 👋',
            jpegThumbnail: ppBuffer.toString('base64'),
            vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Bye;;;\nFN:Bye\nEND:VCARD'
          }
        },
        participant: '0@s.whatsapp.net'
      }

      await conn.sendMessage(
        m.chat,
        {
          image: groupPicBuffer,
          caption: byeText,
          mentions: [user]
        },
        { quoted: fakeBye }
      )
    }
  } catch {}
}