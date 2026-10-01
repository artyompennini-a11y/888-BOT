// Plugin by elixir, punisher & 888 staff - Whitelist AntiBot, letta automaticamente da plugins/anti/antiBot.js
//
// Un utente presente in whitelist NON riceve avvisi, non subisce l'eliminazione
// dei messaggi e non viene mai rimosso dal gruppo.
//
// Database fisico: data/whitelist-antibot.json
// Ambiti:
//   • Gruppo  → chiave chats[chatId]   (default, gestibile dagli admin del gruppo)
//   • Globale → chiave global          (solo owner, flag -g)
//
// Comandi:
//   • antibotwl [list]              mostra la whitelist del gruppo e quella globale
//   • antibotwl add @utente         aggiunge (default: questo gruppo)
//   • antibotwl del @utente         rimuove
//   • antibotwl reset               svuota l'ambito scelto
//   • addantibotwl / delantibotwl / resetantibotwl → scorciatoie
//   Aggiungi -g per lavorare sulla whitelist globale (es. .addantibotwl -g 393331234567)

import { readWhitelist, addWhitelistEntry, removeWhitelistEntry, clearWhitelist } from '../../lib/whitelist.js'

const GLOBAL_FLAGS = new Set(['-g', '--g', 'global', 'globale'])
const MAX_ENTRIES = 300

const ACTIONS = {
    add: ['add', 'aggiungi', 'inserisci', '+'],
    del: ['del', 'delete', 'remove', 'rimuovi', 'togli', '-'],
    reset: ['reset', 'svuota', 'clear', 'pulisci'],
    list: ['list', 'lista', 'show', 'mostra']
}

const ACTION_BY_TOKEN = {}
for (const [action, tokens] of Object.entries(ACTIONS)) {
    for (const token of tokens) ACTION_BY_TOKEN[token] = action
}

const onlyDigits = (value = '') => String(value ?? '').split('@')[0].split(':')[0].replace(/\D+/g, '')

function normalizeJid(value = '') {
    const raw = String(value ?? '').trim()
    if (!raw) return ''
    if (/@(?:s\.whatsapp\.net|lid)$/i.test(raw)) return raw.replace(/:\d+@/, '@')
    const digits = onlyDigits(raw)
    return digits.length >= 6 ? `${digits}@s.whatsapp.net` : ''
}

function resolveTarget(m, tokens) {
    const mentioned = m.mentionedJid?.[0]
    if (mentioned) return normalizeJid(mentioned)

    const quoted = m.quoted?.sender || m.quoted?.participant
    if (quoted) return normalizeJid(quoted)

    const digits = onlyDigits(tokens.join(' '))
    return digits.length >= 6 ? `${digits}@s.whatsapp.net` : ''
}

function renderList(list) {
    if (!list?.length) return '⚠️ Nessun utente in whitelist.'
    return list.map(jid => `• @${onlyDigits(jid) || jid}`).join('\n')
}

const handler = async (m, { args, command, usedPrefix, isOwner, isROwner }) => {
    const cmd = String(command || '').toLowerCase()
    const rawTokens = (args || []).map(v => String(v))
    const globalScope = rawTokens.some(t => GLOBAL_FLAGS.has(t.toLowerCase()))
    const tokens = rawTokens.filter(t => !GLOBAL_FLAGS.has(t.toLowerCase()))

    let action = null
    if (cmd.startsWith('add')) action = 'add'
    else if (cmd.startsWith('del')) action = 'del'
    else if (cmd.startsWith('reset')) action = 'reset'

    if (!action) {
        const first = (tokens[0] || '').toLowerCase()
        if (ACTION_BY_TOKEN[first]) {
            action = ACTION_BY_TOKEN[first]
            tokens.shift()
        } else {
            action = resolveTarget(m, tokens) ? 'add' : 'list'
        }
    }

    if (action !== 'list' && globalScope && !(isOwner || isROwner)) {
        return m.reply(`⛔ Solo l'owner può gestire la whitelist *globale* di AntiBot.`)
    }

    if (action !== 'list' && !globalScope && !m.isGroup) {
        return m.reply(
            `⚠️ Fuori da un gruppo puoi gestire solo la whitelist *globale*.\n\n` +
            `• ${usedPrefix}${cmd} -g @utente\n` +
            `• ${usedPrefix}${cmd} -g 393331234567`
        )
    }

    const scopeLabel = globalScope ? 'globale (tutti i gruppi)' : 'di questo gruppo'

    if (action === 'list') {
        const groupList = m.isGroup ? readWhitelist('antibot', m.chat) : []
        const globalList = readWhitelist('antibot', '', true)
        const chat = global.db?.data?.chats?.[m.chat]
        const stato = chat?.antibot === false ? '🔴 disattivato' : '🟢 attivo'
        const mentions = [...new Set([...groupList, ...globalList])]

        return m.reply(
            `📑 *Whitelist AntiBot*\n` +
            `🛡️ Stato AntiBot: ${stato}\n\n` +
            `🏰 *Questo gruppo* (${groupList.length})\n${renderList(groupList)}\n\n` +
            `🌍 *Globale* (${globalList.length})\n${renderList(globalList)}\n\n` +
            `_Gli utenti in lista non vengono avvisati né rimossi._`,
            null,
            { mentions }
        )
    }

    if (action === 'reset') {
        const res = clearWhitelist('antibot', m.chat, globalScope)

        if (!res.cleared) return m.reply(`📭 La whitelist ${scopeLabel} è già vuota.`)

        return m.reply(
            `🧹 *Whitelist svuotata*\n\n` +
            `🗑️ Utenti rimossi: *${res.cleared}*\n` +
            `🎯 Ambito: ${scopeLabel}`
        )
    }

    const jid = resolveTarget(m, tokens)

    if (!jid) {
        const shortcut = action === 'add' ? 'add' : 'del'
        return m.reply(
            `⚠️ *Target non valido*\n\n` +
            `Usa una menzione, una risposta o un numero:\n` +
            `• ${usedPrefix}${cmd} ${shortcut} @utente\n` +
            `• ${usedPrefix}${cmd} ${shortcut} 393331234567\n` +
            `• rispondi a un messaggio con ${usedPrefix}${cmd} ${shortcut}\n\n` +
            `_Aggiungi -g per la whitelist globale (solo owner)._`
        )
    }

    if (action === 'add') {
        const res = addWhitelistEntry('antibot', m.chat, jid, globalScope, MAX_ENTRIES)

        if (res.reason === 'duplicate') {
            return m.reply(
                `✨ *@${onlyDigits(jid)}* è già presente nella whitelist ${scopeLabel}.`,
                null,
                { mentions: [jid] }
            )
        }

        if (res.reason === 'limit') {
            return m.reply(`⚠️ Limite raggiunto (*${MAX_ENTRIES}* utenti). Rimuovi qualcuno prima di aggiungere.`)
        }

        if (res.reason !== '') {
            return m.reply(`❌ Impossibile salvare la whitelist. Riprova.`)
        }

        return m.reply(
            `✅ *Utente autorizzato*\n\n` +
            `👤 @${onlyDigits(jid)}\n` +
            `🎯 Ambito: ${scopeLabel}\n\n` +
            `🛡️ AntiBot non lo avviserà e non lo rimuoverà.`,
            null,
            { mentions: [jid] }
        )
    }

    const res = removeWhitelistEntry('antibot', m.chat, jid, globalScope)

    if (res.reason !== '') {
        return m.reply(
            `❌ *@${onlyDigits(jid)}* non è nella whitelist ${scopeLabel}.`,
            null,
            { mentions: [jid] }
        )
    }

    return m.reply(
        `🗑️ *Utente rimosso*\n\n` +
        `👤 @${onlyDigits(jid)}\n` +
        `🎯 Ambito: ${scopeLabel}\n\n` +
        `⚠️ Da ora AntiBot lo controlla di nuovo.`,
        null,
        { mentions: [jid] }
    )
}

handler.help = [
    'antibotwl',
    'antibotwl add @utente',
    'antibotwl del @utente',
    'antibotwl reset',
    'addantibotwl -g @utente'
]
handler.tags = ['admin', 'group']
handler.command = /^(antibotwl|antibotwhitelist|addantibotwl|delantibotwl|resetantibotwl)$/i
handler.admin = true

export default handler

