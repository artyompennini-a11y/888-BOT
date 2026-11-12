import fetch from 'node-fetch'

const formatMention = jid => `@${String(jid).split('@')[0].split(':')[0]}`

const handler = () => {}

handler.groupParticipantsUpdate = async function ({ id, participants = [], action, author, actor }) {
  if (action !== 'promote' && action !== 'demote') return
  if (!id || !Array.isArray(participants) || participants.length === 0) return

  const conn = this
  const decodeJid = jid => typeof conn.decodeJid === 'function' ? conn.decodeJid(jid) : jid
  const targets = participants.map(decodeJid).filter(Boolean)
  const moderator = decodeJid(author || actor)
  const mentions = [...new Set([...targets, moderator].filter(Boolean))]
  const promoted = action === 'promote'
  const title = promoted
    ? 'ℙ𝕣𝕠𝕞𝕠𝕫𝕚𝕠𝕟𝕖 𝕒𝕕𝕞𝕚𝕟 👑'
    : 'ℝ𝕖𝕥𝕣𝕠𝕔𝕖𝕤𝕤𝕚𝕠𝕟𝕖 𝕒𝕕𝕞𝕚𝕟 🙇🏻‍♂️'
  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: promoted ? '888Promozione' : '888Retrocessione'
    },
    message: {
      locationMessage: {
        name: title,
        jpegThumbnail: Buffer.alloc(0),
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Admin;;;\nFN:Admin\nEND:VCARD'
      }
    },
    participant: '0@s.whatsapp.net'
  }
  const profileTarget = targets[0]

  if (profileTarget) {
    try {
      const pictureUrl = await conn.profilePictureUrl(profileTarget, 'image')
      const response = await fetch(pictureUrl)
      if (!response.ok) throw new Error(`Impossibile scaricare l'immagine profilo: HTTP ${response.status}`)
      fake.message.locationMessage.jpegThumbnail = await response.buffer()
    } catch (error) {
      console.warn(`[VISUALIZZA_ADMIN] Immagine profilo non disponibile: ${error.message}`)
    }
  }

  const lines = targets.map(target => moderator
    ? `${formatMention(moderator)} ${promoted ? '𝕙𝕒 𝕕𝕒𝕥𝕠 𝕚 𝕡𝕠𝕥𝕖𝕣𝕚 𝕒' : '𝕙𝕒 𝕝𝕖𝕧𝕒𝕥𝕠 𝕚 𝕡𝕠𝕥𝕖𝕣𝕚 𝕒'} ${formatMention(target)}`
    : `${formatMention(target)} ${promoted ? 'è stato promosso admin' : 'non è più admin'}`)

  await conn.sendMessage(id, {
    text: lines.join('\n'),
    mentions
  }, { quoted: fake })
}

export default handler
