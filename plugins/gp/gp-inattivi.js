//Plugin by punisher, elixir & 888 staff

let handler = async (m, { conn, text, args, groupMetadata, isAdmin, isOwner }) => {
  await conn.sendPresenceUpdate('composing', m.chat)

  let total = 0
  let sider = []
  let adesso = Date.now()
  let tempoInattivita = 2 * 60 * 60 * 1000 

  if (!global.db.data) global.db.data = {}
  if (!global.db.data.users) global.db.data.users = {}

  if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {}
  global.db.data.users[m.sender].lastseen = adesso

  let member = groupMetadata.participants.map(v => v.id)

  for (let jid of member) {
    if (jid === conn.user.jid) continue

    let userGroupData = groupMetadata.participants.find(u => u.id === jid)
    if (userGroupData?.admin || userGroupData?.isSuperAdmin) continue

    let userData = global.db.data.users[jid]
    let ultimoMessaggio = userData?.lastseen || 0
    let isWhitelist = userData?.whitelist === true
    let isBanned = userData?.banned === true

    let eInattivo = (ultimoMessaggio === 0) || (adesso - ultimoMessaggio > tempoInattivita)

    if (eInattivo && !isWhitelist && !isBanned) {
      total++
      sider.push(jid)
    }
  }

  // MENU PRINCIPALE — Grafica Premium 888
  if (!args[0]) {
    return conn.sendMessage(m.chat, {
      text: `
😴 *GESTIONE INATTIVI 888*

Totale inattivi: *${total}/${member.length}*
Non scrivono da più di *2 ore*.

Scegli un'azione:
`.trim(),
      buttons: [
        { buttonId: `.inattivi lista`, buttonText: { displayText: "📋 Lista inattivi" }, type: 1 },
        { buttonId: `.inattivi rimuovi`, buttonText: { displayText: "🗑️ Rimuovi inattivi" }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }

  // LISTA — Grafica Premium 888
  if (args[0] === 'lista') {
    if (!isAdmin && !isOwner)
      return conn.reply(m.chat, '❌ Solo gli admin possono vedere la lista.', m)

    if (total === 0)
      return conn.reply(m.chat, '✨ Nessun inattivo rilevato.', m)

    return conn.sendMessage(m.chat, {
      text: `
📋 *INATTIVI RILEVATI*

Totale: *${sider.length}*

${sider.map(v => `• @${v.split('@')[0]}`).join('\n')}
`.trim(),
      buttons: [
        { buttonId: `.inattivi rimuovi`, buttonText: { displayText: "🗑️ Rimuovi tutti" }, type: 1 },
        { buttonId: `.inattivi`, buttonText: { displayText: "🔄 Torna al menu" }, type: 1 }
      ],
      headerType: 1,
      contextInfo: { mentionedJid: sider }
    }, { quoted: m })
  }

  // RIMOZIONE — Grafica Premium 888
  if (args[0] === 'rimuovi') {
    if (!isAdmin && !isOwner)
      return conn.reply(m.chat, '❌ Solo gli admin possono rimuovere gli inattivi.', m)

    if (total === 0)
      return conn.reply(m.chat, '✨ Non ci sono inattivi da rimuovere.', m)

    return conn.sendMessage(m.chat, {
      text: `
⚠️ *CONFERMA RIMOZIONE*

Vuoi rimuovere *${total} utenti* inattivi?
`.trim(),
      buttons: [
        { buttonId: `.inattivi conferma`, buttonText: { displayText: "✅ Conferma" }, type: 1 },
        { buttonId: `.inattivi`, buttonText: { displayText: "❌ Annulla" }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }

  // CONFERMA — Grafica Premium 888
  if (args[0] === 'conferma') {
    if (!isAdmin && !isOwner)
      return conn.reply(m.chat, '❌ Solo gli admin possono rimuovere gli inattivi.', m)

    if (total === 0)
      return conn.reply(m.chat, '✨ Nessun utente da rimuovere.', m)

    await conn.reply(m.chat, `⏳ Rimozione di ${sider.length} utenti in corso...`, m)

    let removedCount = 0
    for (const user of sider) {
      try {
        await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
        removedCount++
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (e) {
        console.error(e)
      }
    }

    return conn.sendMessage(m.chat, {
      text: `
📋 *RESOCONTO RIMOZIONE*

Utenti rimossi: *${removedCount}*
`.trim(),
      buttons: [
        { buttonId: `.inattivi`, buttonText: { displayText: "🔄 Torna al menu" }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }

  return conn.reply(m.chat, '❌ Opzione non valida.', m)
}

handler.help = ['inattivi']
handler.tags = ['gruppo']
handler.command = /^(inattivi)$/i
handler.group = true
handler.botAdmin = true

export default handler