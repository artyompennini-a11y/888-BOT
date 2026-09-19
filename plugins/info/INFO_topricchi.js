const handler = async (m, { conn, groupMetadata }) => {
  try {
    if (!m.isGroup) {
      return await conn.sendMessage(m.chat, { text: '⚠️ Questo comando funziona solo nei gruppi.' }, { quoted: m })
    }

    groupMetadata = groupMetadata || await conn.groupMetadata?.(m.chat).catch(() => null)
    const participants = groupMetadata?.participants || []

    if (!participants.length) {
      return await conn.sendMessage(m.chat, { text: '⚠️ Impossibile recuperare i membri del gruppo.' }, { quoted: m })
    }

    const groupJids = new Set(participants.map(p => p.id))
    const usersDb = global.db?.data?.users || {}
    const chatDb = global.db?.data?.chats?.[m.chat] || {}
    const topRich = chatDb.topRich || {}

    let values = []

    // 🔥 Se esiste una topRich salvata
    if (Object.keys(topRich).length > 0) {
      values = Object.entries(topRich)
        .map(([jid, total]) => ({
          jid,
          total: Number(total) || 0
        }))
        .filter(user => groupJids.has(user.jid) && user.total > 0)
    }

    // 🔥 Se non esiste, calcolo live
    if (!values.length) {
      values = [...groupJids]
        .filter(jid => jid && !jid.endsWith('@g.us'))
        .map(jid => {
          const user = usersDb[jid] || {}
          const wallet = Number(user.money) || 0
          const bank = Number(user.bank) || 0
          return {
            jid,
            wallet,
            bank,
            total: wallet + bank
          }
        })
        .filter(user => user.total > 0)
    }

    if (!values.length) {
      return await conn.sendMessage(m.chat, { text: '🪙 Nessun dato di ricchezza disponibile per i membri del gruppo.' }, { quoted: m })
    }

    // 📊 Ordina per totale
    values.sort((a, b) => b.total - a.total)

    const top = values.slice(0, 10)
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟']

    // 🏆 Rilevamento nuovo primo
    const newFirst = top[0].jid

    let chat = global.db.data.chats[m.chat]
    if (!chat) {
      global.db.data.chats[m.chat] = {}
      chat = global.db.data.chats[m.chat]
    }

    if (chat.prevFirstRich && chat.prevFirstRich !== newFirst) {
      await conn.sendMessage(m.chat, {
        text: `💰 @${newFirst.split('@')[0]} ha superato @${chat.prevFirstRich.split('@')[0]} ed è il nuovo più ricco del gruppo!`,
        mentions: [newFirst, chat.prevFirstRich]
      })
    }

    chat.prevFirstRich = newFirst

    // 🎨 Grafica minimal/premium 888
    const groupName = groupMetadata.subject || 'Gruppo'
    const header =
`💰 *TOP 10 RICCHI DEL GRUPPO*
👥 Gruppo: ${groupName}

🎁 Se sei il primo, riscatta il tuo premio con *.premiotop*

`

    const lines = top.map((user, idx) => {
      const rank = medals[idx]
      const formattedTotal = Math.floor(user.total).toLocaleString('it-IT')
      return `${rank} @${user.jid.split('@')[0]} — *${formattedTotal} 888COIN*`
    }).join('\n')

    await conn.sendMessage(m.chat, {
      text: header + lines,
      mentions: top.map(u => u.jid),
      buttons: [
        { buttonId: '.top', buttonText: { displayText: '📊 Top messaggi' }, type: 1 },
        { buttonId: '.topranks', buttonText: { displayText: '🏆 Top rank' }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })

  } catch (error) {
    console.error('Errore nel comando topricchi:', error)
    await conn.sendMessage(m.chat, { text: '❌ Errore durante l\'elaborazione della classifica.' }, { quoted: m })
  }
}

handler.help = ['topricchi', 'toprich', 'ricchi']
handler.tags = ['group', 'economy']
handler.command = ['topricchi', 'toprich', 'ricchi']

export default handler