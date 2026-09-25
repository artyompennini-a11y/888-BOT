// Plugin by Elixir

const ADMIN_ROLES = new Set(['admin', 'superadmin', true])
const BANKAI_QUOTE = '«BANKAI! Adesso vediamo chi comanda!» — Ichigo Kurosaki'

const handler = async (m, { conn, participants = [] }) => {
    if (!m.isGroup) {
        return m.reply('❌ *BANKAI:* questo comando funziona solo nei gruppi. «Il potere si usa per proteggere.» — Ichigo Kurosaki')
    }

    const decode = (jid) => {
        if (!jid) return null
        try {
            const decoded = typeof conn.decodeJid === 'function' ? conn.decodeJid(jid) : jid
            if (decoded && typeof decoded === 'object' && decoded.user && decoded.server) {
                return `${decoded.user}@${decoded.server}`
            }
            return typeof decoded === 'string' ? decoded : String(jid)
        } catch {
            return typeof jid === 'string' ? jid : null
        }
    }

    const getIdentityKeys = (jid) => {
        const keys = new Set()
        for (const value of [jid, decode(jid)]) {
            if (!value) continue
            const normalized = String(value).replace(/:\d+(?=@|$)/g, '').trim()
            if (normalized) keys.add(normalized)
        }
        return keys
    }

    const getParticipantIds = participant =>
        [participant?.id, participant?.jid, participant?.lid]
            .map(decode)
            .filter(Boolean)

    const participantMatches = (participant, target) => {
        const targetKeys = getIdentityKeys(target)
        if (!targetKeys.size) return false
        return getParticipantIds(participant).some(id => {
            const participantKeys = getIdentityKeys(id)
            return [...targetKeys].some(key => participantKeys.has(key))
        })
    }

    const isAdmin = participant =>
        ADMIN_ROLES.has(participant?.admin) ||
        participant?.isAdmin === true ||
        participant?.isSuperAdmin === true

    const getParticipantJids = participant => {
        const candidates = [participant?.jid, participant?.id, participant?.lid]
            .map(decode)
            .filter(jid => typeof jid === 'string' && jid.length > 0)

        // WhatsApp preferisce il JID del telefono; il LID resta un fallback.
        candidates.sort((a, b) => Number(b.endsWith('@s.whatsapp.net')) - Number(a.endsWith('@s.whatsapp.net')))
        return [...new Set(candidates)]
    }

    const updateParticipant = async (participant, action) => {
        const candidates = getParticipantJids(participant)
        let lastError = null
        for (const jid of candidates) {
            try {
                await conn.groupParticipantsUpdate(m.chat, [jid], action)
                return { ok: true, jid }
            } catch (error) {
                lastError = error
                console.error(`[BANKAI] ${action} fallito per ${jid}:`, error?.message || error)
            }
        }
        return { ok: false, error: lastError || new Error(`Nessun JID valido per ${action}`) }
    }

    const getBatchDemoteJids = participantsToDemote => [...new Set(
        participantsToDemote
            .map(participant => getParticipantJids(participant)[0])
            .filter(Boolean)
    )]

    let chat = null
    try {
        chat = await conn.groupMetadata(m.chat)
    } catch (error) {
        console.error('[BANKAI] Impossibile leggere i metadata del gruppo:', error?.message || error)
    }

    const groupParticipants = chat?.participants?.length ? chat.participants : participants
    const meId = decode(conn.user?.jid || conn.user?.id)
    const senderId = decode(m.sender)
    const botParticipant = groupParticipants.find(participant => participantMatches(participant, meId))
    const botIsOwner = [chat?.owner, chat?.ownerLid].some(owner => participantMatches({ id: owner }, meId))
    const botIsAdmin = botIsOwner || isAdmin(botParticipant)

    if (!botIsAdmin) {
        return m.reply('❌ *BANKAI BLOCCATO:* il bot deve essere admin. «Non si può vincere senza potere.» — Ichigo Kurosaki')
    }

    try {
        await m.react?.('⚔️')

        const protectedKeys = new Set([
            ...getIdentityKeys(meId),
            ...getIdentityKeys(senderId)
        ])

        const adminsToDemote = groupParticipants.filter(participant => {
            if (!isAdmin(participant)) return false
            return !getParticipantIds(participant).some(id => {
                const keys = getIdentityKeys(id)
                return [...keys].some(key => protectedKeys.has(key))
            })
        })

        const demoteTargets = getBatchDemoteJids(adminsToDemote)
        let demote = { ok: true, count: demoteTargets.length }
        try {
            if (demoteTargets.length) {
                // Una sola chiamata: WhatsApp demota tutti gli admin in un'unica operazione.
                await conn.groupParticipantsUpdate(m.chat, demoteTargets, 'demote')
            }
        } catch (error) {
            demote = { ok: false, count: 0, error }
            console.error('[BANKAI] Demote batch fallito:', error?.message || error)
        }

        const demoted = demote.count
        const demoteFailures = adminsToDemote.length - demoted

        const senderParticipant = groupParticipants.find(participant => participantMatches(participant, senderId))
        let promote = { ok: true, skipped: true }
        if (!isAdmin(senderParticipant)) {
            promote = await updateParticipant(
                senderParticipant || { jid: senderId || m.sender, id: senderId || m.sender },
                'promote'
            )
        }

        const warnings = []
        if (demoteFailures) warnings.push(`⚠️ Admin rimossi: *${demoted}/${adminsToDemote.length}*`)
        if (!promote.ok) warnings.push('⚠️ Non sono riuscito a promuovere chi ha usato il comando')

        const title = warnings.length
            ? '⚠️ *BANKAI COMPLETATO CON AVVERTIMENTI*'
            : '✅ *BANKAI COMPLETATO!*'

        return m.reply([
            title,
            `⚔️ Admin rimossi: *${demoted}${adminsToDemote.length ? `/${adminsToDemote.length}` : ''}*`,
            "👤 Permessi assicurati per l'utente che ha invocato il comando.",
            ...warnings,
            '',
            BANKAI_QUOTE
        ].join('\n'))
    } catch (error) {
        console.error('[BANKAI] Errore generale:', error)
        return m.reply('❌ *BANKAI INTERROTTO:* permessi insufficienti o limite rate di WhatsApp.\n' + BANKAI_QUOTE)
    }
}

handler.help = ['bankai']
handler.tags = ['admin']
handler.command = /^(bankai)$/i
handler.group = true
handler.admin = true
handler.rowner = true

export default handler