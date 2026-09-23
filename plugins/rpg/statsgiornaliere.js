const DAY_MS = 24 * 60 * 60 * 1000
const STATS_KEY = 'statsgiornaliere'
const TIMEZONE = 'Europe/Rome'

const cleanJid = (jid = '') => jid.split('@')[0].split(':')[0]

function getRomeDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(date)
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]))
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second)
  }
}

function todayDate() {
  const { year, month, day } = getRomeDateParts()
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

function getNextResetMs(now = new Date()) {
  const { year, month, day, hour, minute, second } = getRomeDateParts(now)
  const nowUtcMs = now.getTime()
  const currentRomeUtcMs = Date.UTC(year, month - 1, day, hour, minute, second)
  const romeOffsetMs = nowUtcMs - currentRomeUtcMs
  let nextMidnightUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0) - romeOffsetMs
  if (nowUtcMs >= nextMidnightUtcMs) nextMidnightUtcMs += DAY_MS
  return nextMidnightUtcMs
}

function ensureStatsDb() {
  if (!global.db) global.db = { data: {} }
  if (!global.db.data) global.db.data = {}
  if (!global.db.data[STATS_KEY]) global.db.data[STATS_KEY] = { date: todayDate(), chats: {} }
  return global.db.data[STATS_KEY]
}

function loadDailyStats() {
  const stats = ensureStatsDb()
  const today = todayDate()
  if (stats.date !== today) {
    stats.date = today
    stats.chats = {}
    if (typeof global.markDbDirty === 'function') global.markDbDirty()
  }
  global.dailyStats = stats
  scheduleNextReset()
  return stats
}

function scheduleNextReset() {
  if (global._statsgiornaliere_scheduled) return
  const now = new Date()
  const nextMs = getNextResetMs(now)
  const ms = nextMs - now.getTime()
  global._statsgiornaliere_scheduled = true
  if (global._statsgiornaliere_timeout) clearTimeout(global._statsgiornaliere_timeout)
  global._statsgiornaliere_timeout = setTimeout(() => {
    global._statsgiornaliere_scheduled = false
    try { resetDailyStats() } catch (e) {}
    scheduleNextReset()
  }, ms)
}

function resetDailyStats() {
  const today = todayDate()
  const stats = ensureStatsDb()
  if (stats.date === today) return
  stats.date = today
  stats.chats = {}
  if (typeof global.markDbDirty === 'function') global.markDbDirty()
  global.dailyStats = stats
}

loadDailyStats()
scheduleNextReset()

let handler = async (m, { conn, participants, groupMetadata }) => {
  try {
    const cmd = (m.text || '').trim().split(/\s+/)[0].replace(/^\./, '')
    if (!['statsgiornaliere','statsgiornaliera','statigiorno'].includes(cmd)) return
    if (!m.isGroup) return m.reply('❌ Questo comando funziona solo nei gruppi.')

    if (!global.dailyStats || global.dailyStats.date !== todayDate()) loadDailyStats()

    const chat = m.chat
    const gstats = global.dailyStats.chats[chat] || { total: 0, users: {} }
    const total = gstats.total || 0
    const usersObj = gstats.users || {}

    const memberNumbers = new Set((participants || []).map(p => cleanJid(p.id)))
    const entries = Object.entries(usersObj).filter(([jid]) => memberNumbers.has(cleanJid(jid)))
    entries.sort((a,b) => b[1] - a[1])

    const top3 = entries.slice(0,3)

    let topText = ''
    for (let i=0;i<3;i++) {
      const row = top3[i]
      if (!row) continue
      const [jid,count] = row
      const tag = `*@${jid.split('@')[0]}*`
      topText += `\n${i+1}. ${tag} — ${count} messaggi`
    }

    let prizesText = ''
    try {
      if (!global.db) global.db = { data: { users: {} } }
      if (!global.db.data) global.db.data = { users: {} }
      if (!global.db.data.users) global.db.data.users = {}

      const usersDb = global.db.data.users
      let prizesTextLocal = ''
      const cs = global.dailyStats.chats[chat] || { total: 0, users: {} }

      if (cs.awardedDate === todayDate()) {
        prizesText = '\n🎁 Premi già assegnati oggi.'
      } else {
        for (const row of top3) {
          const jid = row?.[0]
          if (!jid) continue
          if (!usersDb[jid]) usersDb[jid] = {}
          usersDb[jid].money = (usersDb[jid].money || 0) + 1000
          usersDb[jid]['888coin'] = (usersDb[jid]['888coin'] || 0) + 1000
          prizesTextLocal += `\n- *@${jid.split('@')[0]}* — +1000 888COIN`
        }
        prizesText = prizesTextLocal || '\nNessun premio'
        cs.awardedDate = todayDate()
        global.dailyStats.chats[chat] = cs
      }
    } catch (e) {
      prizesText = '\nImpossibile assegnare premi'
    }

    let botGroups = {}
    try { botGroups = await conn.groupFetchAllParticipating().catch(() => ({})) } catch(e) {}
    const activeGroups = new Set(Object.keys(botGroups))

    const groups = []
    for (const [chatId, data] of Object.entries(global.dailyStats.chats || {})) {
      if (!activeGroups.has(chatId)) continue
      groups.push({ chatId, total: data.total || 0 })
    }

    groups.sort((a,b)=> b.total - a.total)
    const idx = groups.findIndex(g=> g.chatId === chat)

    let positionText = ''
    if (idx === -1) {
      positionText = 'Posizione: non classificato.'
    } else {
      const pos = idx + 1
      positionText = `*Posizione:* ${pos}/${groups.length}`
      if (pos > 1) {
        const above = groups[idx-1]
        const diff = (above.total || 0) - total
        let aboveName
        try { aboveName = await conn.getName(above.chatId) } catch (e) { aboveName = above.chatId.split('@')[0] }
        positionText += `\nGruppo sopra: *${aboveName}* — ${above.total} messaggi\nMancano: ${diff} messaggi`
      } else {
        positionText += `\n*Sei in testa!*`
      }
    }

    let groupName = groupMetadata?.subject
    if (!groupName) {
      try { groupName = await conn.getName(chat) } catch (e) { groupName = chat.split('@')[0] }
    }

    const day = global.dailyStats.date || todayDate()

    const out =
`*888Statistiche Giornaliere*\n
🏷️ *Gruppo:* ${groupName}
📅 *Data:* ${day}\n
━━━━━━━━━━━━━━━━━━━━━━
💬 *Messaggi totali:* ${total}
━━━━━━━━━━━━━━━━━━━━━━
🥇 *Top 3 utenti:*${topText || '\nNessun messaggio registrato oggi.'}
━━━━━━━━━━━━━━━━━━━━━━
🎁 *Premi assegnati:*${prizesText || '\nNessun premio'}
━━━━━━━━━━━━━━━━━━━━━━
📌 *Posizione del gruppo:*
${positionText}\n
🕛 Reset automatico alle *00:00* (ora italiana)
*Sistema 888*`

    const mentions = top3.map(r=> r[0]).filter(Boolean)
    await conn.sendMessage(chat, { text: out, mentions })

    if (typeof global.markDbDirty === 'function') global.markDbDirty()

  } catch (e) {
    try { await m.reply('❌ Errore nello script statsgiornaliere') } catch {}
  }
}

handler.before = async (m, { conn }) => {
  try {
    if (!m.isGroup) return
    if (!m.message) return
    if (m.fromMe) return

    const chat = m.chat
    if (!global.dailyStats) loadDailyStats()
    if (global.dailyStats.date !== todayDate()) loadDailyStats()

    if (!global.dailyStats.chats[chat]) global.dailyStats.chats[chat] = { total: 0, users: {} }
    const cs = global.dailyStats.chats[chat]
    cs.total = (cs.total || 0) + 1
    const who = m.sender
    cs.users[who] = (cs.users[who] || 0) + 1
  } catch (e) {}
}

handler.help = ['statsgiornaliere']
handler.tags = ['group']
handler.command = ['statsgiornaliere','statsgiornaliera','statigiorno']
handler.group = true

export default handler
