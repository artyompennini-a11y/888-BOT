//Plugin by Elixir & 888 staff

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const args = text?.trim().split(/\s+/)
  if (!args || args.length < 1)
    return m.reply(`❌ Uso: ${usedPrefix + command} <numero/@utente>`)

  let rawNumber = ''
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    rawNumber = m.mentionedJid[0].split('@')[0]
  } else {
    rawNumber = args[0].replace(/[^0-9]/g, '')
  }

  if (!rawNumber) return m.reply('❌ Numero non valido')

  const jid = rawNumber + '@s.whatsapp.net'

  const isOwner =
    m.sender === conn.user.jid ||
    m.sender.split('@')[0] === '393297014539' ||
    m.sender.split('@')[0] === '393784409415'
  if (!isOwner) return m.reply('❌ Solo l\'owner può usare questo comando.')

  if (!m.isGroup) return m.reply('❌ Questo comando può essere usato solo nei gruppi.')

  try {
    await conn.groupParticipantsUpdate(m.chat, [jid], 'add')
    m.reply(`✅ <@${rawNumber}> è stato aggiunto al gruppo con successo.`, null, {
      mentions: [jid],
    })
  } catch (err) {
    console.error(err)
    try {
      const inviteCode = await conn.groupInviteCode(m.chat)
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`
      await conn.sendMessage(jid, {
        text: `👋 Sei stato invitato a unirti al gruppo!\n\n🔗 Link: ${inviteLink}\n\n*(Messaggio inviato automaticamente da ${global.nomebot})*`,
      })
      m.reply(
        `⚠️ Impossibile aggiungere direttamente <@${rawNumber}>.\n✅ Invito inviato in privato.`,
        null,
        { mentions: [jid] }
      )
    } catch (pmErr) {
      console.error(pmErr)
      m.reply(`❌ Impossibile aggiungere o invitare <@${rawNumber}>.`, null, {
        mentions: [jid],
      })
    }
  }
}

handler.help = ['addnum <@user/numero>']
handler.tags = ['owner']
handler.command = ['addnum']
handler.rowner = true

export default handler
