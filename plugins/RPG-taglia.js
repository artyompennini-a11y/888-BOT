let handler = m => m

handler.before = async function (m) {

    if (!m.isGroup) return
    if (!m.text) return

    global.bounty = global.bounty || {}

    let data = global.bounty[m.chat] || {}

    // Cooldown 30 minuti
    if (data.last && Date.now() - data.last < 30 * 60 * 1000) return

    // Se c'è già una taglia attiva, non ne crea un'altra
    if (data.active) return

    // Probabilità di spawn (0.5%)
    if (Math.random() > 0.005) return

    let metadata = await this.groupMetadata(m.chat)
    let members = metadata.participants.map(p => p.id)

    let target = members[Math.floor(Math.random() * members.length)]
    let reward = Math.floor(Math.random() * (10000 - 100 + 1)) + 100

    global.bounty[m.chat] = {
        active: true,
        target,
        reward,
        last: Date.now()
    }

    // --- GRAFICA MILITARE ---
    await this.sendMessage(m.chat, {
        text: `🎯 *OPERAZIONE TAGLIA ATTIVATA*
━━━━━━━━━━━━━━━━━━━━
👤 *Bersaglio:* @${target.split('@')[0]}
💰 *Valore della taglia:* ${reward}€
🕒 *Tempo disponibile:* 30 secondi
━━━━━━━━━━━━━━━━━━━━
💥 Scrivi *fire* per ingaggiare il bersaglio!
🪖 *Protocollo 888 — Campo di Battaglia Attivo*`,
        contextInfo: {
            mentionedJid: [target]
        }
    })

    // Timer 30 secondi
    setTimeout(async () => {

        let current = global.bounty[m.chat]
        if (!current || !current.active) return

        current.active = false

        await this.sendMessage(m.chat, {
            text: `⌛ *MISSIONE FALLITA*
━━━━━━━━━━━━━━━━━━━━
Nessun soldato ha ingaggiato il bersaglio.
La taglia è stata annullata.
🪖 *888 — Protocollo di Sicurezza*`
        })

    }, 30000)
}

export default handler