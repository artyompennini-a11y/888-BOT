// Plugin by elixir & punisher
import { getBlacklist, addBlacklist, removeBlacklist } from '../../lib/blacklist.js'

const normalizeTarget = (v = '') => {
  const num = String(v || '').replace(/[^0-9]/g, '')
  return num.length > 5 ? num + '@s.whatsapp.net' : null
}

let handler = async (m, { conn, text, command, usedPrefix }) => {
  const cmd = String(command || '').toLowerCase()
  const bl = getBlacklist()
  let who = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)
  if (!who && text) who = normalizeTarget(String(text).split('|')[0])
  if (cmd === 'addblacklist' || cmd === 'abl') {
    if (!who) return m.reply(`*Esempio:* ${usedPrefix}${cmd} @user | motivo`)
    let reason = String(text || '').includes('|') ? String(text).split('|').slice(1).join('|').trim() : ''
    if (!reason) reason = 'Nessun motivo specificato'
    const entry = addBlacklist(who, { reason, addedBy: m.sender })
    await m.reply(`Utente @${who.split('@')[0]} bannato. Avvio scansione globale...`, null, { mentions: [who] })
    let groups = []
    try {
      groups = Object.values(await conn.groupFetchAllParticipating())
    } catch {
      groups = []
    }
    let cleaned = 0
    for (const group of groups) {
      try {
        const meta = group.id ? await conn.groupMetadata(group.id).catch(() => group) : group
        const parts = meta?.participants || group?.participants || []
        const botJid = conn.user?.jid || conn.user?.id
        const botAdmin = parts.some(p => (p.id === botJid || p.jid === botJid) && (p.admin === 'admin' || p.admin === 'superadmin'))
        if (!botAdmin) continue
        if (!parts.some(p => p.id === who || p.jid === who)) continue
        await conn.groupParticipantsUpdate(group.id || meta.id, [who], 'remove').catch(() => null)
        cleaned++
      } catch {}
    }
    return m.reply(`Pulizia completata. Gruppi puliti: ${cleaned}. Motivo: ${entry.reason}`)
  }
  if (cmd === 'delblacklist' || cmd === 'rbl') {
    if (!who) return m.reply(`*Esempio:* ${usedPrefix}${cmd} @user`)
    if (!removeBlacklist(who)) return m.reply(`L'utente non e' in blacklist.`)
    return m.reply(`Utente @${who.split('@')[0]} rimosso dalla lista nera.`, null, { mentions: [who] })
  }
  const list = Object.keys(bl)
  if (!list.length) return m.reply(`Lista nera vuota.`)
  let txt = `UTENTI IN BLACKLIST:\n\n`
  for (const jid of list) {
    const e = bl[jid] || {}
    txt += `@${jid.split('@')[0]}\n motivo: ${e.reason || 'Nessun motivo specificato'}\n\n`
  }
  return conn.reply(m.chat, txt.trim(), m, { mentions: list })
}

handler.help = ['addblacklist', 'delblacklist', 'listblacklist']
handler.tags = ['owner']
handler.command = /^(addblacklist|delblacklist|listblacklist|abl|rbl|lbl)$/i
handler.owner = true

export default handler
