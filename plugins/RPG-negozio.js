// Plugin by Elixir & 888 staff

const shopItems = {
  'pozione': { name: '🧪 Pozione', price: 500, desc: 'Ripristina la salute nel duello', type: 'oggetto' },
  'superpozione': { name: '💊 Super Pozione', price: 1200, desc: 'Ripristina più salute', type: 'oggetto' },
  'scudo': { name: '🛡️ Scudo', price: 2000, desc: 'Protegge da una rapina', type: 'oggetto' },
  'spada': { name: '⚔️ Spada', price: 3000, desc: 'Aumenta il danno nei duelli', type: 'oggetto' },
  'bacchetta': { name: '🪄 Bacchetta Magica', price: 5000, desc: 'Dà un vantaggio magico', type: 'oggetto' },
  'martello': { name: '🔨 Martello', price: 2500, desc: 'Usato nella miniera, +50% ricavi', type: 'oggetto' },
  'piccone': { name: '⛏️ Piccone', price: 800, desc: 'Necessario per la miniera', type: 'oggetto' },
  'fortuna': { name: '🍀 Amuleto Fortuna', price: 7000, desc: '+20% vincite al casinò', type: 'oggetto' },
  'ruolocustom': { name: '🏷️ Ruolo Custom', price: 15000, desc: 'Scegli un titolo personalizzato', type: 'ruolo' },
  'badgeoro': { name: '🥇 Badge Oro', price: 10000, desc: 'Badge esclusivo da mostrare', type: 'badge' },
  'badgediamante': { name: '💎 Badge Diamante', price: 25000, desc: 'Badge rarissimo', type: 'badge' },
}

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
  const user = global.db.data.users[m.sender]
  const subCommand = (args[0] || '').toLowerCase()

  if (!text || subCommand === 'lista' || subCommand === 'list') {
    const items = Object.entries(shopItems).map(([key, item]) => {
      return `┃ ${item.name}\n┃   💰 ${item.price}€ — ${item.desc}\n┃   *${usedPrefix}negozio compra ${key}*`
    }).join('\n┃━━━━━━━━━━━━━━━━━━\n')

    const money = (Number(user.money) || 0) + (Number(user.bank) || 0)

    return m.reply(
      `🛒 *NEGOZIO RPG*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 *${m.pushName}*\n` +
      `💰 *Soldi disponibili:* ${money}€\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `${items}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦 *Per vedere il tuo inventario:* ${usedPrefix}negozio inventario`
    )
  }

  if (subCommand === 'compra' || subCommand === 'buy') {
    const itemKey = (args[1] || '').toLowerCase()
    const item = shopItems[itemKey]
    if (!item) return m.reply(`⚠️ *Oggetto non trovato.* Usa ${usedPrefix}negozio per vedere la lista.`)

    const money = (Number(user.money) || 0) + (Number(user.bank) || 0)
    if (money < item.price) {
      const missing = item.price - money
      return m.reply(`❌ *Soldi insufficienti!*\n\nTi mancano *${missing}€* per comprare ${item.name}.`)
    }

    let wallet = Number(user.money) || 0
    let bank = Number(user.bank) || 0
    let remaining = item.price

    if (wallet >= remaining) {
      user.money = wallet - remaining
    } else {
      remaining -= wallet
      user.money = 0
      user.bank = bank - remaining
    }

    if (!user.inventario) user.inventario = {}
    user.inventario[itemKey] = (user.inventario[itemKey] || 0) + 1

    if (item.type === 'ruolo' && !args[2]) {
      return m.reply(`⚠️ *Specifica il ruolo che vuoi!*\n\nEsempio: ${usedPrefix}negozio compra ruolocustom Grand Mago`)
    }
    if (item.type === 'ruolo' && args[2]) {
      const customRole = args.slice(2).join(' ')
      user.customRole = customRole
      return m.reply(`✅ *Acquisto riuscito!*\n\n${item.name}\n💰 -${item.price}€\n\nIl tuo nuovo ruolo è: *${customRole}*`)
    }

    return m.reply(
      `✅ *ACQUISTO RIUSCITO!*\n\n` +
      `📦 *Oggetto:* ${item.name}\n` +
      `💰 *Prezzo:* -${item.price}€\n` +
      `📝 *Descrizione:* ${item.desc}\n\n` +
      `Inventario aggiornato! Usa ${usedPrefix}negozio inventario per vederlo.`
    )
  }

  if (subCommand === 'inventario' || subCommand === 'inv') {
    const inventario = user.inventario || {}
    const items = Object.entries(inventario).filter(([, qty]) => qty > 0)

    if (items.length === 0) {
      return m.reply('📦 *Il tuo inventario è vuoto.*\n\nUsa ' + usedPrefix + 'negozio per comprare qualcosa!')
    }

    const inventoryList = items.map(([key, qty]) => {
      const item = shopItems[key]
      if (!item) return ''
      return `┃ ${item.name} x${qty}`
    }).filter(Boolean).join('\n')

    const customRole = user.customRole ? `\n🏷️ *Ruolo custom:* ${user.customRole}` : ''

    return m.reply(
      `📦 *IL TUO INVENTARIO*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 *${m.pushName}*\n` +
      `${inventoryList}\n` +
      `${customRole}\n` +
      `━━━━━━━━━━━━━━━━━━`
    )
  }

  if (subCommand === 'vendi' || subCommand === 'sell') {
    const itemKey = (args[1] || '').toLowerCase()
    const item = shopItems[itemKey]
    if (!item) return m.reply('⚠️ *Oggetto non trovato.*')

    if (!user.inventario?.[itemKey] || user.inventario[itemKey] <= 0) {
      return m.reply(`❌ *Non possiedi ${item.name}!*`)
    }

    const sellPrice = Math.floor(item.price * 0.6)
    user.inventario[itemKey]--
    user.money = (Number(user.money) || 0) + sellPrice

    return m.reply(
      `💰 *VENDITA RIUSCITA!*\n\n` +
      `📦 *Oggetto:* ${item.name}\n` +
      `💵 *Ricavato:* +${sellPrice}€`
    )
  }

  return m.reply(`⚠️ *Comando non valido.*\n\nUsa:\n• ${usedPrefix}negozio — lista oggetti\n• ${usedPrefix}negozio compra [oggetto]\n• ${usedPrefix}negozio inventario\n• ${usedPrefix}negozio vendi [oggetto]`)
}

handler.help = ['negozio', 'shop']
handler.tags = ['rpg']
handler.command = /^(negozio|shop)$/i

export default handler
