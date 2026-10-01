// Plugin by elixir, punisher & 888 staff
import { isAfk, isParticipantAfk } from '../../lib/afk.js'

const handler = async (m, { conn, text, participants }) => {
  try {

    if (!m.isGroup)
      return m.reply("❌ Solo nei gruppi.")

        const senderNumber = m.sender.split('@')[0]
    const owners = global.owner || []

    const isOwner = owners.some(v => {
      if (Array.isArray(v)) return v[0] === senderNumber
      return v === senderNumber
    }) || m.isOwner

    if (!isOwner)
      return m.reply("❌ Solo l'OWNER del bot può usare questo comando.")

    if (!participants || participants.length === 0)
      return m.reply("❌ Nessun partecipante trovato.")

    if (!text && !m.quoted)
      return m.reply("❌ Inserisci numero + testo oppure rispondi a un messaggio.")

        let args = text ? text.split(" ") : []
    let count = parseInt(args[0])

    if (isNaN(count)) {
      count = 10
    }

    if (count > 30)
      return m.reply("⚠️ Massimo 30 volte per sicurezza.")

    let messageText = args.slice(1).join(" ")


    const botNumber = String(conn.user?.jid || '').split('@')[0].split(':')[0].replace(/\D+/g, '')
    let afkSkipped = 0

    const users = participants
      .filter(Boolean)
      .filter(u => {
                const ids = [u.id, u.jid, u.phoneNumber].filter(Boolean).map(v => String(v).split('@')[0].split(':')[0].replace(/\D+/g, ''))
        if (botNumber && ids.includes(botNumber)) return false
                if (isParticipantAfk(u, m.chat)) {
          afkSkipped++
          return false
        }
        return true
      })
      .map(u => conn.decodeJid(u.id ?? u.jid ?? u.phoneNumber ?? ''))
      .filter(Boolean)

    if (!users.length)
      return m.reply("❌ Nessun utente da taggare (tutti AFK o il bot e solo nel gruppo).")

    if (afkSkipped > 0) {
      await conn.sendMessage(m.chat, {
        text: `💤 ${afkSkipped} ${afkSkipped === 1 ? 'utente AFK escluso' : 'utenti AFK esclusi'} dal bigtag.`
      })
    }

    const sendTag = async () => {

      if (m.quoted) {
        const quoted = m.quoted

        if (quoted.mtype === 'imageMessage') {
          const media = await quoted.download()
          return conn.sendMessage(m.chat, {
            image: media,
            caption: messageText || quoted.text || '',
            mentions: users
          }, { quoted: m })
        }

        if (quoted.mtype === 'videoMessage') {
          const media = await quoted.download()
          return conn.sendMessage(m.chat, {
            video: media,
            caption: messageText || quoted.text || '',
            mentions: users
          }, { quoted: m })
        }

        if (quoted.mtype === 'stickerMessage') {
          const media = await quoted.download()
          return conn.sendMessage(m.chat, {
            sticker: media,
            mentions: users
          }, { quoted: m })
        }

        return conn.sendMessage(m.chat, {
          text: messageText || quoted.text || '',
          mentions: users
        }, { quoted: m })

      } else {
        return conn.sendMessage(m.chat, {
          text: messageText,
          mentions: users
        }, { quoted: m })
      }
    }

        for (let i = 0; i < count; i++) {
      await sendTag()
    }

  } catch (e) {
    console.error("Errore bigtag:", e)
    m.reply(global.errore || "❌ Si è verificato un errore.")
  }
}

handler.help = ['bigtag <numero> <testo>']
handler.tags = ['owner']
handler.command = /^(\.?bigtag)$/i
handler.group = true

export default handler
