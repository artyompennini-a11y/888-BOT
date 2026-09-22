// Plugin by Elixir
const handler = async (m, { conn, text, participants, isOwner }) => {
  try {
    if (m.fromMe || m.sender === conn.user.jid) return

    const MAX_TAGS = 6
    const RESET_INTERVAL = 24 * 60 * 60 * 1000

    if (m.isGroup && !isOwner) {
      if (!global.db.data) await global.loadDatabase()
      const chatDb = global.db.data.chats[m.chat]

      if (chatDb) {
        const now = Date.now()

        if (chatDb.tagCount == null) chatDb.tagCount = 0
        if (chatDb.tagLastReset == null) chatDb.tagLastReset = now

        if (now - chatDb.tagLastReset >= RESET_INTERVAL) {
          chatDb.tagCount = 0
          chatDb.tagLastReset = now
          if (typeof global.markDbDirty === "function") global.markDbDirty()
        }

        if (chatDb.tagCount >= MAX_TAGS) {
          const remainingMs = RESET_INTERVAL - (now - chatDb.tagLastReset)
          const remainingH = Math.max(1, Math.ceil(remainingMs / 3600000))

          return conn.sendMessage(m.chat, {
            text: `🚫 Limite tag giornalieri raggiunto.\nReset tra circa ${remainingH} ora/e.`
          }, { quoted: m })
        }

        chatDb.tagCount++
        m.__tagRemaining = MAX_TAGS - chatDb.tagCount
        if (typeof global.markDbDirty === "function") global.markDbDirty()
      }
    }

    const users = participants.map(u => conn.decodeJid(u.id))

    // Filtra gli utenti AFK — collegamento perfetto con gp-afk.js
    const afkState = global.afkState || {}
    const botJid = conn.user.jid
    const usersFiltered = users.filter(jid => {
      if (jid === botJid) return false
      const afkEntry = afkState[jid]
      if (!afkEntry) return true
      // Se scope è 'all' o se l'utente AFK è nello stesso gruppo, lo saltiamo
      if (afkEntry.scope === 'all' || afkEntry.chat === m.chat) return false
      return true
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

handler.after = async function (m, { conn, isOwner }) {
  if (!m.isGroup || isOwner) return
  if (typeof m.__tagRemaining !== "number") return

  const remaining = m.__tagRemaining
  delete m.__tagRemaining

  try {
    if (remaining > 0) {
      await conn.sendMessage(m.chat, {
        text: `📊 Tag rimanenti: ${remaining}/6`
      }, { quoted: m })
    } else {
      const RESET_INTERVAL = 24 * 60 * 60 * 1000
      const chatDb = global.db.data.chats[m.chat]
      const now = Date.now()
      const remainingMs = RESET_INTERVAL - (now - (chatDb?.tagLastReset ?? now))
      const remainingH = Math.max(1, Math.ceil(remainingMs / 3600000))

      await conn.sendMessage(m.chat, {
        text: `⚠️ Ultimo tag disponibile. Reset tra circa ${remainingH} ora/e.`
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
