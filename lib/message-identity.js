const asPhoneJid = value => {
    if (typeof value !== 'string') return null
    const jid = value.trim()
    if (jid.endsWith('@s.whatsapp.net')) return jid
    if (jid.includes('@')) return null
    const digits = jid.replace(/\D/g, '')
    return digits ? `${digits}@s.whatsapp.net` : null
}

export function cacheLidMapping(first, second) {
    if (typeof first !== 'string' || typeof second !== 'string') return false
    const values = [first.trim(), second.trim()]
    const lid = values.find(value => value.endsWith('@lid'))
    const pn = values.map(asPhoneJid).find(Boolean)
    if (!lid || !pn || !global.lidCache || typeof global.lidCache.set !== 'function') return false
    global.lidCache.set(lid, pn)
    global.jidCache?.del?.(lid)
    return true
}

export function getMessageLid(key = {}) {
    const candidates = [
        key.participantLid,
        key.senderLid,
        key.participant,
        key.remoteJidAlt,
        key.remoteJid
    ]
    return candidates.find(jid => typeof jid === 'string' && jid.endsWith('@lid')) ?? null
}

export function decodeCachedJid(jid, { jidCache, lidCache, normalizeJid } = {}) {
    if (!jid) return jid
    let decoded = jid
    if (typeof decoded === 'string' && /:\d+@/i.test(decoded)) {
        decoded = normalizeJid?.(decoded) ?? decoded
    }
    if (typeof decoded === 'object' && decoded.user && decoded.server) {
        decoded = `${decoded.user}@${decoded.server}`
    }

    if (typeof decoded === 'string' && decoded.endsWith('@lid')) {
        const mapped = lidCache?.get?.(decoded)
        if (typeof mapped === 'string' && mapped) {
            jidCache?.set?.(jid, mapped)
            return mapped
        }
    }

    const cached = jidCache?.get?.(jid)
    if (cached) return cached
    jidCache?.set?.(jid, decoded)
    return decoded
}

export function cacheMessageIdentityMappings(key = {}) {
    let updated = false
    const pairs = [
        [key.participantLid, key.participantPn],
        [key.senderLid, key.senderPn],
        [key.remoteJid, key.remoteJidAlt],
        [key.participant, key.participantAlt]
    ]
    for (const [first, second] of pairs) {
        updated = cacheLidMapping(first, second) || updated
    }
    return updated
}

export function cacheParticipantIdentityMapping(participant = {}) {
    const ids = [
        participant.id,
        participant.jid,
        participant.lid,
        participant.phoneNumber
    ].filter(value => typeof value === 'string')
    let updated = false
    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
            updated = cacheLidMapping(ids[i], ids[j]) || updated
        }
    }
    return updated
}

export function resolveMessageSender(key = {}) {
    const candidates = [
        key.participantPn,
        key.senderPn,
        key.participant,
        key.remoteJidAlt,
        key.remoteJid,
        key.participantLid,
        key.senderLid
    ];

    return candidates.find(jid =>
        typeof jid === 'string' &&
        jid.includes('@') &&
        !jid.includes('undefined')
    ) ?? null;
}
