// Plugin by elixir, punisher & 888 staff
import { v4 as uuidv4 } from 'uuid'

const STATUS = {
  open: { label: 'Aperto', badge: '\u{1F7E2}' },
  pending: { label: 'In attesa', badge: '\u{1F7E1}' },
  closed: { label: 'Chiuso', badge: '⚫' }
}

const store = () => {
  global.db.data.tickets ??= {}
  return global.db.data.tickets
}

const shortId = (id) => String(id).slice(0, 8).toUpperCase()

const fmtDate = (ts) => new Date(ts).toLocaleString('it-IT', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

const findTicket = (code) => {
  const all = store()
  const key = String(code || '').toUpperCase().replace(/^#/, '')
  return Object.values(all).find(t => shortId(t.id) === key) || null
}

const handler = async (m, { conn, text, args, usedPrefix, isAdmin, isOwner, isROwner }) => {
  if (!m.isGroup) return m.reply('❌ Solo nei gruppi.')
  const all = store()
  const sub = (args?.[0] || '').toLowerCase()
  const isStaff = isAdmin || isOwner || isROwner
  // m.text contiene il comando completo: serve per "ticket nuovo <descrizione>"
  const raw = String(m.text || text || '').trim()
  const body = raw.replace(/^\.?(ticket)\s*/i, '').trim()

  if (!sub || sub === 'help' || sub === 'aiuto') {
    return m.reply(
`🎫 *TICKET 888*

Apri un ticket di supporto nel gruppo.

${usedPrefix}ticket nuovo <descrizione>
${usedPrefix}ticket list — i tuoi ticket aperti
${usedPrefix}ticket chiudi <ID> — chiudi un tuo ticket
${usedPrefix}ticket <ID> — dettagli di un ticket
${usedPrefix}ticket staff — coda completa (admin)`
    )
  }

  if (sub === 'nuovo' || sub === 'new' || sub === 'apri') {
    const desc = body.replace(/^(nuovo|new|apri)\s+/i, '').trim()
    if (!desc) return m.reply(`❌ Descrivi il problema.\nEsempio: *${usedPrefix}ticket nuovo Non riesco ad accedere*`)
    const rec = {
      id: uuidv4(),
      chat: m.chat,
      author: m.sender,
      authorName: m.pushName || 'Utente',
      text: desc,
      status: 'open',
      at: Date.now(),
      updated: Date.now(),
      replies: []
    }
    all[rec.id] = rec
    global.markDbDirty?.()
    return m.reply(
`🎫 *TICKET APERTO*
━━━━━━━━━━━━━━━━━━━━━
🔖 ID: *#${shortId(rec.id)}*
👤 Autore: @${m.sender.split('@')[0]}
📝 ${desc}
━━━━━━━━━━━━━━━━━━━━━
🕒 ${fmtDate(rec.at)}

_Lo staff ti risponderà. Usa #${shortId(rec.id)} per lo stato._`,
      { mentions: [m.sender] }
    )
  }

  if (sub === 'list' || sub === 'lista' || sub === 'miei') {
    const mine = Object.values(all).filter(t => t.chat === m.chat && t.author === m.sender)
    const open = mine.filter(t => t.status !== 'closed')
    if (!open.length) return m.reply('✅ Non hai ticket aperti.')
    const lines = open.map(t => `${STATUS[t.status].badge} *#${shortId(t.id)}* — ${t.text.slice(0, 50)}\n   🕒 ${fmtDate(t.updated)}`)
    return m.reply(`🎫 *I tuoi ticket aperti*\n\n${lines.join('\n\n')}`)
  }

  if (sub === 'staff' || sub === 'coda') {
    if (!isStaff) return m.reply('⛔ Solo admin/owner possono vedere la coda.')
    const open = Object.values(all).filter(t => t.chat === m.chat && t.status !== 'closed')
    if (!open.length) return m.reply('✅ Coda vuota, nessun ticket aperto.')
    const lines = open.map(t => `${STATUS[t.status].badge} *#${shortId(t.id)}* — @${t.author.split('@')[0]}\n   📝 ${t.text.slice(0, 60)}`)
    const mentions = open.map(t => t.author)
    return m.reply(`🎫 *Coda ticket*\n\n${lines.join('\n\n')}\n\n👥 Totale: *${open.length}*`, { mentions })
  }

  if (sub === 'chiudi' || sub === 'close') {
    const rec = findTicket(args[1])
    if (!rec) return m.reply('❌ Ticket non trovato.')
    if (rec.chat !== m.chat) return m.reply('❌ Ticket di un altro gruppo.')
    if (rec.author !== m.sender && !isStaff) return m.reply('⛔ Solo chi ha aperto il ticket (o lo staff) può chiuderlo.')
    if (rec.status === 'closed') return m.reply('⚫ Ticket già chiuso.')
    rec.status = 'closed'
    rec.updated = Date.now()
    global.markDbDirty?.()
    return m.reply(`⚫ Ticket *#${shortId(rec.id)}* chiuso.`)
  }

  if (sub === 'rispondi' || sub === 'reply') {
    const rec = findTicket(args[1])
    if (!rec) return m.reply('❌ Ticket non trovato.')
    if (rec.chat !== m.chat) return m.reply('❌ Ticket di un altro gruppo.')
    if (!isStaff && rec.author !== m.sender) return m.reply('⛔ Non autorizzato.')
    const replyText = body.replace(/^rispondi\s+\S+\s*/i, '').trim()
    if (!replyText) return m.reply('❌ Scrivi la risposta.')
    rec.replies.push({ by: m.sender, text: replyText, at: Date.now() })
    rec.status = 'pending'
    rec.updated = Date.now()
    global.markDbDirty?.()
    return m.reply(
`💬 *Risposta al ticket #${shortId(rec.id)}*
━━━━━━━━━━━━━━━━━━━━━
👤 Staff: @${m.sender.split('@')[0]}
📝 ${replyText}`,
      { mentions: [rec.author] }
    )
  }

  const rec = findTicket(sub)
  if (rec) {
    if (rec.chat !== m.chat) return m.reply('❌ Ticket di un altro gruppo.')
    const replies = rec.replies.length
      ? '\n\n' + rec.replies.map(r => `💬 @${r.by.split('@')[0]}: ${r.text}`).join('\n')
      : ''
    return m.reply(
`🎫 *TICKET #${shortId(rec.id)}*
${STATUS[rec.status].badge} Stato: *${STATUS[rec.status].label}*
👤 Autore: @${rec.author.split('@')[0]}
🕒 Aperto: ${fmtDate(rec.at)}
📝 ${rec.text}${replies}`,
      { mentions: [rec.author] }
    )
  }

  return m.reply(`❌ Non capisco. Usa *${usedPrefix}ticket help*.`)
}

handler.help = ['ticket nuovo <descrizione>', 'ticket list', 'ticket <ID>']
handler.tags = ['gruppo']
handler.command = /^ticket$/i
handler.group = true

export default handler