// Plugin by Elixir & 888 staff

const auctionItems = {
  'anello': { name: '💍 Anello del Potere', price: 20000, desc: 'Oggetto leggendario, +30% difesa' },
  'corona': { name: '👑 Corona Reale', price: 30000, desc: 'Simbolo di regalità, rispettato da tutti' },
  'trono': { name: '🪑 Trono di Ferro', price: 50000, desc: 'Oggetto mitico, garantisce dominio' },
  'pietra': { name: '🔮 Pietra Filosofale', price: 40000, desc: 'Trasforma i metalli in oro' },
  'escalibur': { name: '🗡️ Escalibur', price: 45000, desc: 'La spada del re, danno +50%' },
}

let handler = async (m, { conn, text, usedPrefix, command, args, isAdmin }) => {
  const user = global.db.data.users[m.sender]
  const subCommand = (args[0] || '').toLowerCase()

  if (!m.isGroup) return m.reply('⚠️ *Le aste funzionano solo nei gruppi!*')

  if (!global.db.data.chats[m.chat].asta) {
    global.db.data.chats[m.chat].asta = { attiva: false }
  }

  if (!text || subCommand === 'lista' || subCommand === 'list') {
    const items = Object.entries(auctionItems).map(([key, item]) => {
      return `┃ ${item.name}\n┃   💰 Base: ${item.price}€ — ${item.desc}\n┃   *${usedPrefix}asta inizia ${key}*`
    }).join('\n┃━━━━━━━━━━━━━━━━━━\n')

    return m.reply(
      `🏛️ *CASA D'ASTE RPG*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Oggetti disponibili:\n` +
      `${items}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Come funziona:\n` +
      `1️⃣ Un admin avvia l'asta\n` +
      `2️⃣ I membri fanno offerte con *${usedPrefix}asta offerta [importo]*\n` +
      `3️⃣ Dopo 60 secondi vince il migliore offerente`
    )
  }

  if (subCommand === 'inizia' || subCommand === 'start') {
    if (!isAdmin && !m.isROwner && !m.isOwner) return m.reply('👑 *Solo gli admin possono avviare un\'asta!*')

    const itemKey = (args[1] || '').toLowerCase()
    const item = auctionItems[itemKey]
    if (!item) return m.reply(`⚠️ *Oggetto non trovato.* Usa ${usedPrefix}asta per vedere la lista.`)

    const asta = global.db.data.chats[m.chat].asta
    if (asta.attiva) return m.reply('⚠️ *C\'è già un\'asta in corso!*')

    asta.attiva = true
    asta.item = item
    asta.offertaCorrente = item.price
    asta.migliorOffertente = null
    asta.scadenza = Date.now() + 60000 // 60 secondi
    asta.ultimoOffertente = null

    await m.reply(
      `🔨 *ASTA INIZIATA!*\n\n` +
      `📦 *Oggetto:* ${item.name}\n` +
      `💰 *Base d'asta:* ${item.price}€\n` +
      `📝 *Descrizione:* ${item.desc}\n\n` +
      `⏱️ *Tempo: 60 secondi*\n\n` +
      `Fai la tua offerta con:\n${usedPrefix}asta offerta [importo]`
    )

    setTimeout(async () => {
      const astaData = global.db.data.chats[m.chat]?.asta
      if (!astaData || !astaData.attiva) return

      astaData.attiva = false

      if (astaData.migliorOffertente) {
        const winner = astaData.migliorOffertente
        const bidder = global.db.data.users[winner]
        if (bidder) {
          let wallet = Number(bidder.money) || 0
          let bank = Number(bidder.bank) || 0
          let remaining = astaData.offertaCorrente

          if (wallet >= remaining) {
            bidder.money = wallet - remaining
          } else {
            remaining -= wallet
            bidder.money = 0
            bidder.bank = Math.max(0, bank - remaining)
          }

          if (!bidder.inventario) bidder.inventario = {}
          const invKey = astaData.item.name.toLowerCase().replace(/\s+/g, '')
          bidder.inventario[invKey] = (bidder.inventario[invKey] || 0) + 1

          const winnerName = await conn.getName(winner)
          await conn.sendMessage(m.chat, {
            text: `🔨 *ASTA CONCLUSSA!*\n\n` +
              `👑 *Vincitore:* ${winnerName}\n` +
              `📦 *Oggetto:* ${astaData.item.name}\n` +
              `💰 *Offerta finale:* ${astaData.offertaCorrente}€\n\n` +
              `Complimenti! L'oggetto è nel tuo inventario! 🎉`
          })
        }
      } else {
        await conn.sendMessage(m.chat, { text: `🔨 *ASTA CONCLUSSA*\n\nNessuna offerta è stata fatta. L'oggetto *${astaData.item.name}* torna alla casa d'aste.` })
      }
    }, 61000)

    return
  }

  if (subCommand === 'offerta' || subCommand === 'bid') {
    const asta = global.db.data.chats[m.chat].asta
    if (!asta.attiva) return m.reply('⚠️ *Non c\'è un\'asta attiva in questo momento!*')

    const offerta = parseInt(args[1])
    if (!offerta || isNaN(offerta)) return m.reply(`⚠️ *Specifica un importo valido.*\n\nEsempio: ${usedPrefix}asta offerta 25000`)

    const totalMoney = (Number(user.money) || 0) + (Number(user.bank) || 0)
    if (offerta > totalMoney) return m.reply('❌ *Non hai abbastanza soldi per questa offerta!*')

    if (offerta <= asta.offertaCorrente) {
      return m.reply(`❌ *L'offerta deve superare ${asta.offertaCorrente}€!*`)
    }

    if (asta.migliorOffertente && asta.migliorOffertente !== m.sender) {
      const prevBidder = global.db.data.users[asta.migliorOffertente]
      if (prevBidder) {
        prevBidder.money = (Number(prevBidder.money) || 0) + asta.offertaCorrente
      }
    }

    asta.offertaCorrente = offerta
    asta.migliorOffertente = m.sender
    asta.ultimoOffertente = m.sender

    await m.reply(
      `✅ *OFFERTA REGISTRATA!*\n\n` +
      `👤 *${m.pushName}*\n` +
      `💰 *Offerta:* ${offerta}€\n` +
      `📦 *Oggetto:* ${asta.item.name}\n\n` +
      `Nuova offerta da battere: *${offerta}€* 🔨`
    )

    return
  }

  if (subCommand === 'stato' || subCommand === 'status') {
    const asta = global.db.data.chats[m.chat].asta
    if (!asta.attiva) return m.reply('⚠️ *Non c\'è un\'asta attiva in questo momento!*')

    const remaining = Math.ceil((asta.scadenza - Date.now()) / 1000)
    const migliorNome = asta.migliorOffertente ? await conn.getName(asta.migliorOffertente) : 'Nessuno'

    return m.reply(
      `🔨 *STATO ASTA*\n\n` +
      `📦 *Oggetto:* ${asta.item.name}\n` +
      `💰 *Offerta corrente:* ${asta.offertaCorrente}€\n` +
      `👑 *Miglior offerente:* ${migliorNome}\n` +
      `⏱️ *Tempo rimanente:* ${remaining}s`
    )
  }

  if (subCommand === 'annulla' || subCommand === 'cancel' || subCommand === 'stop') {
    if (!isAdmin && !m.isROwner && !m.isOwner) return m.reply('👑 *Solo gli admin possono annullare l\'asta!*')

    const asta = global.db.data.chats[m.chat].asta
    if (!asta.attiva) return m.reply('⚠️ *Non c\'è un\'asta attiva!*')

    if (asta.migliorOffertente) {
      const prevBidder = global.db.data.users[asta.migliorOffertente]
      if (prevBidder) {
        prevBidder.money = (Number(prevBidder.money) || 0) + asta.offertaCorrente
      }
    }

    asta.attiva = false
    return m.reply('🛑 *Asta annullata.*\n\nEventuali offerte sono state rimborsate.')
  }

  return m.reply(`⚠️ *Comando non valido.*\n\nUsa:\n• ${usedPrefix}asta — lista oggetti\n• ${usedPrefix}asta inizia [oggetto] (admin)\n• ${usedPrefix}asta offerta [importo]\n• ${usedPrefix}asta stato\n• ${usedPrefix}asta annulla (admin)`)
}

handler.help = ['asta']
handler.tags = ['rpg']
handler.command = /^(asta)$/i
handler.group = true

export default handler
