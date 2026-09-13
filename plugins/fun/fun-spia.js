// Plugin by Elixir, Punisher & 888 staff

let handler = async (m, { conn, participants }) => {
    const who = m.mentionedJid?.[0] || m.quoted?.sender || m.sender
    const target = conn.decodeJid(who)
    const targetName = (await conn.getName(target)) || target.split('@')[0]

    const now = new Date()
    const hour = now.getHours()
    let fasciaOraria
    if (hour >= 1 && hour < 5) {
        fasciaOraria = 'Notturno (01:00 - 05:00)'
    } else if (hour >= 5 && hour < 12) {
        fasciaOraria = 'Mattutino (05:00 - 12:00)'
    } else if (hour >= 12 && hour < 18) {
        fasciaOraria = 'Pomeridiano (12:00 - 18:00)'
    } else if (hour >= 18 && hour < 23) {
        fasciaOraria = 'Serale (18:00 - 23:00)'
    } else {
        fasciaOraria = 'Sempre Attivo'
    }

    const chat = global.db.data.chats[m.chat] || {}
    const topUsers = Object.entries(chat.topUsers || {})
        .filter(([jid]) => jid !== target && jid !== conn.user?.jid)
    let complice = 'Nessun complice rilevato'
    if (topUsers.length > 0) {
        const randomEntry = topUsers[Math.floor(Math.random() * topUsers.length)]
        const compliceJid = randomEntry[0]
        const compliceName = (await conn.getName(compliceJid)) || compliceJid.split('@')[0]
        complice = compliceName
    }

    const tossicita = Math.floor(Math.random() * 100) + 1

    const verdetti = [
        'Sospettato di lurkare senza scrivere',
        'Spamma meme inutili nelle chat',
        'Pianifica raid silenziosi',
        'Osserva lo staff nell\'ombra',
        'Sospettato di doppiogiochismo',
        'Colpevole di attivita sospette in orari improbabili',
        'Segnalato per eccessiva presenza nei momenti chiave',
        'Sospettato di collaborare con elementi esterni'
    ]
    const verdetto = verdetti[Math.floor(Math.random() * verdetti.length)]

    const report = `🕵️‍♂️ *REPORT PSICOLOGICO RISERVATO*
━━━━━━━━━━━━━━━━━━
👤 *Soggetto:* ${targetName}
📊 *Fascia Oraria:* ${fasciaOraria}
👁️ *Stato Fedelta:* ${complice}
🔥 *Livello Tossicita:* ${tossicita}%
📝 *Verdetto Staff:* ${verdetto}
━━━━━━━━━━━━━━━━━━
📂 REPORT AGENTI 888 Staff`

    await conn.sendMessage(m.chat, { text: report }, { quoted: m })
}

handler.help = ['spia @utente']
handler.tags = ['fun']
handler.command = /^spia$/i
handler.group = true

export default handler
