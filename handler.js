// Handler by elixir, punisher & 888 staff
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { smsg } from './lib/simple.js';
import { runBeforeAll, runGuarded } from './lib/bus.js';
import { pluginIndex, candidates } from './lib/plugin-index.js';
import { cacheMessageIdentityMappings, getMessageLid, resolveMessageSender } from './lib/message-identity.js';
import { findGroupParticipant, isParticipantAdmin } from './lib/moderation.js';
import state from './lib/state.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import fs from 'fs';
import chalk from 'chalk';
import NodeCache from 'node-cache';
import { getAggregateVotesInPollMessage } from '@whiskeysockets/baileys';

const { proto } = await import('@whiskeysockets/baileys');
import pkg from './package.json' with { type: 'json' };

let _printModule = null;
const _getPrintModule = async () => {
    if (!_printModule) _printModule = (await import('./lib/print.js')).default;
    return _printModule;
};

const isNumber = x => typeof x === 'number' && !isNaN(x);
const delay = ms => isNumber(ms) && new Promise(r => setTimeout(r, ms));
const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
const pickRandom = list => list[Math.floor(Math.random() * list.length)];
const normalizeNumber = num => {
    if (num == null || num === 'undefined') return 'unknown@s.whatsapp.net';
    const clean = String(num).replace(/\D/g, '');
    if (!clean || clean.includes('undefined')) return 'unknown@s.whatsapp.net';
    return clean + '@s.whatsapp.net';
};

// FIX: boot timestamp — dopo un riavvio il bot legge SOLO i messaggi nuovi
// (velocizza il riavvio, niente backlog vecchi). Viene aggiornato su 'open' in 888.js.
global.bootTime ??= Date.now();
const BOOT_GRACE_MS = 5000;
const getMsgTimestampMs = msg => {
    const raw = msg?.messageTimestamp ?? msg?.message?.messageTimestamp ?? 0;
    const n = Number(raw);
    if (!n || isNaN(n)) return 0;
    return n < 1e12 ? Math.floor(n * 1000) : Math.floor(n);
};

//inizio controllo lid per owner by axtral
const isOwnerJid = (senderJid, ownerEntry) => {
    const ownerClean = String(ownerEntry).replace(/\D/g, '');
    if (!ownerClean) return false;
    const senderClean = String(senderJid).replace(/\D/g, '');
    
    return senderClean === ownerClean;
};
//fine controllo lid per owner by axtral

const normalizeJidKey = jid => jid.replace(/[^0-9]/g, '');
const isBotOwnerNumber = (jid = '') => {
    const digits = normalizeJidKey(jid);
    if (!digits) return false;
    return (global.owner || []).some(entry => {
        const raw = Array.isArray(entry) ? entry[0] : entry;
        return normalizeJidKey(String(raw ?? '')) === digits;
    });
};

const DUPLICATE_WINDOW = 3000;
const ___dirname = join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
const responseHandlers = new Map();

function getInteractiveButtonId(message) {
    const response = message?.interactiveResponseMessage;
    const nativeResponse = response?.nativeFlowResponseMessage;
    const paramsJson = nativeResponse?.paramsJson ?? response?.paramsJson;
    if (response?.selectedId) return response.selectedId;
    if (typeof paramsJson !== 'string' || !paramsJson) return null;

    try {
        const params = JSON.parse(paramsJson);
        return params?.id ?? params?.selectedId ?? params?.selected_id ??
            params?.buttonId ?? params?.button_id ?? params?.rowId ?? params?.row_id ?? null;
    } catch {
        return paramsJson;
    }
}

global.ignoredUsersGlobal ??= new Set();
global.ignoredUsersGroup ??= {};
global.groupSpam ??= {};
global.processedMessages ??= new Set();
global.processedCalls ??= new Map();
global.spamTracker ??= {};
global.groupCloseTimers ??= {};
global.activeEvents ??= new Map();
global.activeGiveaways ??= new Map();

global.groupCache ??= new NodeCache({
    stdTTL: 300,
    useClones: false,
    checkperiod: 60,
    maxKeys: 2000
});
global.jidCache ??= new NodeCache({
    stdTTL: 3600,
    useClones: false,
    checkperiod: 600,
    maxKeys: 5000
});
global.nameCache ??= new NodeCache({
    stdTTL: 3600,
    useClones: false,
    checkperiod: 600,
    maxKeys: 5000
});

export async function loadAllPlugins(pluginsDir = ___dirname) {
    const results = {};
    async function scanDir(dir, prefix = '') {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        await Promise.allSettled(entries.map(async (entry) => {
            const fullPath = path.join(dir, entry.name);
            const relName = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                await scanDir(fullPath, relName);
            } else if (entry.isFile() && /\.(js|mjs|cjs)$/.test(entry.name) && !entry.name.startsWith('_')) {
                try {
                    const mod = await import(`${fullPath}?t=${Date.now()}`);
                    results[relName] = mod.default ?? mod;
                } catch (e) {
                    console.error(chalk.red(`[plugins] Errore caricamento ${relName}:`), e.message);
                }
            }
        }));
    }
    await scanDir(pluginsDir);
    return results;
}

export const fetchMetadata = async (conn, chatId) => conn.groupMetadata(chatId);

const fetchGroupMetadataWithRetry = async (conn, chatId) => {
    try {
        return await conn.groupMetadata(chatId);
    } catch {
        return null;
    }
};

global.getGroupAdmins = async (conn, groupId) => {
    try {
        let meta = global.groupCache.get(groupId);
        if (!meta) {
            meta = await fetchGroupMetadataWithRetry(conn, groupId);
            if (meta) global.groupCache.set(groupId, meta);
        }
        if (!meta) return [];
        return [...new Set(meta.participants
            .filter(isParticipantAdmin)
            .flatMap(p => [p.id, p.jid, p.lid, p.phoneNumber]
                .filter(Boolean)
                .map(jid => conn.decodeJid(jid))))];
    } catch {
        return [];
    }
};

global.isGroupAdmin = async (conn, groupId, userId) => {
    try {
        const meta = global.groupCache.get(groupId) || await fetchGroupMetadataWithRetry(conn, groupId);
        return isParticipantAdmin(findGroupParticipant(meta?.participants, userId, conn));
    } catch {
        return false;
    }
};

function initResponseHandler(conn) {
    if (conn.waitForResponse) return;
    conn.waitForResponse = (chat, sender, options = {}) => {
        const {
            timeout = 30_000,
            validResponses = null,
            onTimeout = null,
            filter = null
        } = options;
        return new Promise(resolve => {
            const key = `${normalizeJidKey(chat)}:${normalizeJidKey(sender)}`;
            const timeoutId = setTimeout(() => {
                responseHandlers.delete(key);
                onTimeout?.();
                resolve(null);
            }, timeout);
            responseHandlers.set(key, {
                resolve,
                timeoutId,
                validResponses,
                filter
            });
        });
    };
}

export function ensureGroupCacheListeners(conn) {
    if (!conn?.ev) return false
    try {
        if (!conn.__ghostAdminListeners) {
            conn.ev.on('group-participants.update', (update) => {
                try {
                    const id = update?.id
                    if (!id) return
                    global.groupCache?.del?.(id)
                } catch {}
            });
            conn.ev.on('groups.update', (updates) => {
                try {
                    for (const update of (Array.isArray(updates) ? updates : [updates])) {
                        if (update?.id) global.groupCache?.del?.(update.id)
                    }
                } catch {}
            });
            conn.__ghostAdminListeners = true
        }
    } catch { return false }
    return true
}

if (!global.adminListenerSet && global.conn) {
    ensureGroupCacheListeners(global.conn)
    global.conn.ev.on('group-participants.update', ({ id, action }) => {
        try {
            if (action === 'promote' || action === 'demote') global.groupCache.del(id);
        } catch {}
    });
    global.adminListenerSet = true;
}

if (!global.cacheListenersSet && global.conn) {
    const conn = global.conn;

    const registerGroup = async (groupId) => {
        try {
            global.db.data.chats[groupId] ??= {
                isBanned: false,
                expired: 0,
                users: {}
            };
            const meta = await fetchGroupMetadataWithRetry(conn, groupId);
            if (meta) global.groupCache.set(groupId, meta);
        } catch {}
    };

    setTimeout(async () => {
        try {
            const groups = await conn.groupFetchAllParticipating();
            await Promise.allSettled(Object.keys(groups).map(id => registerGroup(id)));
        } catch {}
    }, 5000);

    conn.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
            if (!update?.id) continue;
            global.groupCache.del(update.id);
            await registerGroup(update.id);
        }
    });

    conn.ev.on('group-participants.update', async (update) => {
        if (!update?.id) return;
        global.groupCache.del(update.id);
        await registerGroup(update.id);
    });

    global.cacheListenersSet = true;
}

if (!global.pollListenerSet && global.conn) {
    global.conn.ev.on('messages.update', async (chatUpdate) => {
        for (const { key, update } of chatUpdate) {
            if (!update.pollUpdates) continue;
            try {
                const pollCreation = await global.store.getMessage(key);
                if (pollCreation)
                    await getAggregateVotesInPollMessage({
                        message: pollCreation,
                        pollUpdates: update.pollUpdates
                    });
            } catch {}
        }
    });
    global.pollListenerSet = true;
}

if (global.conn?.ws) {
    global.conn.ws.on('CB:call', async (json) => {
        try {
            if (json?.tag !== 'call' || !json.attrs?.from) return;

            const callerId = global.conn.decodeJid(json.attrs.from);
            if (isBotOwnerNumber(callerId)) return;

            const eventId = json.attrs.id;
            let actualCallId = null;
            for (const item of (json.content ?? [])) {
                if (item?.attrs?.['call-id']) {
                    actualCallId = item.attrs['call-id'];
                    break;
                }
            }
            const uniqueId = actualCallId ?? eventId;
            const tags = (json.content ?? []).map(i => i.tag);

            if (tags.includes('terminate')) {
                global.processedCalls.delete(uniqueId);
                return;
            }

            if (!global.db?.data) return;
            if (!global.db.data.settings) global.db.data.settings = {};
            const botJid = global.conn.user.jid;
            if (!global.db.data.settings[botJid]) {
                global.db.data.settings[botJid] = {
                    jadibotmd: false,
                    antiprivato: true,
                    soloCreatore: false,
                                        anticall: false,
                    status: 0
                };
            }

            const settings = global.db.data.settings[botJid];
                        if (settings.anticall !== true) return;

            if (!tags.includes('offer') && !tags.includes('relaylatency')) return;
            if (global.processedCalls.has(uniqueId)) return;
            global.processedCalls.set(uniqueId, true);

                        try {
                await global.conn.rejectCall(uniqueId, callerId);
            } catch (e) {
                console.error('[anticall] rejectCall failed:', e?.message || e);
                global.processedCalls.delete(uniqueId);
                return;
            }

                        try {
                await global.conn.sendMessage(callerId, {
                    text: `📵 *Chiamata rifiutata*\n━━━━━━━━━━━━━━━\n⛔ Le chiamate vocali e video non sono consentite su questo bot.\n━━━━━━━━━━━━━━━\n_${pkg.name}_`
                });
            } catch {}

                        if (settings.anticallBlock === true) {
                try {
                    global.db.data.users[callerId] = global.db.data.users[callerId] || {};
                    global.db.data.users[callerId].banned = true;
                    global.db.data.users[callerId].bannedReason = 'Chiamata bloccata - anticall attivo';
                    global.markDbDirty?.();
                } catch {}

                if (typeof global.conn.blockUser === 'function') {
                    try {
                        await global.conn.blockUser(callerId);
                    } catch (e) {
                        console.error('[anticall] blockUser failed:', e?.message || e);
                    }
                }
            }

            console.log(`[anticall] chiamata rifiutata da ${callerId} (id ${uniqueId})`);
        } catch (e) {
            console.error('[anticall] errore handler:', e?.message || e);
        }
    });
}

setInterval(() => {
    if (global.processedCalls.size > 10) global.processedCalls.clear();
}, 180_000);

function calcAdminFlags(conn, participants, groupMetadata, normalizedSender, normalizedBot) {
    const decoded = typeof conn?.decodeJid === 'function' ? conn.decodeJid : (jid => jid);

    const rawOwner = groupMetadata.owner || groupMetadata.ownerLid || null;
    const nOwner = rawOwner ? normalizeNumber(decoded(rawOwner)) : null;

    const isAdmin =
        normalizedSender === nOwner ||
        isParticipantAdmin(findGroupParticipant(participants, normalizedSender, conn));

    const isBotAdmin =
        normalizedBot === nOwner ||
        participants.some(u => {
            const ids = [u.id, u.jid, u.lid, u.phoneNumber].filter(Boolean);
            const matchesSender = ids.some(id => {
                const decodedId = decoded(id);
                return decodedId === normalizedSender || normalizeNumber(decodedId) === normalizedSender;
            });
            return matchesSender && (u.admin === 'admin' || u.admin === 'superadmin' || u.admin === true);
        });

    const botParticipant = findGroupParticipant(participants, normalizedBot, conn);
    const resolvedBotAdmin = normalizedBot === nOwner || isParticipantAdmin(botParticipant) || isBotAdmin;

    const isRAdmin = normalizedSender === nOwner;

    return {
        isAdmin,
        isBotAdmin: resolvedBotAdmin,
        isRAdmin
    };
}

function canUseModoadmin(chat, isGroup, isAdmin, isOwner, isROwner, isMods) {
    if (!isGroup || !chat.modoadmin) return true;
    return isAdmin || isOwner || isROwner || isMods;
}

export async function handler(chatUpdate) {
    this.msgqueque ??= [];
    this.uptime ??= Date.now();

    if (!chatUpdate?.messages?.length) return;

    // FIX DEFINITIVO: d'ora in poi legge TUTTI i messaggi (qualsiasi tipo),
    // ma dopo un riavvio processa SOLO quelli nuovi dal boot in poi.
    // In questo modo il riavvio non ricarica il backlog vecchio ed è veloce.
    const bootCutoff = (global.bootTime ?? Date.now()) - BOOT_GRACE_MS;
    const freshMessages = [];
    for (const raw of chatUpdate.messages) {
        if (!raw?.key?.remoteJid) continue;
        const ts = getMsgTimestampMs(raw);
        if (ts && ts < bootCutoff) continue; // vecchio messaggio pre-riavvio: scarta
        freshMessages.push(raw);
    }
    if (!freshMessages.length) return;
    chatUpdate = { ...chatUpdate, messages: freshMessages };

    this.pushMessage(chatUpdate.messages).catch(err => {
        if (!err.message?.includes('Bad MAC') && !err.message?.includes('absent'))
            console.error('[ERRORE] pushMessage:', err);
    });

    for (let m of chatUpdate.messages) {
        if (!m?.key?.remoteJid) continue;
        cacheMessageIdentityMappings(m.key);
        const logLid = getMessageLid(m.key);

        if (!m.message) {
            const reason = m.messageStubParameters?.[0];
            console.warn(
                `[MESSAGGIO NON DECRITTATO] chat=${m.key.remoteJid} id=${m.key.id || 'sconosciuto'}${reason ? ` motivo=${reason}` : ''}`
            );
            continue;
        }

        if (m.message?.protocolMessage?.type === 'MESSAGE_EDIT') {
            const { key: eKey, editedMessage } = m.message.protocolMessage;
            m.key = eKey;
            m.message = editedMessage;
            m.text = editedMessage.conversation ?? editedMessage.extendedTextMessage?.text ?? '';
            m.mtype = Object.keys(editedMessage)[0];
        }

        m = smsg(this, m, global.store);
        if (!m?.key?.remoteJid) continue;
        if (logLid) m._logLid = logLid;

        if (m.messageStubType === 29 || m.messageStubType === 30)
            global.groupCache.del(m.chat);

        try {
            m.key.remoteJid = this.decodeJid(m.key.remoteJid);
            if (m.key.participant) {
                m.key.participant = this.decodeJid(m.key.participant);
                // FIX: preserva i JID @lid (Baileys LID). Forzare @s.whatsapp.net
                // su un LID rompeva il sender -> "undefined" in console.
                if (typeof m.key.participant === 'string' && m.key.participant && !m.key.participant.includes('@')) {
                    m.key.participant = m.key.participant + '@s.whatsapp.net';
                }
            }
        } catch {
            continue;
        }

        m.chat ??= m.key.remoteJid;
        // LEGGE TUTTI: catena di fallback così nessun messaggio viene scartato
        // per sender corrotto. Prova participant -> remoteJid -> grezzo.
        m.sender = this.decodeJid(resolveMessageSender(m.key));
        if ((!m.sender || m.sender.includes('undefined')) && m.key.remoteJid && !String(m.key.remoteJid).includes('undefined')) {
            m.sender = this.decodeJid(m.key.remoteJid);
        }
        if ((!m.sender || m.sender.includes('undefined') || !m.sender.includes('@')) && m.key.remoteJid) {
            const lastResort = m.key.participant || m.key.remoteJid || '';
            if (lastResort && !String(lastResort).includes('undefined') && String(lastResort).includes('@')) {
                m.sender = String(lastResort);
            }
        }

        if (!m.chat || !m.sender) continue;
        if (typeof m.chat !== 'string' || typeof m.sender !== 'string') continue;
        // Ultima spiaggia: solo i JID irrecuperabili escono, tutto il resto viene LETTO
        if (m.sender.includes('undefined') || !m.sender.includes('@')) continue;
        if (!m.chat.includes('@') || m.chat.includes('undefined')) continue;

        const msgId = m.key?.id;
        if (msgId) {
            if (global.processedMessages.has(msgId)) continue;
            global.processedMessages.add(msgId);
            setTimeout(() => global.processedMessages.delete(msgId), DUPLICATE_WINDOW);
        }

        initResponseHandler(this);

        const _btnDispatch = async (buttonId) => {
            if (!buttonId || typeof buttonId !== 'string') return false;

            const sender = normalizeNumber(this.decodeJid(m.key.participant ?? m.sender));
            const chat = m.key.remoteJid;
            const respKey = `${normalizeJidKey(chat)}:${normalizeJidKey(sender)}`;
            if (responseHandlers.has(respKey)) {
                const rh = responseHandlers.get(respKey);
                clearTimeout(rh.timeoutId);
                responseHandlers.delete(respKey);
                rh.resolve({
                    text: buttonId,
                    sender,
                    chat
                });
                return true;
            }

            try {
                await handler.call(this, {
                    messages: [{
                        key: {
                            remoteJid: m.key.remoteJid,
                            fromMe: false,
                            id: `btn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                            participant: m.key.participant ?? m.sender
                        },
                        message: {
                            conversation: buttonId
                        },
                        text: buttonId,
                        messageTimestamp: m.messageTimestamp ?? Math.floor(Date.now() / 1000),
                        pushName: m.pushName ?? '',
                        broadcast: false,
                        participant: m.key.participant ?? m.sender
                    }]
                });
            } catch (error) {
                console.error('[ERRORE] Esecuzione comando da pulsante:', error);
            }
            return true;
        };

        if (m.message?.buttonsResponseMessage) {
            const r = m.message.buttonsResponseMessage;
            if (await _btnDispatch(r?.selectedButtonId ?? r?.id)) continue;
        }
        if (m.message?.templateButtonReplyMessage) {
            const r = m.message.templateButtonReplyMessage;
            if (await _btnDispatch(r?.selectedId ?? r?.id)) continue;
        }
        if (m.message?.interactiveResponseMessage) {
            const buttonId = getInteractiveButtonId(m.message);
            if (await _btnDispatch(buttonId)) continue;
        }
        if (m.message?.listResponseMessage) {
            const r = m.message.listResponseMessage;
            if (await _btnDispatch(r?.singleSelectReply?.selectedRowId ?? r?.selectedRowId ?? r?.id)) continue;
        }

        if (m.message?.eventResponseMessage) {
            try {
                const { eventId, response } = m.message.eventResponseMessage;
                const jid = this.decodeJid(m.key.remoteJid);
                const userId = this.decodeJid(m.key.participant ?? m.key.remoteJid);
                const action = response === 'going' ? 'join' : 'leave';
                const evData = global.activeEvents.get(eventId) ?? global.activeGiveaways.get(jid);
                if (evData) {
                    evData.participants ??= new Set();
                    action === 'join' ? evData.participants.add(userId) : evData.participants.delete(userId);
                }
            } catch {}
        }

        if (!global.db.data) await global.loadDatabase();

        m.exp = 0;
        m['888coin'] = false;
        m.isCommand = false;

        const normalizedSender = this.decodeJid(m.sender);
        const normalizedBot = this.decodeJid(this.user.jid);

        if (!normalizedSender?.includes('@')) continue;
        if (normalizedSender.endsWith('@broadcast') || normalizedSender.endsWith('@newsletter')) continue;
        if (!normalizedSender.endsWith('@s.whatsapp.net') && !normalizedSender.endsWith('@lid')) continue;

        try {
            Object.defineProperty(m, 'sender', {
                value: normalizedSender,
                writable: true,
                configurable: true
            });
        } catch {
            m.normalizedSender = normalizedSender;
        }

        global.db.data.users[normalizedSender] ??= {
            exp: 0,
            '888coin': 10,
            muto: false,
            registered: false,
            name: m.pushName ?? '?',
            age: -1,
            regTime: -1,
            banned: false,
            bank: 0,
            level: 0,
            role: 'Novizio',
            firstTime: Date.now(),
            spam: 0,
            messaggi: 0,
            warn: 0,
            warnCount: 0,
            blasphemy: 0,
            comandiEseguiti: 0,
            premium: false,
            isAdmin: false,
            nomeinsta: '',
            gruppiincuieadmin: '',
            autolevelup: true,
            lastclaim: 0,
            afk: 0,
            afkReason: '',
            limit: 15000,
            premiumDate: -1,
            premiumTime: 0,
            money: 0,
            joincount: 2
        };

        const user = global.db.data.users[normalizedSender];
        for (const [k, v] of Object.entries({
            messaggi: 0,
            warn: 0,
            warnCount: 0,
            blasphemy: 0,
            comandiEseguiti: 0,
            banned: false,
            muto: false,
            premium: false,
            isAdmin: false,
            nomeinsta: '',
            gruppiincuieadmin: '',
            role: 'Novizio',
            level: 0
        })) user[k] ??= v;

                if (user['888coin'] == null && typeof user.euro === 'number') {
            user['888coin'] = user.euro;
        }
        if (user.euro !== undefined) delete user.euro;

        if (user.banned) {
            if (!user.notifiedBan) {
                await this.sendMessage(m.chat, {
                    text: 'âŒ Un owner ti ha bloccato i comandi!'
                }, {
                    quoted: m
                });
                user.notifiedBan = true;
            }
            continue;
        }

        const chatDefaults = {
            isBanned: false,
            welcome: false,
            goodbye: false,
            ai: false,
            vocali: false,
            antiporno: true,
            antigore: true,
            antitrava: true,
            antibot: true,
            antiBot: true,
            antinuke: true,
            modoadmin: true,
            antiLink: true,
            logrichieste: true,
            antioneview: false,
            autolevelup: false,
            antivoip: false,
            rileva: false,
            antiLink2: false,
            slowmode: false,
            reaction: false,
            provocazioni: false,
            antispam: false,
            tagCount: 0,
            tagLastReset: 0,
            expired: 0,
            users: {},
            topUsers: {},
            topRich: {},
            topBlasphemy: {}
        };
        const chat = global.db.data.chats[m.chat] ??= chatDefaults;
        for (const k of ['antiporno', 'antigore', 'antitrava', 'antibot', 'antiBot', 'antinuke', 'modoadmin', 'antiLink', 'logrichieste']) {
            if (chat[k] === undefined || chat[k] === null) chat[k] = true;
        }
        for (const k of ['antiraid', 'antiraidlink', 'antiraidlinkPunish', 'antiraidlinkSilent', 'antiraidWhitelist', 'antighost', 'antighostWindow', 'antighostIgnore', 'antighostLog', 'antipayment']) {
            if (k in chat) delete chat[k];
        }
        chat.topUsers ??= {};
        chat.topRich ??= {};
        chat.topBlasphemy ??= {};

        const settingsDefaults = {
            autoread: false,
            jadibotmd: false,
            antiprivato: true,
            soloCreatore: false,
            status: 0,
            anticall: false,
            anticallBlock: false
        };
        const settings = global.db.data.settings[this.user.jid] ??= settingsDefaults;

        if (m.mtype === 'pollUpdateMessage' || m.mtype === 'reactionMessage') continue;

        const responseKey = `${normalizeJidKey(m.chat)}:${normalizeJidKey(normalizeNumber(normalizedSender))}`;
        if (responseHandlers.has(responseKey)) {
            const rh = responseHandlers.get(responseKey);
            let ok = true;
            if (typeof rh.filter === 'function') ok = rh.filter(m);
            if (rh.validResponses?.length) {
                const txt = (m.text ?? '').toLowerCase().trim();
                ok = rh.validResponses.some(v => txt === v.toLowerCase() || txt.includes(v.toLowerCase()));
            }
            if (ok) {
                clearTimeout(rh.timeoutId);
                responseHandlers.delete(responseKey);
                rh.resolve(m);
                continue;
            }
        }

        let isBotAdmin = false,
        isAdmin = false,
        isGroupAdmin = false,
        isRAdmin = false;

// --- PATCH LID OWNER BY AXTRAL

const isElixir = (global.owner || []).some(entry => {
    const raw = Array.isArray(entry) ? entry[0] : entry;
    return isOwnerJid(normalizedSender, raw);
});
const isROwner = isElixir;
const isOwner = isROwner;
// --- FINE PATCH ---

        const isMods = isOwner ||
            global.mods?.map(v => v.replace(/\D/g, '') + '@s.whatsapp.net').includes(normalizedSender) ||
            global.db.data.chats?.[m.chat]?.moderatori?.includes(normalizedSender) || false;
        const isPrems = isROwner ||
            global.prems?.map(v => v.replace(/\D/g, '') + '@s.whatsapp.net').includes(normalizedSender) || false;
       //antiprivato by axtral
if (!m.isGroup && global.db.data.settings[this.user.jid]?.antiprivato && !isOwner && !isROwner) {
    continue;
}
        let groupMetadata = null;
        let participants = [];
        let normalizedParticipants = [];

        if (m.isGroup) {
            groupMetadata = global.groupCache.get(m.chat);
            if (!groupMetadata) {
                groupMetadata = await fetchGroupMetadataWithRetry(this, m.chat);
                if (groupMetadata) global.groupCache.set(m.chat, groupMetadata);
            }
            if (groupMetadata?.participants) {
                participants = groupMetadata.participants;
                normalizedParticipants = participants.map(u => {
                    const nId = this.decodeJid(u.id ?? u.jid ?? '');
                    return {
                        ...u,
                        id: nId,
                        jid: u.jid ?? nId
                    };
                });
                const flags = calcAdminFlags(this, participants, groupMetadata, normalizedSender, normalizedBot);
                isAdmin = flags.isAdmin;
                isGroupAdmin = flags.isAdmin;
                isBotAdmin = flags.isBotAdmin;
                isRAdmin = flags.isRAdmin;
            }
        }

        if (m.isGroup && chat.antimedia && !isAdmin && !isROwner && !isOwner) {
            if (['imageMessage', 'videoMessage'].includes(m.mtype)) {
                try {
                    await this.sendMessage(m.chat, {
                        delete: m.key
                    });
                    await this.sendMessage(m.chat, {
                        text: `@${normalizedSender.split('@')[0]}, sono consentiti solo foto e video visualizzabili una volta! ⚠️`,
                        mentions: [normalizedSender]
                    });
                } catch {}
                continue;
            }
        }

        if (m.isGroup && chat.antispam && !isGroupAdmin && !isROwner && !isOwner) {
            const chatId = m.chat,
                userId = normalizedSender;
            global.spamTracker[chatId] ??= {};
            global.spamTracker[chatId][userId] ??= {
                messages: 0,
                stickers: 0,
                warns: 0,
                timeout: null,
                keys: [],
                stickerKeys: []
            };
            const data = global.spamTracker[chatId][userId];

            if (['conversation', 'extendedTextMessage'].includes(m.mtype)) {
                data.messages++;
                data.keys.push(m.key);
            }
            if (m.mtype === 'stickerMessage') {
                data.stickers++;
                data.keys.push(m.key);
                data.stickerKeys.push(m.key);
            }
            if (data.timeout) clearTimeout(data.timeout);
            data.timeout = setTimeout(() => {
                data.messages = 0;
                data.stickers = 0;
                data.keys = [];
                data.stickerKeys = [];
                data.timeout = null;
            }, 8000);

            const closeGroup = async (seconds) => {
                if (global.groupCloseTimers[chatId]) clearTimeout(global.groupCloseTimers[chatId]);
                await this.groupSettingUpdate(chatId, 'announcement').catch(() => {});
                await this.sendMessage(chatId, {
                    text: `🔒 Il gruppo è stato chiuso per ${seconds} secondi per motivi di sicurezza.`
                });
                global.groupCloseTimers[chatId] = setTimeout(async () => {
                    await this.groupSettingUpdate(chatId, 'not_announcement').catch(() => {});
                    await this.sendMessage(chatId, {
                        text: '✅ Il gruppo è stato riaperto.'
                    });
                    delete global.groupCloseTimers[chatId];
                }, seconds * 1000);
            };

            if (data.messages >= 15 || data.stickers >= 5) {
                try {
                    if (data.warns === 0) {
                        data.warns = 1;
                        await Promise.allSettled(data.stickerKeys.map(key => this.sendMessage(chatId, { delete: key }).catch(() => {})));
                        await closeGroup(30);
                        await this.sendMessage(chatId, {
                            text: `⚠️ @${userId.split('@')[0]}, questo è il primo avvertimento per spam. Il gruppo è stato chiuso per 30 secondi; al prossimo episodio verrai espulso.`,
                            mentions: [userId]
                        });
                        data.messages = 0;
                        data.stickers = 0;
                        data.keys = [];
                        data.stickerKeys = [];
                        continue;
                    }
                    await Promise.allSettled(data.keys.map(key => this.sendMessage(chatId, { delete: key }).catch(() => {})));
                    await this.sendMessage(chatId, {
                        text: `🚫 *Utente espulso per spam*\n\n@${userId.split('@')[0]}`,
                        mentions: [userId]
                    });
                    await this.groupParticipantsUpdate(chatId, [userId], 'remove');
                    await closeGroup(60);
                    delete global.spamTracker[chatId][userId];
                    continue;
                } catch {}
            }
        }

        if (chat.isBanned && !isOwner) continue;

        const pluginMap = pluginIndex(global.plugins, global.prefix ?? '.');
        const allPlugins = Object.entries(global.plugins).filter(([, p]) => p && !p.disabled);
        await Promise.allSettled(
            allPlugins
                .filter(([, p]) => typeof p.all === 'function')
                .map(([name, p]) =>
                    p.all.call(this, m, {
                        chatUpdate,
                        __dirname: ___dirname,
                        __filename: join(___dirname, name)
                    })
                        .catch(e => console.error(`[ERRORE] plugin.all (${name}):`, e))
                )
        );

        try {
            let usedPrefix = null;

            const commandCandidates = candidates(m.text, { index: pluginMap });
            const pluginEntries = commandCandidates.map(([name, plugin]) => {
                const __filename = join(___dirname, name);

                const _prefix = plugin.customPrefix ?? global.prefix ?? '.';
                const match = (
                    _prefix instanceof RegExp ? [
                        [_prefix.exec(m.text), _prefix]
                    ] :
                    Array.isArray(_prefix) ? _prefix.map(p => [p instanceof RegExp ? p.exec(m.text) : new RegExp(str2Regex(p)).exec(m.text), p]) :
                    typeof _prefix === 'string' ? [
                        [new RegExp(str2Regex(_prefix)).exec(m.text), _prefix]
                    ] : [
                        [
                            [], new RegExp
                        ]
                    ]
                ).find(([p]) => p);

                return { name, plugin, __filename, match };
            });

            const beforeHooks = pluginEntries
                .filter(e => typeof e.plugin.before === 'function')
                .map(e => [e.name, () => e.plugin.before.call(this, m, {
                    match: e.match,
                    conn: this,
                    participants: normalizedParticipants,
                    groupMetadata,
                    user: {
                        admin: isAdmin ? 'admin' : null
                    },
                    bot: {
                        admin: isBotAdmin ? 'admin' : null
                    },
                    isElixir,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    isMods,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename: e.__filename
                })]);

            const skip = new Set();

            if (beforeHooks.length) {
                const { results } = await runBeforeAll(beforeHooks, {
                    timeout: global.busTimeout ?? 500
                });
                for (let i = 0; i < results.length; i++) {
                    const r = results[i];
                    if (r.status === 'ok' && r.value) skip.add(beforeHooks[i][0]);
                }
            }

            for (const { name, plugin, __filename, match } of pluginEntries) {
                if (skip.has(name)) continue;
if (typeof plugin !== 'function') continue;
                if (!match?.[0]) continue;
                if (typeof m.text !== 'string') continue;

                usedPrefix = (match[0] || '')[0];
                if (!usedPrefix) continue;

                const noPrefix = m.text.replace(usedPrefix, '');
                let [command, ...args] = noPrefix.trim().split` `.filter(Boolean);
                args = args ?? [];
                const _args = noPrefix.trim().split` `.slice(1);
                const text = _args.join` `;
                const rawCommand = command;
                command = command?.toLowerCase() ?? '';
                const fail = plugin.fail ?? global.dfail;

                const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
                    Array.isArray(plugin.command) ? plugin.command.some(c => c instanceof RegExp ? c.test(command) : c === command) :
                    typeof plugin.command === 'string' ? plugin.command === command : false;
                if (!isAccept) continue;

                if (m.isGroup && (plugin.admin || plugin.botAdmin)) {
                    const freshMeta = global.groupCache.get(m.chat) ?? await fetchGroupMetadataWithRetry(this, m.chat);
                    if (freshMeta) {
                        global.groupCache.set(m.chat, freshMeta);
                        groupMetadata = freshMeta;
                        participants = freshMeta.participants;

                        const connDecode = (typeof this?.decodeJid === 'function' ? this.decodeJid : (typeof conn?.decodeJid === 'function' ? conn.decodeJid : (jid => jid)));
                        const botRaw = (typeof conn?.user?.jid === 'string' ? conn.user.jid : (typeof conn?.user?.id === 'string' ? conn.user.id : ''));
                        const normalizedBot = connDecode(botRaw || '');

                        normalizedParticipants = participants.map(u => {
                            const base = u.id || u.jid || u.lid || '';
                            const nId = connDecode(base || '');
                            return {
                                ...u,
                                id: nId,
                                jid: u.jid ?? nId,
                                lid: u.lid ?? nId
                            };
                        });

                                                const botParticipant = normalizedParticipants.find(u =>
                            u.id === normalizedBot ||
                            (typeof u.jid === 'string' && u.jid === normalizedBot) ||
                            (typeof u.lid === 'string' && u.lid === normalizedBot)
                        );
                        const directBotAdmin = !!(botParticipant && (
                            botParticipant.admin === 'admin' ||
                            botParticipant.admin === 'superadmin' ||
                            botParticipant.admin === true
                        ));

                        const flags = calcAdminFlags(this, participants, freshMeta, normalizedSender, normalizedBot);
                        isAdmin = flags.isAdmin;
                        isBotAdmin = !!(directBotAdmin || flags.isBotAdmin);
                        isRAdmin = flags.isRAdmin;
                    }
                }

                if (plugin.disabled && !isOwner) {
                    fail('disabled', m, this);
                    continue;
                }
                if (user.muto && !isROwner && !isOwner) {
                    await this.sendMessage(m.chat, {
                        text: `Sei stato mutato, non puoi usare i comandi.`
                    }, {
                        quoted: m
                    }).catch(() => {});
                    break;
                }

                const ignoredGlobally = global.ignoredUsersGlobal.has(normalizedSender);
                const ignoredInGroup = m.isGroup && global.ignoredUsersGroup[m.chat]?.has(normalizedSender);
                if ((ignoredGlobally || ignoredInGroup) && !isROwner) {
                    await this.sendMessage(m.chat, {
                        text: `Non sei autorizzato a usare comandi.`
                    }, {
                        quoted: m
                    }).catch(() => {});
                    break;
                }

                m.plugin = name;
                if (chat.isBanned && !isROwner && !['gp-sbanchat.js', 'creatore-exec.js', 'gp-delete.js'].includes(name)) break;
                if (user.banned && !isROwner && name !== 'creatore-banuser.js') {
                    if (user.antispam > 2) break;
                    await this.sendMessage(m.chat, {
                        text: `Sei stato bannato/a dall'utilizzo del bot.\n\n${user.bannedReason ? `Motivo: ${user.bannedReason}` : 'Motivo: Non specificato ma meritato'}\n\nContatta il creatore [...]`
                    }, {
                        quoted: m
                    }).catch(() => {});
                    user.antispam = (user.antispam ?? 0) + 1;
                    break;
                }

                if (m.isGroup) {
                    const isAntispamOwner = isROwner || isOwner || isElixir;
                    const gSpam = global.groupSpam[m.chat] ??= {
                        count: 0,
                        firstCommandTimestamp: 0,
                        isSuspended: false,
                        suspendedAt: 0
                    };
                    const now = Date.now();

                    if (gSpam.isSuspended) {
                        if (now - gSpam.suspendedAt < 20_000) {
                                                        if (!isAntispamOwner) {
                                break;
                            }
                        } else {
                            gSpam.isSuspended = false;
                            gSpam.count = 0;
                            gSpam.firstCommandTimestamp = 0;

                            const ownerMentions = global.owner?.map(([num]) => normalizeNumber(num)) ?? [];
                            const mentions = ownerMentions.length > 0 ? ownerMentions : [];

                            await this.sendMessage(m.chat, {
                                text: mentions.length > 0
                                    ? `✅ *Antispam comandi terminato!* Il bot è di nuovo attivo.\n\n${mentions.map(o => '@' + o.split('@')[0]).join(', ')}`
                                    : `✅ *Antispam comandi terminato!* Il bot è di nuovo attivo.`,
                                mentions
                            }).catch(() => {});
                        }
                    }

                                        if (!gSpam.isSuspended && !isAntispamOwner) {
                        if (now - gSpam.firstCommandTimestamp > 10_000) {
                            gSpam.count = 1;
                            gSpam.firstCommandTimestamp = now;
                        } else {
                            gSpam.count++;
                        }

                        if (gSpam.count > 5) {
                            gSpam.isSuspended = true;
                            gSpam.suspendedAt = now;

                            const ownerMentions = global.owner?.map(([num]) => normalizeNumber(num)) ?? [];
                            const mentions = ownerMentions.length > 0 ? ownerMentions : [];

                            await this.sendMessage(m.chat, {
                                text: mentions.length > 0
                                    ? `🚫 *Antispam comandi attivo!* Il bot non risponderà per 20 secondi.\n\n${mentions.map(o => '@' + o.split('@')[0]).join(', ')}`
                                    : `🚫 *Antispam comandi attivo!* Il bot non risponderà per 20 secondi.`,
                                mentions
                            }).catch(() => {});
                            break;
                        }
                    }
                }

                if (!canUseModoadmin(chat, m.isGroup, isAdmin, isOwner, isROwner, isMods)) break;
                if (m.isGroup && chat.antiporno && plugin.tags?.includes('nsfw') && !isAdmin && !isOwner && !isROwner) {
                    fail('restrict', m, this);
                    continue;
                }
                if (m.isGroup && chat.antiLink && plugin.tags?.includes('link') && !isAdmin && !isOwner && !isROwner) {
                    fail('restrict', m, this);
                    continue;
                }
                if (settings.soloCreatore && !isROwner) break;
                if (plugin.elixir && !isElixir) {
                    fail('elixir', m, this);
                    continue;
                }

                const _pluginPerms = global.db.data.pluginPerms?.[normalizedSender] ?? [];
                const _pluginBaseName = name.replace(/^.*[\\/]/, '').replace(/\.(js|mjs|cjs)$/, '').toLowerCase();
                const _hasPerm = _pluginPerms.includes(_pluginBaseName) ||
                    (plugin.command instanceof RegExp && _pluginPerms.some(p => plugin.command.test(p))) ||
                    (typeof plugin.command === 'string' && _pluginPerms.includes(plugin.command.toLowerCase()));

                if (plugin.rowner && !isROwner && !_hasPerm) {
                    fail('rowner', m, this);
                    continue;
                }
                if (plugin.owner && !isOwner && !isROwner && !_hasPerm) {
                    fail('owner', m, this);
                    continue;
                }
                if (plugin.mods && !isMods && !isAdmin && !isOwner && !isROwner) {
                    fail('mods', m, this);
                    continue;
                }
                if (plugin.premium && !isPrems) {
                    fail('premium', m, this);
                    continue;
                }
                if (plugin.group && !m.isGroup) {
                    fail('group', m, this);
                    continue;
                }
                if (plugin.botAdmin && !isBotAdmin) {
                    fail('botAdmin', m, this);
                    continue;
                }
                if (plugin.admin && !isAdmin && !isOwner) {
                    fail('admin', m, this);
                    continue;
                }
                if (plugin.private && m.isGroup) {
                    fail('private', m, this);
                    continue;
                }
                if (plugin.register && !user.registered) {
                    fail('unreg', m, this);
                    continue;
                }

                m.isCommand = true;
                const xp = 'exp' in plugin ? parseInt(plugin.exp) : 17;
                m.exp += xp <= 200 ? xp : 0;


                if (!isPrems && plugin['888coin'] && user['888coin'] < plugin['888coin']) {
                    await this.reply(m.chat, 'Non hai abbastanza 888coin per usare questo comando.', m, null, global.rcanal).catch(() => {});
                    continue;
                }

                const extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                    participants: normalizedParticipants,
                    groupMetadata,
                    user: {
                        admin: isAdmin ? 'admin' : null
                    },
                    bot: {
                        admin: isBotAdmin ? 'admin' : null
                    },
                    isElixir,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    isMods,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename,
                    mentionedJid: m.mentionedJid ?? []
                };

                try {
                    const cmdName = m.plugin || __filename || 'plugin';
                    const outcome = await runGuarded(
                        `${cmdName}`,
                        () => plugin.call(this, m, extra),
                        { timeout: global.busCommandTimeout ?? 30000 }
                    );
                    if (outcome.status === 'ok') {
                        if (!isPrems) m['888coin'] = plugin['888coin'] || false;
                    } else if (outcome.status === 'timeout') {
                        m.error = outcome.error;
                        await this.reply(
                            m.chat,
                            '⚠️ Il comando ha impiegato troppo tempo ed è stato interrotto.',
                            m
                        ).catch(() => {});
                    } else {
                        throw outcome.error;
                    }
                } catch (e) {
                    m.error = e;
                    console.error(`[ERRORE] Plugin ${m.plugin}:`, e);
                    let errText = format(e);
                    for (const key of Object.values(global.APIKeys ?? {}))
                        errText = errText.replace(new RegExp(key, 'g'), '#HIDDEN#');
                    if (typeof e === 'string' && e.includes('rate-overlimit')) await delay(2000);
                    await this.reply(m.chat, errText, m).catch(() => {});
                } finally {
                    if (typeof plugin.after === 'function') {
                        try {
                            await plugin.after.call(this, m, extra);
                        } catch {}
                    }
                    if (m['888coin'])
                        await this.reply(m.chat, `Hai utilizzato *${+m['888coin']}*`, m, null, global.rcanal).catch(() => {});
                }
                break;
            }
        } catch (e) {
            console.error(`[ERRORE] Handler ${m.chat}:`, e);
        } finally {

            if (user?.muto && !m.fromMe)
                await this.sendMessage(m.chat, {
                    delete: m.key
                }).catch(() => {});

            if (user) {
                user.exp = (user.exp || 0) + (m.exp || 0);
                user['888coin'] = (user['888coin'] || 0) - (m['888coin'] || 0);
                user.messaggi = (user.messaggi || 0) + 1;
                user.messages = (user.messages || 0) + 1;

                if (m.isCommand) {
                    user.comandiEseguiti = (user.comandiEseguiti || 0) + 1;
                    if (isAdmin) {
                        if (typeof global.logAdmin?.increment === 'function')
                            global.logAdmin.increment(m.chat, m.sender, 'commands', 1);
                        else {
                            (global.logAdminQueue ??= []).push({
                                chatId: m.chat,
                                adminJid: m.sender,
                                actionKey: 'commands',
                                amount: 1
                            });
                        }
                    }
                }

                if (m.isGroup) {
                    chat.users ??= {};
                    chat.users[normalizedSender] ??= {
                        messages: 0
                    };
                    chat.users[normalizedSender].messages++;
                    chat.topUsers[normalizedSender] = (chat.topUsers[normalizedSender] || 0) + 1;
                    chat.topRich[normalizedSender] = (Number(user.money) || 0) + (Number(user.bank) || 0);
                    chat.topBlasphemy[normalizedSender] = Number(user.blasphemy) || 0;
                }

                if (m.plugin) {
                    const stats = global.db.data.stats ??= {};
                    const stat = stats[m.plugin] ??= {
                        total: 0,
                        success: 0,
                        last: 0,
                        lastSuccess: 0
                    };
                    const now = Date.now();
                    stat.total++;
                    stat.last = now;
                    if (!m.error) {
                        stat.success++;
                        stat.lastSuccess = now;
                    }
                }
            }

            try {
                if (!global.opts['noprint'] && m)
                    await (await _getPrintModule())(m, this);
            } catch (e) {
                console.error('[ERRORE] Print:', e);
            }

            const sREAD = global.db.data?.settings?.[this.user?.jid] ?? {};
            if ((global.opts['autoread'] || sREAD.autoread2) && m)
                await this.readMessages([m.key]).catch(() => {});

            if (chat?.reaction && !m.fromMe && m?.text?.match(/(mente|zione|ta|ivo|osa|issimo|ma|pero|eppure|anche|no|se|ai|ciao|si)/gi)) {
                const emot = pickRandom(['🟢', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰']);
                await this.sendMessage(m.chat, {
                    react: {
                        text: emot,
                        key: m.key
                    }
                }).catch(() => {});
            }

            global.markDbDirty?.();
        }
    }
}

export async function participantsUpdate(update) {
    const { id, participants = [], action } = update ?? {};
    for (const [name, plugin] of Object.entries(global.plugins ?? {})) {
        if (typeof plugin?.groupParticipantsUpdate !== 'function') continue;
        try {
            await plugin.groupParticipantsUpdate.call(this, update);
        } catch (error) {
            console.error(`[ERRORE] plugin groupParticipantsUpdate (${name}):`, error);
        }
    }

    if (!id) return;
    if (global.db.data.chats[id]?.rileva === false) return;
    try {
        const meta = global.groupCache.get(id) ?? await fetchMetadata(this, id);
        if (!meta) return;
        global.groupCache.set(id, meta);
        for (const user of participants) {
            const nUser = this.decodeJid(user);
            if (!global.nameCache.get(nUser)) {
                const nome = (await this.getName(nUser)) ?? nUser.split('@')[0] ?? 'Sconosciuto';
                global.nameCache.set(nUser, nome);
            }
        }
    } catch {}
}

export async function groupsUpdate(groupsUpdate) {
    if (global.opts['self']) return;
    for (const update of groupsUpdate) {
        if (!update?.id) continue;
        global.groupCache.del(update.id);
        const chats = global.db.data.chats[update.id] ?? {};
        let text = '';
        if (update.icon) text = (chats.sIcon ?? this.sIcon ?? '`immagine modificata`').replace('@icon', update.icon);
        if (!text) continue;
        await this.sendMessage(update.id, {
            text,
            mentions: this.parseMention(text)
        }).catch(console.error);
    }
}

export async function deleteUpdate(message) {
    try {
        const { fromMe, id } = message;
        if (fromMe) return;
        const msg = this.serializeM(this.loadMessage(id));
        if (!msg) return;
    } catch (e) {
        console.error(e);
    }
}

global.dfail = async (type, m, conn) => {
    const msg = {
        elixir: '⛔ Non hai l’autorizzazione per usare questo comando.',
        rowner: '⛔ Questo comando è riservato al proprietario principale del bot.',
        owner: '⛔ Questo comando è riservato al proprietario del bot.',
        mods: '⛔ Questo comando è riservato ai moderatori.',
        premium: '💎 Questo comando è riservato agli utenti premium.',
        group: '👥 Questo comando può essere usato solo nei gruppi.',
        private: '🔒 Questo comando può essere usato solo in chat privata.',
        admin: '⚙️ Solo gli amministratori del gruppo possono usare questo comando.',
        botAdmin: '🤖 Il bot deve essere amministratore del gruppo per eseguire questo comando.',
        unreg: '📝 Non sei ancora registrato.\nUsa .registrati per creare il tuo profilo.',
        restrict: '🚫 Questa funzione è limitata in questo gruppo.',
        disabled: '🚫 Questa funzione è disabilitata.',
    }[type];
    if (msg) conn.reply(m.chat, msg, m, global.rcanal).catch(() => {});
};

export async function callUpdate(calls) {

    if (global.db?.data?.settings?.[global.conn?.user?.jid]?.anticall !== true) return;

    for (const call of (Array.isArray(calls) ? calls : [calls])) {
        if (!call) continue;
        const { from, status, id } = call;
        if (status !== 'offer') continue;

        const callerId = global.conn.decodeJid(from);
        if (isBotOwnerNumber(callerId)) continue;

        global.processedCalls.set(`callUpdate:${id}`, true);

        try {
            await global.conn.rejectCall(id, from);
        } catch (e) {
            console.error('[anticall] Errore rifiuto:', e.message);
        }
    }
}

const file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
    unwatchFile(file);
    console.log(chalk.bgHex('#3b0d95')(chalk.white.bold("File: 'handler.js' Aggiornato")));
    if (global.reloadHandler) console.log(await global.reloadHandler());
});
