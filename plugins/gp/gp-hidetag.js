// Plugin by elixir & punisher
import { ROLES, LIMITS, resolveRole, canUse, logModAction } from '../../lib/moderation.js'

const handler = async (m, { conn, text, participants, isOwner, isROwner, isAdmin, isMods }) => {
  try {
    if (m.fromMe || m.sender === conn.user.jid) return

    const role = resolveRole({ isOwner, isROwner, isAdmin, isMods })
    if (!canUse(role, ROLES.MOD)) {
      return conn.reply(m.chat, '⛔ Questo comando è riservato allo staff (Moderatori/Admin/Owner).', m)
    }

    const maxMentions = role === ROLES.MOD ? LIMITS.MOD_HIDETAG_MAX : Infinity

    const users = participants.map(u => conn.decodeJid(u.id))

    const afkState = global.afkState || {}
    const botJid = conn.user.jid
    let afkSkipped = 0
    let usersFiltered = users.filter(jid => {
      if (jid === botJid) return false
      const afkEntry = afkState[jid]
      if (!afkEntry) return true

      if (afkEntry.scope === 'all' || afkEntry.chat === m.chat) {
        afkSkipped++
        return false
      }
      return true
    })
    m.__afkSkipped = afkSkipped

    let hidetagTrimmed = 0
    if (Number.isFinite(maxMentions) && usersFiltered.length > maxMentions) {
      hidetagTrimmed = usersFiltered.length - maxMentions
      usersFiltered = usersFiltered.slice(0, maxMentions)
    }
    m.__hidetagTrimmed = hidetagTrimmed
    m.__hidetagRole = role
    logModAction({
      role,
      actor: m.sender,
      action: 'hidetag',
      target: '',
      extra: `${usersFiltered.length} menzioni${hidetagTrimmed ? ` (limite moderatori, ${hidetagTrimmed} escluse)` : ''}`
    })

    const quoted = m.quoted

    const isViewOnce =
      quoted?.message?.viewOnceMessage ||
      quoted?.message?.viewOnceMessageV2 ||
      quoted?.message?.viewOnceMessageV2Extension ||
      quoted?.viewOnce

    if (quoted && !quoted?.pollMessage && isViewOnce) {
      return m.reply("❌ Non puoi usare hidetag su messaggi a visualizzazione singola.")
    }

    if (quoted) {
      const type = quoted.mtype
      const mediaTypes = [
        "imageMessage",
        "videoMessage",
        "audioMessage",
        "documentMessage",
        "stickerMessage",
      ]

      const pollTypes = [
        "pollCreationMessage",
        "pollCreationMessageV2",
        "pollCreationMessageV3",
      ]
      const poll = pollTypes.includes(type) ? quoted : quoted.pollMessage

      if (poll) {
        const q = poll.name || ""
        const opts = (poll.options || []).map((o) => ({
          optionName: (o && o.optionName) || "",
        }))
        const multi =
          typeof poll.selectableOptionsCount === "number"
            ? poll.selectableOptionsCount
            : 1

        try {
          await conn.relayMessage(
            m.chat,
            {
              pollCreationMessage: {
                name: q,
                options: opts,
                selectableOptionsCount: multi,
              },
            },
            { mentions: usersFiltered, quoted: m }
          )
        } catch (relayErr) {
          console.error("[hidetag] poll relay error:", relayErr)
          await conn.sendMessage(m.chat, {
            pollCreationMessage: {
              name: q,
              options: opts,
              selectableOptionsCount: multi,
            },
            mentions: usersFiltered
          }, { quoted: m })
        }
        return
      }

      let media = null
      if (mediaTypes.includes(type)) {
        media = await quoted.download().catch((err) => {
          console.error("[hidetag] download error:", err)
          return null
        })
      }

      switch (type) {
        case "imageMessage":
          return conn.sendMessage(m.chat, {
            image: media,
            caption: text || quoted.text || "",
            mentions: usersFiltered
          }, { quoted: m })

        case "videoMessage":
          return conn.sendMessage(m.chat, {
            video: media,
            caption: text || quoted.text || "",
            mentions: usersFiltered
          }, { quoted: m })

        case "audioMessage":
          return conn.sendMessage(m.chat, {
            audio: media,
            mimetype: "audio/mp4",
            mentions: usersFiltered
          }, { quoted: m })

        case "documentMessage":
          return conn.sendMessage(m.chat, {
            document: media,
            mimetype: quoted.mimetype,
            fileName: quoted.fileName,
            caption: text || quoted.text || "",
            mentions: usersFiltered
          }, { quoted: m })

        case "stickerMessage":
          await conn.sendMessage(m.chat, {
            sticker: media,
          }, { quoted: m })
          if (usersFiltered.length > 0) {
            await conn.sendMessage(m.chat, {
              text: usersFiltered.map((jid) => `@${jid.split("@")[0]}`).join(" "),
              mentions: usersFiltered
            })
          }
          return

        default:
          return conn.sendMessage(m.chat, {
            text: text || quoted.text || "",
            mentions: usersFiltered
          }, { quoted: m })
      }
    }

    if (text) {
      return conn.sendMessage(m.chat, {
        text,
        mentions: usersFiltered
      }, { quoted: m })
    }

    return m.reply("❌ Inserisci testo o rispondi a un messaggio.")
  } catch (e) {
    console.error("Errore hidetag:", e)
    m.reply("❌ Errore interno.")
  }
}

handler.after = async function (m, { conn, isOwner, isROwner, isAdmin, isMods }) {
  if (!m.isGroup) return

  const role = m.__hidetagRole || resolveRole({ isOwner, isROwner, isAdmin, isMods })
  const skipped = typeof m.__afkSkipped === 'number' ? m.__afkSkipped : 0
  const trimmed = typeof m.__hidetagTrimmed === 'number' ? m.__hidetagTrimmed : 0
  delete m.__afkSkipped
  delete m.__hidetagTrimmed
  delete m.__hidetagRole

  try {
    if (trimmed > 0) {
      await conn.sendMessage(m.chat, {
        text:
          `⚠️ *Limite menzioni moderatori*\n` +
          `👥 Menzioni inviate: ${LIMITS.MOD_HIDETAG_MAX}\n` +
          `🚫 Menzioni escluse: ${trimmed}\n` +
          `ℹ️ Solo Admin/Owner possono menzionare tutti i membri.`
      }, { quoted: m })
    }
    if (skipped > 0) {
      await conn.sendMessage(m.chat, {
        text: `💤 ${skipped} ${skipped === 1 ? 'utente AFK non è stato taggato' : 'utenti AFK non sono stati taggati'}.`
      }, { quoted: m })
    }
  } catch {}
}

handler.help = ["hidetag", "totag", "tag"]
handler.tags = ["gruppo"]
handler.command = /^(\.?hidetag|\.?totag|\.?tag)$/i
handler.mods = true
handler.group = true
handler.botAdmin = true

export default handler
