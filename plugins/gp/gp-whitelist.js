import { readWhitelist, writeWhitelist, clearWhitelist } from '../../lib/whitelist.js'

const ADD_WORDS = new Set(['add', 'aggiungi', 'inserisci'])
const REMOVE_WORDS = new Set(['remove', 'del', 'delete', 'rimuovi', 'togli'])

const cleanJid = (jid = '') => String(jid).replace(/:\d+@/, '@')
const isReal = (jid = '') => String(jid).endsWith('@s.whatsapp.net')
const isLid = (jid = '') => String(jid).endsWith('@lid')
const tag = (jid) => '@' + String(jid).split('@')[0]
const digitsOf = (jid = '') => String(jid).split('@')[0].split(':')[0].replace(/[^0-9]/g, '')

function normalizeJid(input) {
  if (!input) return null
  input = String(input).trim()
  if (input.includes('@')) return cleanJid(input)
  const num = input.replace(/[^0-9]/g, '')
  if (num.length < 5) return null
  return num + '@s.whatsapp.net'
}

async function getParticipants(conn, chatId) {
  try {
    return (await conn.groupMetadata(chatId)).participants || []
  } catch {
    return []
  }
}

const realOf = (p) => {
  const cand = p.phoneNumber || p.jid || (isReal(p.id) ? p.id : null)
  return cand ? cleanJid(cand) : null
}

function resolveJid(jid, participants) {
  jid = normalizeJid(jid)
  if (!jid) return null
  if (isReal(jid) && !participants.some(p => p.id === jid && isLid(p.id))) {
    return jid
  }
  const p = participants.find(x =>
    cleanJid(x.id) === jid || x.lid === jid || cleanJid(x.jid || '') === jid
  )
  if (p) return realOf(p) || cleanJid(p.id)
  return jid
}

function repairWhitelist(list, participants) {
  const out = []
  for (let jid of list) {
    let fixed = cleanJid(jid)
    if (isReal(fixed)) {
      const digits = fixed.split('@')[0]
      const okReal = participants.some(p => realOf(p) === fixed)
      if (!okReal) {
        const asLid = `${digits}@lid`
        const p = participants.find(x => cleanJid(x.id) === asLid || x.lid === asLid)
        if (p) fixed = realOf(p) || asLid
      }
    } else if (isLid(fixed)) {
      const p = participants.find(x => cleanJid(x.id) === fixed || x.lid === fixed)
      if (p) fixed = realOf(p) || fixed
    }
    if (!out.includes(fixed)) out.push(fixed)
  }
  return out
}

function extractTargets(m, args, participants) {
  let targets = []
  if (m.mentionedJid?.length) {
    targets = m.mentionedJid.map(j => resolveJid(j, participants)).filter(Boolean)
    return [...new Set(targets)]
  }
  if (m.quoted) {
    const jid = resolveJid(m.quoted.sender, participants)
    if (jid) targets.push(jid)
    return targets
  }
  for (const n of args.join(' ').split(/\s+/)) {
    const jid = resolveJid(n, participants)
    if (jid) targets.push(jid)
  }
  return [...new Set(targets)]
}

function diffAdded(current, candidates) {
  const known = new Set(current.map(digitsOf).filter(Boolean))
  const out = []
  for (const who of candidates) {
    const digits = digitsOf(who)
    if (!digits || known.has(digits)) continue
    known.add(digits)
    out.push(who)
  }
  return out
}

let handler = async (m, { conn, command, usedPrefix, args }) => {
  const cmd = String(command || '').toLowerCase()
  const participants = await getParticipants(conn, m.chat)

  const stored = readWhitelist('antinuke', m.chat)
  let list = repairWhitelist(stored, participants)
  if (JSON.stringify(list) !== JSON.stringify(stored)) {
    list = writeWhitelist('antinuke', m.chat, list)
  }

  const tokens = (args || []).map(v => String(v))
  let action = null
  let rest = []

  if (cmd === 'whitelist') {
    const first = (tokens[0] || '').toLowerCase()
    if (ADD_WORDS.has(first)) {
      action = 'add'
      rest = tokens.slice(1)
    } else if (REMOVE_WORDS.has(first)) {
      action = 'remove'
      rest = tokens.slice(1)
    }
  } else if (cmd === 'addwhitelist') {
    action = 'add'
    rest = tokens
  } else if (cmd === 'delwhitelist') {
    action = 'remove'
    rest = tokens
  }

  const keyword = (rest[0] || '').toLowerCase()
  const noTarget = !rest.length && !m.quoted && !m.mentionedJid?.length

  if (action === 'add' && keyword === 'alladmins') {
    const admins = participants.filter(p => p.admin).map(a => realOf(a) || cleanJid(a.id))
    const added = diffAdded(list, admins)
    if (!added.length) return m.reply('✨ Tutti gli admin erano già nella whitelist.')

    writeWhitelist('antinuke', m.chat, [...list, ...added])

    await conn.sendMessage(m.chat, {
      text:
        `✅ *Admin Aggiunti nella Whitelist*\n` +
        `${added.map(tag).join(', ')}\n\n` +
        `Ora sono esenti dai controlli antinuke.`,
      contextInfo: { mentionedJid: added }
    }, { quoted: m })
    return
  }

  if (action === 'add' && noTarget) {
    let admins = participants.filter(p => p.admin)
    if (!admins.length) return m.reply('⚠️ Nessun admin trovato.')
    let adminList = admins.map(a => `• ${tag(realOf(a) || a.id)}`).join('\n')

    await conn.sendMessage(m.chat, {
      text:
        `📑 *Admin del Gruppo*\n\n` +
        `${adminList}\n\n` +
        `Premi il tasto sotto per aggiungerli alla whitelist.`,
      mentions: admins.map(a => realOf(a) || a.id),
      buttons: [
        {
          buttonId: `${usedPrefix}addwhitelist alladmins`,
          buttonText: { displayText: '➕ Aggiungi nella whitelist' },
          type: 1
        }
      ],
      headerType: 1
    })
    return
  }

  if (action === 'add') {
    const targets = extractTargets(m, rest, participants)
    if (!targets.length) return m.reply('⚠️ Nessun numero valido.')

    const added = diffAdded(list, targets)
    if (!added.length) return m.reply('✨ Gli utenti indicati erano già nella whitelist.')

    writeWhitelist('antinuke', m.chat, [...list, ...added])

    await conn.sendMessage(m.chat, {
      text:
        `✅ *Utenti Autorizzati*\n` +
        `${added.map(tag).join(', ')}\n\n` +
        `Ora sono esenti dai controlli antinuke.`,
      contextInfo: { mentionedJid: added }
    }, { quoted: m })
    return
  }

  if (action === 'remove' && keyword === 'all') {
    if (!list.length) return m.reply('⚠️ Nessun utente da rimuovere.')
    const removed = [...list]
    clearWhitelist('antinuke', m.chat)

    await conn.sendMessage(m.chat, {
      text:
        `🗑️ *Utenti Rimossi dalla Whitelist*\n` +
        `${removed.map(tag).join(', ')}\n\n` +
        `La whitelist è ora vuota.`,
      contextInfo: { mentionedJid: removed }
    }, { quoted: m })
    return
  }

  if (action === 'remove' && noTarget) {
    if (!list.length) return m.reply('⚠️ Nessun utente nella whitelist.')

    await conn.sendMessage(m.chat, {
      text:
        `🗑️ *Whitelist Attuale*\n\n` +
        `${list.map(j => `• ${tag(j)}`).join('\n')}\n\n` +
        `Premi il tasto sotto per rimuoverli dalla whitelist.`,
      mentions: list,
      buttons: [
        {
          buttonId: `${usedPrefix}delwhitelist all`,
          buttonText: { displayText: '🗑️ Rimuovi dalla whitelist' },
          type: 1
        }
      ],
      headerType: 1
    })
    return
  }

  if (action === 'remove') {
    const targets = extractTargets(m, rest, participants)
    if (!targets.length) return m.reply('⚠️ Numero non valido.')

    const wanted = new Set(targets.map(digitsOf).filter(Boolean))
    const removed = list.filter(j => wanted.has(digitsOf(j)))
    if (!removed.length) return m.reply('❌ L’utente non è nella whitelist.')

    writeWhitelist('antinuke', m.chat, list.filter(j => !wanted.has(digitsOf(j))))

    await conn.sendMessage(m.chat, {
      text:
        `🗑️ *Utente Rimosso*\n` +
        `👤 ${removed.map(tag).join(', ')}\n\n` +
        `Rimosso dalla whitelist.`,
      contextInfo: { mentionedJid: removed }
    }, { quoted: m })
    return
  }

  const elenco = list.map(jid => `• ${tag(jid)}`).join('\n')
  const caption =
    `📑 *Whitelist Gruppo*\n` +
    `Utenti autorizzati:\n\n` +
    `${elenco || '⚠️ Nessun utente autorizzato.'}`

  return m.reply(caption, null, { mentions: list })
}

handler.help = ['addwhitelist', 'delwhitelist', 'whitelist']
handler.tags = ['owner', 'group']
handler.command = /^(addwhitelist|delwhitelist|whitelist)$/i

handler.owner = true
handler.group = true

export default handler

