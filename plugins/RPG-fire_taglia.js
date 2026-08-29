let handler = async (m, { conn }) => {

    if (!m.isGroup) return

    global.bounty = global.bounty || {}
    global.bounty[m.chat] = global.bounty[m.chat] || {}

    let data = global.bounty[m.chat]

    if (!data.active) {
        return conn.reply(
            m.chat,
            `🪖 *NESSUNA OPERAZIONE IN CORSO*\n\nIl campo è silenzioso. Attendi nuovi ordini, soldato.`,
            m
        )
    }

    if (!Array.isArray(data.shots)) data.shots = []

    if (data.shots.includes(m.sender)) {
        return conn.reply(
            m.chat,
            `⛔ *ACCESSO NEGATO*\n\nHai già eseguito il tuo colpo in questa missione.\nRimani in attesa del prossimo ingaggio.`,
            m
        )
    }

    if (m.sender === data.target) {
        return conn.reply(
            m.chat,
            `⚠️ *ERRORE DI SISTEMA*\nNon puoi ingaggiare te stesso, soldato.`,
            m
        )
    }

    data.shots.push(m.sender)

    let fail = Math.random() < 0.3

    if (fail) {
        return conn.reply(
            m.chat,
            `🎯 @${m.sender.split('@')[0]} ha aperto il fuoco...\n\n❌ *COLPO DEVIATO — TARGET NON COLPITO*\n\nSei fuori dalla missione.`,
            m,
            { mentions: [m.sender] }
        )
    }

    let users = global.db.data.users
    users[m.sender] = users[m.sender] || {}

    let reward = data.reward || 0
    users[m.sender].money = (users[m.sender].money || 0) + reward

    data.active = false

    await conn.reply(
        m.chat,
        `💥 *TARGET NEUTRALIZZATO*\n\n🏆 @${m.sender.split('@')[0]} ha completato l’operazione e ottenuto *${reward}€*!\n\nMissione conclusa.`,
        m,
        { mentions: [m.sender] }
    )
}

handler.command = /^fire$/i
handler.group = true

export default handler
