//Plugin by Elixir, Punisher & 888 staff

const handler = async (m, { conn, groupMetadata }) => {
  if (!m.isGroup) return await conn.sendMessage(m.chat, { text: 'Questo comando funziona solo nei gruppi.' })

  groupMetadata = groupMetadata || await conn.groupMetadata?.(m.chat).catch(() => null)
  const participants = groupMetadata?.participants || []

  if (!participants.length) {
    return await conn.sendMessage(m.chat, { text: 'Impossibile recuperare i membri del gruppo.' })
  }

  const usersDb = global.db.data.users || {}

  const groupMemberJids = new Set(participants.map(p => p.id))

  let values = Array.from(groupMemberJids)
    .filter(jid => jid && !jid.endsWith('@g.us'))
    .map(jid => {
      const user = usersDb[jid] || {}
      const lvl = Number(user.lvl ?? user.level ?? user.rankData?.level ?? 0) || 0
      const msgCount = Number(user.msgCount ?? user.rankData?.messages ?? 0) || 0
      return { jid, lvl, msgCount }
    })
    .filter(user => user.lvl > 0 || user.msgCount > 0)

  if (!values.length) {
    return await conn.sendMessage(m.chat, { text: 'Nessun rank disponibile per i membri di questo gruppo.' })
  }

  values.sort((a, b) => b.lvl - a.lvl || b.msgCount - a.msgCount)

  const top = values.slice(0, 10)
  const header = `🏆 𝐓𝐎𝐏 𝟏𝟎 𝐑𝐀𝐍𝐊 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐏𝐎\n` +
    `👥 Gruppo: ${groupMetadata.subject || m.chat.split('@')[0]}\n\n`

  const titles = [
    '𝐑𝐞 𝐝𝐞𝐥 𝐆𝐫𝐮𝐩𝐩𝐨',
    '𝐍𝐞𝐫𝐝',
    '𝐍𝐞𝐫𝐝 𝐢𝐧𝐞𝐬𝐩𝐞𝐫𝐭𝐨',
    '𝐏𝐫𝐞𝐬𝐞𝐧𝐭𝐞',
    '𝐀 𝐯𝐨𝐥𝐭𝐞 𝐜\'è',
    '𝐓𝐢𝐦𝐢𝐝𝐨',
    '𝐈𝐧𝐮𝐭𝐢𝐥𝐞',
    '𝐅𝐚 𝐟𝐢𝐧𝐭𝐚',
    '𝐕𝐢𝐭𝐚 𝐬𝐨𝐜𝐢𝐚𝐥𝐞',
    '𝐐𝐮𝐢𝐭𝐭𝐚'
  ]

  const lines = top.map((user, idx) => {
    const rank = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'][idx] || `${idx + 1}.`
    const title = titles[idx] || ''
    return `${rank} @${user.jid.split('@')[0]} — ${title} • Lv.${user.lvl} (${user.msgCount} msg)`
  }).join('\n')

  await conn.sendMessage(m.chat, {
    text: header + lines,
    mentions: top.map(user => user.jid)
  })
}

handler.help = ['topranks', 'toprank']
handler.tags = ['group']
handler.command = ['topranks', 'toprank']

export default handler