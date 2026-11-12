import { removeWhitelistEntry } from '../../lib/whitelist.js'
import { downloadImage, deliver, enqueue } from '../../lib/welcome-media.js'

const NAME = '\u0001' // segnaposto per il nome del gruppo
const recentNotices = new Map()

const claimParticipants = (chat, participants) => {
  const now = Date.now()
  for (const [key, timestamp] of recentNotices) {
    if (now - timestamp > 60_000) recentNotices.delete(key)
  }
  return participants.filter((user) => {
    const key = `${chat}:${user}`
    const previous = recentNotices.get(key)
    if (previous && now - previous < 30_000) return false
    recentNotices.set(key, now)
    return true
  })
}

const boldSegment = (s) =>
  s.trim() ? s.replace(/^(\s*)(.*?)(\s*)$/, '$1*$2*$3') : s

const bold = (text) =>
  text
    .split('\n')
    .map((line) => line.split(NAME).map(boldSegment).join(NAME))
    .join('\n')

export async function before(m, { conn }) {
  if (!m.isGroup) return
  if (m.messageStubType !== 28) return
  const participants = Array.isArray(m.messageStubParameters) ? m.messageStubParameters : []
  if (!participants.length) return

  try {
    const chat = global.db.data.chats[m.chat] || {}
    if (!chat || chat.bye !== true) return
    const participants_new = claimParticipants(m.chat, participants)
    if (!participants_new.length) return

    for (const user of participants_new) {
      if (chat.topBlasphemy && chat.topBlasphemy[user]) delete chat.topBlasphemy[user]
      if (chat.topUsers && chat.topUsers[user]) delete chat.topUsers[user]
      removeWhitelistEntry('antinuke', m.chat, user)
      removeWhitelistEntry('antibot', m.chat, user)
    }

    enqueue(async () => {
      let groupMetadata = null
      try {
        groupMetadata = await conn.groupMetadata(m.chat)
      } catch (error) {
        console.warn(`[BYE] Metadati gruppo non disponibili (${m.chat}): ${error.message}`)
      }
      groupMetadata = groupMetadata || (conn.chats?.[m.chat] || {}).metadata
      if (!groupMetadata) {
        console.warn(`[BYE] Invio saltato: metadati gruppo assenti (${m.chat})`)
        return
      }

      let groupPic = null
      try {
        groupPic = await conn.profilePictureUrl(m.chat, 'image')
      } catch {
        groupPic = null
      }
      const groupBuf = await downloadImage(groupPic)
      const count = groupMetadata.participants.length

      for (const user of participants_new) {
        let profilePic = null
        try {
          profilePic = await conn.profilePictureUrl(user, 'image')
        } catch {
          profilePic = null
        }
        const ppBuf = await downloadImage(profilePic)

        let userName = user.split('@')[0]
        try {
          const n = await conn.getName(user)
          if (n && typeof n === 'string') userName = n
        } catch {}

        let caption =
          chat.sBye || `@${user.split('@')[0]} ha lasciato il gruppo @group`
        caption = caption
          .replace(/@user/g, `@${user.split('@')[0]}`)
          .replace(/@group/g, NAME)
          .replace(/@count/g, count)
        caption += `\n\n👥 Membri rimanenti: ${count}`
        caption = bold(caption).replaceAll(NAME, () => groupMetadata.subject)

        const quoted = {
          key: { participants: '0@s.whatsapp.net', fromMe: false, id: '888Bye' },
          message: {
            locationMessage: {
              name: 'Addio 👋',
              jpegThumbnail: ppBuf,
              vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Bye;;;\nFN:Bye\nEND:VCARD'
            }
          },
          participant: '0@s.whatsapp.net'
        }

        try {
          await deliver(conn, m, {
            mode: 'bye',
            user,
            userName,
            caption,
            groupBuf,
            ppBuf,
            groupName: groupMetadata.subject,
            count,
            quoted
          })
        } catch (error) {
          console.error(`[BYE] Invio fallito per ${user} in ${m.chat}:`, error)
        }
      }
    })
  } catch (error) {
    console.error('[BYE] Errore nel gestore:', error)
  }
}

export async function groupParticipantsUpdate(update) {
  if (update?.action !== 'remove' || !update.id) return
  await before.call(this, {
    chat: update.id,
    isGroup: update.id.endsWith('@g.us'),
    messageStubType: 28,
    messageStubParameters: Array.isArray(update.participants) ? update.participants : []
  }, { conn: this })
}