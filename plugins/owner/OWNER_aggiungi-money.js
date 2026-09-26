//Plugin by Elixir, Punisher & 888 staff

const handler = async (m, { conn, text }) => {
  const mention = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)
  if (!mention) return m.reply('Inserisci la menzione o rispondi al messaggio dell\'utente!')

  const user = global.db.data.users[mention]
  if (!user) return m.reply('Utente non trovato nel database!')

  const args = String(text || '').trim().split(/\s+/).filter(Boolean)
  const numCoin = Number(args.find(arg => /^\d+$/.test(arg)))
  const account = args.some(arg => /^(banca|bank|carta)$/i.test(arg)) ? 'bank' : 'money'

  if (!Number.isSafeInteger(numCoin) || numCoin <= 0) {
    return m.reply('Inserisci un numero valido di coin da aggiungere!')
  }

  user[account] = (Number(user[account]) || 0) + numCoin

  return conn.reply(
    m.chat,
    `✅ Ho aggiunto *${numCoin} 888COIN* al ${account === 'bank' ? 'conto bancario' : 'portafoglio'} di @${mention.split('@')[0]}.
💳 Banca: *${Number(user.bank) || 0} 888COIN*
💼 Portafoglio: *${Number(user.money) || 0} 888COIN*`,
    m,
    { mentions: [mention] }
  )
}

handler.command = /^(addcoin)$/i
handler.help = ['addcoin @tag']
handler.tags = ['owner']
handler.rowner = true

export default handler