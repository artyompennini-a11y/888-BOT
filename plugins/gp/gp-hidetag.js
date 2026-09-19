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
    const quoted = m.quoted

    const isViewOnce =
      quoted?.message?.viewOnceMessage ||
      quoted?.message?.viewOnceMessageV2 ||
      quoted?.message?.viewOnceMessageV2Extension ||
      quoted?.viewOnce

    if (quoted && isViewOnce) {
      return m.reply("❌ Non puoi usare hidetag su messaggi a visualizzazione singola.")
    }

    if (quoted) {
      const type = quoted.mtype
      const mediaTypes = ["imageMessage", "videoMessage", "audioMessage", "documentMessage", "stickerMessage"]
      const base = { mentions: users }

      // Scarica il media SOLO se il messaggio quotato è effettivamente un media.
      // Evita di chiamare download() su messaggi di testo semplice, che causava il crash.
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
            ...base
          }, { quoted: m })

        case "videoMessage":
          return conn.sendMessage(m.chat, {
            video: media,
            caption: text || quoted.text || "",
            ...base
          }, { quoted: m })

        case "audioMessage":
          return conn.sendMessage(m.chat, {
            audio: media,
            mimetype: "audio/mp4",
            ...base
          }, { quoted: m })

        case "documentMessage":
          return conn.sendMessage(m.chat, {
            document: media,
            mimetype: quoted.mimetype,
            fileName: quoted.fileName,
            caption: text || quoted.text || "",
            ...base
          }, { quoted: m })

        case "stickerMessage":
          return conn.sendMessage(m.chat, {
            sticker: media,
            ...base
          }, { quoted: m })

        default:
          // testo semplice o altro tipo non gestito: nessun download, solo testo + tag
          return conn.sendMessage(m.chat, {
            text: text || quoted.text || "",
            ...base
          }, { quoted: m })
      }
    }

    if (text) {
      return conn.sendMessage(m.chat, {
        text,
        mentions: users
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