//Plugin by Gab, Lucifero & 888 staff



const handler = async (m, { conn, text, participants, isOwner }) => {
  try {

    if (m.fromMe) return
    if (m.sender === conn.user.jid) return

    if (text && text.trim().split(" ").length > 1 && text.includes(".tag")) return

    // LIMITATORE .tag: max 6 usi/giorno per GRUPPO (contatore condiviso tra admin e mod), owner esclusi
    const MAX_TAGS = 6;
    const RESET_INTERVAL = 24 * 60 * 60 * 1000;
    if (m.isGroup && !isOwner) {
      if (!global.db.data) await global.loadDatabase();
      const chatDb = global.db.data.chats[m.chat];
      if (chatDb) {
        const now = Date.now();
        chatDb.tagCount ??= 0;
        if (!chatDb.tagLastReset || now - chatDb.tagLastReset >= RESET_INTERVAL) {
          chatDb.tagCount = 0;
          chatDb.tagLastReset = now;
          if (typeof global.markDbDirty === 'function') global.markDbDirty();
        }
        if (chatDb.tagCount >= MAX_TAGS) {
          const remainingMs = RESET_INTERVAL - (now - (chatDb.tagLastReset || now));
          const remainingH = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));
          return conn.sendMessage(m.chat, {
            text: '🚫 *Limite tag giornalieri raggiunto!*\n\nSono stati utilizzati tutti e ' + MAX_TAGS + ' i tag giornalieri di questo gruppo.\nProssimo reset: tra circa ' + remainingH + ' ora/e.'
          }, { quoted: m });
        }
        chatDb.tagCount = (chatDb.tagCount || 0) + 1;
        m.__tagRemaining = MAX_TAGS - chatDb.tagCount;
        if (typeof global.markDbDirty === 'function') global.markDbDirty();
      }
    }

    const users = participants.map(u => conn.decodeJid(u.id))
    const quoted = m.quoted
  
    const isViewOnce =
      quoted?.message?.viewOnceMessage ||
      quoted?.message?.viewOnceMessageV2 ||
      quoted?.message?.viewOnceMessageV2Extension ||
      quoted?.viewOnce ||
      quoted?.type === 'viewOnceMessage'
  
    if (quoted && isViewOnce) {
      return m.reply("❌ Non puoi usare hidetag su contenuti a visualizzazione singola (presto toglieremo questo blocco)")
    }
  
    if (quoted) {
  
      if (quoted.mtype === 'imageMessage') {
        const media = await quoted.download()
        return await conn.sendMessage(m.chat, {
          image: media,
          caption: text || quoted.text || '',
          mentions: users
        }, { quoted: m })
      }
  
      if (quoted.mtype === 'videoMessage') {
        const media = await quoted.download()
        return await conn.sendMessage(m.chat, {
          video: media,
          caption: text || quoted.text || '',
          mentions: users
        }, { quoted: m })
      }
  
      if (quoted.mtype === 'audioMessage') {
        const media = await quoted.download()
        return await conn.sendMessage(m.chat, {
          audio: media,
          mimetype: 'audio/mp4',
          mentions: users
        }, { quoted: m })
      }
  
      if (quoted.mtype === 'documentMessage') {
        const media = await quoted.download()
        return await conn.sendMessage(m.chat, {
          document: media,
          mimetype: quoted.mimetype,
          fileName: quoted.fileName,
          caption: text || quoted.text || '',
          mentions: users
        }, { quoted: m })
      }
  
      if (quoted.mtype === 'stickerMessage') {
        const media = await quoted.download()
        return await conn.sendMessage(m.chat, {
          sticker: media,
          mentions: users
        }, { quoted: m })
      }
  
      return await conn.sendMessage(m.chat, {
        text: quoted.text || text || '',
        mentions: users
      }, { quoted: m })
    }
  
    if (text) {
      return await conn.sendMessage(m.chat, {
        text,
        mentions: users
      }, { quoted: m })
    }
  
    return m.reply('❌ Inserisci testo o rispondi a qualcosa')
  
  } catch (e) {
    console.error('Errore hidetag:', e)
    m.reply('❌ errore')
  }
}

// Notifica i tag giornalieri rimanenti dopo l'uso (admin/mod, owner esclusi)
handler.after = async function (m, { conn, isOwner }) {
  if (!m.isGroup || isOwner) return
  if (typeof m.__tagRemaining !== 'number') return
  const remaining = m.__tagRemaining
  delete m.__tagRemaining
  try {
    await conn.sendMessage(m.chat, {
      text: remaining > 0
        ? `📊 *Tag giornalieri rimanenti:* ${remaining}/6`
        : '⚠️ *Ultimo tag disponibile utilizzato!*\nI tag di questo gruppo torneranno disponibili tra 24 ore.'
    }, { quoted: m })
  } catch {}
}

handler.help = ['hidetag', 'totag', 'tag']
handler.tags = ['gruppo']
handler.command = /^(\.?hidetag|totag|tag)$/i
handler.mods = true
handler.group = true
handler.botAdmin = true

export default handler