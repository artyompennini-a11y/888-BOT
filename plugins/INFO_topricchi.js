const handler = async (m, { conn, groupMetadata }) => {
  try {
    // 1. Verifica che sia un gruppo
    if (!m.isGroup) {
      return await conn.sendMessage(m.chat, { text: '⚠️ Questo comando funziona solo nei gruppi.' }, { quoted: m })
    }

    // 2. Recupero dei partecipanti
    groupMetadata = groupMetadata || await conn.groupMetadata?.(m.chat).catch(() => null)
    const participants = groupMetadata?.participants || []

    if (!participants.length) {
      return await conn.sendMessage(m.chat, { text: '⚠️ Impossibile recuperare i membri del gruppo.' }, { quoted: m })
    }

    // Set dei JID dei partecipanti per controlli rapidi
    const groupJids = new Set(participants.map(p => p.id))

    // 3. Recupero Dati dal Database
    const usersDb = global.db?.data?.users || {}
    const chatDb = global.db?.data?.chats?.[m.chat] || {}
    const topRich = chatDb.topRich || {}

    let values = []

    // Se esiste già una topRich salvata per la chat
    if (Object.keys(topRich).length > 0) {
      values = Object.entries(topRich)
        .map(([jid, total]) => ({
          jid,
          total: Number(total) || 0
        }))
        // Mostra solo chi è ancora presente nel gruppo e ha un totale > 0
        .filter(user => groupJids.has(user.jid) && user.total > 0)
    }

    // Se non c'è una topRich salvata, calcola i dati live dai membri del gruppo
    if (!values.length) {
      values = participants
        .map(p => p.id)
        .filter(jid => jid && !jid.endsWith('@g.us')) // Esclude eventuali ID di sistema/bot
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

    // 4. Se non ci sono dati di ricchezza
    if (!values.length) {
      return await conn.sendMessage(m.chat, { text: '🪙 Nessun dato di ricchezza disponibile per i membri di questo gruppo.' }, { quoted: m })
    }

    // 5. Ordinamento Decrescente
    values.sort((a, b) => b.total - a.total)

    // Prendi solo i primi 10
    const top = values.slice(0, 10)
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

    // 6. Costruzione del messaggio
    const groupName = groupMetadata.subject || 'Gruppo'
    const header = `💰 *TOP 10 RICCHI DEL GRUPPO*\n` +
                   `👥 *Gruppo:* ${groupName}\n` +
                   `📌 *Totale:* Contanti + Banca\n\n`

    const lines = top.map((user, idx) => {
      const rank = medals[idx] || `${idx + 1}.`
      const formattedTotal = Math.floor(user.total).toLocaleString('it-IT')
      return `${rank} @${user.jid.split('@')[0]} — *${formattedTotal}€*`
    }).join('\n')

    // 7. Invio del messaggio con Menzioni
    await conn.sendMessage(m.chat, {
      text: header + lines,
      mentions: top.map(user => user.jid)
    }, { quoted: m })

  } catch (error) {
    console.error('Errore nel comando topricchi:', error)
    await conn.sendMessage(m.chat, { text: '❌ Si è verificato un errore durante l\'elaborazione della classifica.' }, { quoted: m })
  }
}

handler.help = ['topricchi', 'toprich', 'ricchi']
handler.tags = ['group', 'economy']
handler.command = ['topricchi', 'toprich', 'ricchi']

export default handler