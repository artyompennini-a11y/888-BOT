// Plugin by elixir & punisher
import {
  ROLES,
  LIMITS,
  resolveRole,
  roleLabel,
  readStats,
  totalsFor,
  getGroupMods,
  logModAction
} from '../../lib/moderation.js'

const quick = (display_text, id) => ({
  name: 'quick_reply',
  buttonParamsJson: JSON.stringify({ display_text, id })
})
const decodeJid = (conn, jid) => {
  if (!jid) return null
  try {
    const decoded = typeof conn?.decodeJid === 'function' ? conn.decodeJid(jid) : jid
    if (decoded && typeof decoded === 'object' && decoded.user && decoded.server) {
      return `${decoded.user}@${decoded.server}`
    }
    return typeof decoded === 'string' ? decoded : String(jid)
  } catch {
    return typeof jid === 'string' ? jid : null
  }
}

const jidKey = (conn, jid) => {
  const value = decodeJid(conn, jid)
  if (!value) return ''
  const [rawUser, server = ''] = String(value).split('@')
  const user = rawUser.split(':')[0]
  const numericUser = user.replace(/\D/g, '')
  if (numericUser.length > 15) return `large:${numericUser}`
  if (server === 's.whatsapp.net') return `phone:${numericUser}`
  if (server === 'lid') return `lid:${user}`
  return `${user}@${server}`
}

const resolveUserJid = (conn, jid, participants = []) => {
  if (!jid) return null
  const targetKeys = new Set([jidKey(conn, jid), jidKey(conn, decodeJid(conn, jid))].filter(Boolean))
  const participant = participants.find(item =>
    [item?.id, item?.jid, item?.lid].some(id => targetKeys.has(jidKey(conn, id)))
  )
  const candidates = participant ? [participant.jid, participant.id, participant.lid] : [jid]

  return candidates
    .map(id => decodeJid(conn, id))
    .map(id => typeof id === 'string' ? id.replace(/:\d+(?=@|$)/g, '') : null)
    .find(id => {
      if (!id?.endsWith('@s.whatsapp.net')) return false
      return id.split('@')[0].replace(/\D/g, '').length <= 15
    }) || null
}

const mentionLabel = jid => `@${String(jid).split('@')[0].split(':')[0]}`


export async function buildModsPanel({
  conn,
  chat,
  sender,
  usedPrefix = '.',
  isOwner,
  isROwner,
  isAdmin,
  isMods,
  participants = [],
  groupMetadata = null
} = {}) {
  const p = usedPrefix || '.'
  const role = resolveRole({ isOwner, isROwner, isAdmin, isMods })
  const mods = getGroupMods(chat)
  const stats = readStats(chat)

  let subject = groupMetadata?.subject
  if (!subject && conn?.groupMetadata) {
    try {
      subject = (await conn.groupMetadata(chat))?.subject
    } catch {}
  }
  subject = subject || 'questo gruppo'

  const list = Array.isArray(participants) ? participants : []
  const adminJids = list
    .filter(x => x.admin === 'admin' || x.admin === 'superadmin')
    .map(x => x.jid || x.id || x.lid)
    .filter(Boolean)
  const groupOwner = groupMetadata?.owner ||
    list.find(x => x.admin === 'superadmin')?.jid ||
    list.find(x => x.admin === 'superadmin')?.id ||
    null

  const mentions = []
  const addMention = jid => {
    const resolved = resolveUserJid(conn, jid, list)
    if (resolved && !mentions.includes(resolved)) mentions.push(resolved)
    return resolved
  }
  const displayMention = jid => {
    const resolved = resolveUserJid(conn, jid, list)
    return resolved ? mentionLabel(resolved) : '@utente'
  }

  let text = `🛡️ *PANNELLO MODERATORI 888*\n`
  text += `🏠 *Gruppo:* ${subject}\n`
  text += `👥 *Membri:* ${list.length || '—'}\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`

  if (groupOwner) {
    addMention(groupOwner)
    text += `👑 *Owner del gruppo*\n• ${displayMention(groupOwner)}\n\n`
  }

  if (adminJids.length) {
    const resolvedAdmins = adminJids.map(jid => addMention(jid))
    text += `⚙️ *Admin del gruppo*\n${resolvedAdmins.map(jid => `• ${jid ? mentionLabel(jid) : '@utente'}`).join('\n')}\n\n`
  }

  text += `🛡️ *Moderatori del bot (${mods.length})*\n`
  if (mods.length) {
    mods.forEach((jid, index) => {
      const resolved = addMention(jid)
      const statKey = jid || decodeJid(conn, jid)
      const total = totalsFor(stats[jid] || stats[statKey] || {})
      text += `${index + 1}. ${resolved ? mentionLabel(resolved) : '@utente'} — 📈 ${total} azion${total === 1 ? 'e' : 'i'}\n`
    })
  } else {
    text += `_Nessun moderatore registrato._\n👉 Registrane uno con *${p}addmod @utente*\n`
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`
  text += `⚙️ *Comandi moderatori*\n`
  text += `• 🔇 ${p}muta @utente [durata] — silenzia e cancella i suoi messaggi, mod: max ${LIMITS.MOD_MUTE_MAX_MS / 60000} min\n`
  text += `• 🔊 ${p}smuta @utente — toglie il mute e riattiva l’utente\n`
  text += `• ⚠️ ${p}warn @utente motivo — ammonizione con motivo obbligatorio, mod: max ${LIMITS.MOD_MAX_WARN}, al 5° espulsione solo Admin-Owner\n`
  text += `• ✅ ${p}unwarn @utente — toglie un warn, mod: 1 ogni ${LIMITS.MOD_UNWARN_COOLDOWN_MS / 60000} min\n`
  text += `• 🚫 ${p}banuser @utente [durata] — blocca l’uso del bot, mod: solo temporaneo max ${LIMITS.MOD_BAN_MAX_MS / 60000} min\n`
  text += `• 🔓 ${p}unbanuser @utente — riattiva l’utente, mod: solo ban temporanei, permanenti solo Admin-Owner\n`
  text += `• 👻 ${p}hidetag testo — tag invisibile a tutti, salta gli AFK, mod: max ${LIMITS.MOD_HIDETAG_MAX} menzioni\n`
  text += `• 🚨 ${p}denuncia @utente motivo — invia segnalazione con gruppo data e motivo allo staff 888\n`
  text += `• 📊 ${p}modstats — tue statistiche warn mute ban denunce, report staff completo per Admin-Owner\n`
  text += `• 🧹 ${p}modsreset — azzera tutti i moderatori del gruppo (solo Admin/Owner)\n`
  text += `• 📋 ${p}warnlist — mostra solo gli utenti con almeno 1 warn\n`
  text += `👤 *Il tuo ruolo:* ${roleLabel(role)}`

  const interactiveButtons = role === ROLES.USER
    ? [
        quick('📋 Regole', `${p}rules`),
        quick('📢 Sveglia staff', `${p}admins`)
      ]
    : [
        quick('📊 Statistiche', `${p}modstats`),
        quick('🚨 Denuncia', `${p}denuncia`),
        quick('📢 Sveglia staff', `${p}admins`)
      ]

  return {
    text,
    mentions,
    footer: '𝟴𝟴𝟴 BOT • Moderazione',
    interactiveButtons
  }
}

let handler = async (m, { conn, usedPrefix, command, isOwner, isROwner, isAdmin, isMods, participants, groupMetadata }) => {
  if (!m.isGroup) return m.reply('❌ Questo comando funziona solo nei gruppi.')

  const role = resolveRole({ isOwner, isROwner, isAdmin, isMods })
  if (command === 'modsreset') {
    if (role !== ROLES.OWNER && role !== ROLES.ADMIN) {
      return m.reply('❌ *MODSRESET* è riservato agli Admin e agli Owner del gruppo.')
    }

    const chatData = global.db?.data?.chats?.[m.chat]
    const removedMods = Array.isArray(chatData?.moderatori) ? chatData.moderatori : []
    if (!removedMods.length) {
      return m.reply('ℹ️ Non ci sono moderatori registrati in questo gruppo.')
    }

    chatData.moderatori = []
    global.markDbDirty?.()

    if (typeof global.db?.write === 'function') {
      try {
        await global.db.write()
      } catch (error) {
        console.error('[MODS RESET] Errore durante il salvataggio:', error)
        return m.reply('⚠️ La lista è stata azzerata in memoria, ma non sono riuscito a salvarla nel database.')
      }
    }

    logModAction({ role, actor: m.sender, action: 'modsreset', extra: `${removedMods.length} moderatori rimossi` })
    return m.reply(`🧹 *MODERATORI AZZERATI*\nRimossi in una sola operazione: *${removedMods.length}*.`)
  }


  logModAction({ role, actor: m.sender, action: 'mods', extra: 'pannello moderatori' })

  const panel = await buildModsPanel({
    conn,
    chat: m.chat,
    sender: m.sender,
    usedPrefix,
    isOwner,
    isROwner,
    isAdmin,
    isMods,
    participants,
    groupMetadata
  })

  return conn.sendMessage(m.chat, panel, { quoted: m })
}

handler.help = ['mods', 'moderatori', 'modsreset']
handler.tags = ['group']
handler.command = ['mods', 'moderatori', 'modlist', 'listamod', 'modsreset']
handler.group = true

export default handler
