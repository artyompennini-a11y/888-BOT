// Handler by elixir, punisher & 888 staff
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { smsg } from './lib/simple.js';
import { runBeforeAll, runGuarded } from './lib/bus.js';
import { pluginIndex, candidates } from './lib/plugin-index.js';
import './lib/state.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import fs from 'fs';
import chalk from 'chalk';
import NodeCache from 'node-cache';
import { getAggregateVotesInPollMessage } from '@888-BOT/888baileys';
import pkg from './package.json' with { type: 'json' };

let _print;
const printModule = async () => (_print ??= (await import('./lib/print.js')).default);

const PLUGINS_DIR = join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
const DUPLICATE_WINDOW = 3000;
const responseHandlers = new Map();

const delay = ms => new Promise(r => setTimeout(r, ms));
const quiet = async fn => { try { return await fn(); } catch {} };
const str2Regex = s => s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
const pickRandom = list => list[Math.floor(Math.random() * list.length)];
const digits = s => String(s ?? '').replace(/\D/g, '');
const normalizeNumber = n => digits(n) + '@s.whatsapp.net';
const respKey = (chat, sender) => `${digits(chat)}:${digits(sender)}`;
const isAdm = u => ['admin', 'superadmin', true].includes(u.admin);
const mention = jid => '@' + jid.split('@')[0];

const isBotOwnerNumber = (jid = '') => {
    const d = digits(jid);
    return !!d && (global.owner || []).some(e => digits(Array.isArray(e) ? e[0] : e) === d);
};

const mkCache = (ttl, check, max) => new NodeCache({ stdTTL: ttl, useClones: false, checkperiod: check, maxKeys: max });

global.ignoredUsersGlobal ??= new Set();
global.ignoredUsersGroup ??= {};
global.groupSpam ??= {};
global.processedMessages ??= new Set();
global.processedCalls ??= new Map();
global.spamTracker ??= {};
global.groupCloseTimers ??= {};
global.activeEvents ??= new Map();
global.activeGiveaways ??= new Map();
global.groupCache ??= mkCache(300, 60, 2000);
global.jidCache ??= mkCache(3600, 600, 5000);
global.nameCache ??= mkCache(3600, 600, 5000);

const USER_BACKFILL = {
    messaggi: 0, warn: 0, warnCount: 0, blasphemy: 0, comandiEseguiti: 0, banned: false, muto: false,
    premium: false, isAdmin: false, nomeinsta: '', gruppiincuieadmin: '', role: 'Novizio', level: 0
};
const newUser = name => ({
    ...USER_BACKFILL, exp: 0, '888coin': 10, registered: false, name: name ?? '?', age: -1, regTime: -1,
    bank: 0, firstTime: Date.now(), spam: 0, autolevelup: true, lastclaim: 0, afk: 0, afkReason: '',
    limit: 15000, premiumDate: -1, premiumTime: 0, money: 0, joincount: 2
});

const CHAT_FLAGS_ON = ['antiporno', 'antigore', 'antitrava', 'antibot', 'antiBot', 'antinuke', 'modoadmin', 'antiLink', 'logrichieste'];
const CHAT_FLAGS_OFF = ['isBanned', 'welcome', 'goodbye', 'ai', 'vocali', 'antioneview', 'autolevelup', 'antivoip', 'rileva', 'antiLink2', 'slowmode', 'reaction', 'provocazioni', 'antispam'];
const CHAT_OBSOLETE = ['antiraid', 'antiraidlink', 'antiraidlinkPunish', 'antiraidlinkSilent', 'antiraidWhitelist', 'antighost', 'antighostWindow', 'antighostIgnore', 'antighostLog', 'antipayment'];
const newChat = () => ({
    ...Object.fromEntries(CHAT_FLAGS_ON.map(k => [k, true])),
    ...Object.fromEntries(CHAT_FLAGS_OFF.map(k => [k, false])),
    tagCount: 0, tagLastReset: 0, expired: 0, users: {}, topUsers: {}, topRich: {}, topBlasphemy: {}
});

const newSettings = () => ({
    autoread: false, jadibotmd: false, antiprivato: true, soloCreatore: false, status: 0, anticall: false, anticallBlock: false
});

export async function loadAllPlugins(pluginsDir = PLUGINS_DIR) {
    const results = {};
    const scan = async (dir, prefix = '') => {
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
        await Promise.allSettled(entries.map(async e => {
            const full = path.join(dir, e.name);
            const rel = prefix ? `${prefix}/${e.name}` : e.name;
            if (e.isDirectory()) return scan(full, rel);
            if (!e.isFile() || !/\.(js|mjs|cjs)$/.test(e.name) || e.name.startsWith('_')) return;
            try {
                const mod = await import(`${full}?t=${Date.now()}`);
                results[rel] = mod.default ?? mod;
            } catch (err) {
                console.error(chalk.red(`[plugins] Errore caricamento ${rel}:`), err.message);
            }
        }));
    };
    await scan(pluginsDir);
    return results;
}

export const fetchMetadata = async (conn, chatId) => conn.groupMetadata(chatId);
const safeMeta = (conn, id) => quiet(() => conn.groupMetadata(id)).then(m => m ?? null);
const getMeta = async (conn, id) => {
    let meta = global.groupCache.get(id);
    if (!meta) {
        meta = await safeMeta(conn, id);
        if (meta) global.groupCache.set(id, meta);
    }
    return meta;
};

global.getGroupAdmins = async (conn, groupId) => {
    try {
        const meta = await getMeta(conn, groupId);
        return meta ? meta.participants.filter(isAdm).map(p => conn.decodeJid(p.id)) : [];
    } catch { return []; }
};
global.isGroupAdmin = async (conn, groupId, userId) =>
    (await global.getGroupAdmins(conn, groupId)).includes(conn.decodeJid(userId));

function initResponseHandler(conn) {
    if (conn.waitForResponse) return;
    conn.waitForResponse = (chat, sender, { timeout = 30_000, validResponses = null, onTimeout = null, filter = null } = {}) =>
        new Promise(resolve => {
            const key = respKey(chat, sender);
            const timeoutId = setTimeout(() => { responseHandlers.delete(key); onTimeout?.(); resolve(null); }, timeout);
            responseHandlers.set(key, { resolve, timeoutId, validResponses, filter });
        });
}

export function ensureGroupCacheListeners(conn) {
    if (!conn?.ev) return false;
    try {
        if (!conn.__ghostAdminListeners) {
            const drop = id => { try { if (id) global.groupCache?.del?.(id); } catch {} };
            conn.ev.on('group-participants.update', u => drop(u?.id));
            conn.ev.on('groups.update', us => [].concat(us).forEach(u => drop(u?.id)));
            conn.__ghostAdminListeners = true;
        }
    } catch { return false; }
    return true;
}

if (global.conn) {
    const conn = global.conn;
    ensureGroupCacheListeners(conn);

    if (!global.cacheListenersSet) {
        const registerGroup = async id => {
            try {
                global.db.data.chats[id] ??= { isBanned: false, expired: 0, users: {} };
                const meta = await safeMeta(conn, id);
                if (meta) global.groupCache.set(id, meta);
            } catch {}
        };
        setTimeout(async () => {
            try {
                const groups = await conn.groupFetchAllParticipating();
                await Promise.allSettled(Object.keys(groups).map(registerGroup));
            } catch {}
        }, 5000);
        conn.ev.on('groups.update', async updates => {
            for (const u of updates) if (u?.id) await registerGroup(u.id);
        });
        conn.ev.on('group-participants.update', async u => { if (u?.id) await registerGroup(u.id); });
        global.cacheListenersSet = true;
    }

    if (!global.pollListenerSet) {
        conn.ev.on('messages.update', async chatUpdate => {
            for (const { key, update } of chatUpdate) {
                if (!update.pollUpdates) continue;
                await quiet(async () => {
                    const message = await global.store.getMessage(key);
                    if (message) await getAggregateVotesInPollMessage({ message, pollUpdates: update.pollUpdates });
                });
            }
        });
        global.pollListenerSet = true;
    }
}

if (global.conn?.ws) {
    global.conn.ws.on('CB:call', async json => {
        try {
            const conn = global.conn;
            if (json?.tag !== 'call' || !json.attrs?.from) return;
            const callerId = conn.decodeJid(json.attrs.from);
            if (isBotOwnerNumber(callerId)) return;

            const content = json.content ?? [];
            const uniqueId = content.find(i => i?.attrs?.['call-id'])?.attrs['call-id'] ?? json.attrs.id;
            const tags = content.map(i => i.tag);
            if (tags.includes('terminate')) { global.processedCalls.delete(uniqueId); return; }

            if (!global.db?.data) return;
            const settings = ((global.db.data.settings ??= {})[conn.user.jid] ??= newSettings());
            if (settings.anticall !== true) return;
            if (!tags.includes('offer') && !tags.includes('relaylatency')) return;
            if (global.processedCalls.has(uniqueId)) return;
            global.processedCalls.set(uniqueId, true);

            try {
                await conn.rejectCall(uniqueId, callerId);
            } catch (e) {
                console.error('[anticall] rejectCall failed:', e?.message || e);
                global.processedCalls.delete(uniqueId);
                return;
            }

            await quiet(() => conn.sendMessage(callerId, {
                text: `📵 *Chiamata rifiutata*\n━━━━━━━━━━━━━━━\n⛔ Le chiamate vocali e video sono disabilitate su questo bot.\n━━━━━━━━━━━━━━━\n_${pkg.name}_`
            }));

            if (settings.anticallBlock === true) {
                await quiet(async () => {
                    const u = (global.db.data.users[callerId] ||= {});
                    u.banned = true;
                    u.bannedReason = 'Chiamata bloccata - anticall attivo';
                    global.markDbDirty?.();
                });
                try { await conn.blockUser?.(callerId); } catch (e) { console.error('[anticall] blockUser failed:', e?.message || e); }
            }
            console.log(`[anticall] chiamata rifiutata da ${callerId} (id ${uniqueId})`);
        } catch (e) {
            console.error('[anticall] errore handler:', e?.message || e);
        }
    });
}

setInterval(() => { if (global.processedCalls.size > 10) global.processedCalls.clear(); }, 180_000);

function calcAdminFlags(conn, participants, meta, sender, bot) {
    const dec = typeof conn?.decodeJid === 'function' ? conn.decodeJid.bind(conn) : j => j;
    const rawOwner = meta.owner || meta.ownerLid || null;
    const nOwner = rawOwner ? normalizeNumber(dec(rawOwner)) : null;
    const check = who => who === nOwner || participants.some(u =>
        isAdm(u) && [u.id, u.jid, u.lid].filter(Boolean).some(id => {
            const d = dec(id);
            return d === who || normalizeNumber(d) === who;
        }));
    return { isAdmin: check(sender), isBotAdmin: check(bot), isRAdmin: sender === nOwner };
}

const normParts = (conn, parts, withLid = false) => parts.map(u => {
    const id = conn.decodeJid((withLid ? u.id || u.jid || u.lid : u.id ?? u.jid) ?? '');
    return withLid ? { ...u, id, jid: u.jid ?? id, lid: u.lid ?? id } : { ...u, id, jid: u.jid ?? id };
});

const canUseModoadmin = (chat, isGroup, ...privileged) => !isGroup || !chat.modoadmin || privileged.some(Boolean);

async function recoverUndecrypted(conn, m) {
    try {
        const who = m.key.participant ?? m.key.remoteJid;
        const tries = (global._decryptRetried ??= new Map());
        const n = tries.get(who) ?? 0;
        if (n >= 3) { tries.delete(who); return null; }
        tries.set(who, n + 1);
        setTimeout(() => tries.delete(who), 120_000);
        await quiet(() => conn.authState?.keys?.remove?.('session', [who]));
        await quiet(() => conn.requestPrivacyTokens?.([who]));
        await delay(1500);
        const retried = await conn.loadMessage(m.key.id);
        return retried?.message ? retried : null;
    } catch { return null; }
}

function interactiveId(r) {
    if (r.selectedId) return r.selectedId;
    const p = r.nativeFlowResponseMessage?.paramsJson ?? r.paramsJson ?? '';
    if (!p) return '';
    try { return JSON.parse(p)?.id ?? ''; } catch { return p; }
}
const buttonIdOf = ({ buttonsResponseMessage: b, templateButtonReplyMessage: t, interactiveResponseMessage: i, listResponseMessage: l } = {}) =>
    b?.selectedButtonId ?? b?.id ?? t?.selectedId ?? t?.id ?? (i && interactiveId(i)) ??
    l?.singleSelectReply?.selectedRowId ?? l?.selectedRowId ?? l?.id;

async function closeGroup(conn, chatId, seconds) {
    clearTimeout(global.groupCloseTimers[chatId]);
    await conn.groupSettingUpdate(chatId, 'announcement').catch(() => {});
    await conn.sendMessage(chatId, { text: `🔒 𝐆𝐑𝐔𝐏𝐏𝐎 𝐂𝐇𝐈𝐔𝐒𝐎 𝐏𝐄𝐑 ${seconds} 𝐒𝐄𝐂𝐎𝐍𝐃𝐈 𝐏𝐄𝐑 𝐒𝐈𝐂𝐔𝐑𝐄𝐙𝐙𝐀 🔒` });
    global.groupCloseTimers[chatId] = setTimeout(async () => {
        await conn.groupSettingUpdate(chatId, 'not_announcement').catch(() => {});
        await conn.sendMessage(chatId, { text: `✅ 𝐆𝐑𝐔𝐏𝐏𝐎 𝐑𝐈𝐀𝐏𝐄𝐑𝐓𝐎 𝐂𝐎𝐍 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐎 ✅` });
        delete global.groupCloseTimers[chatId];
    }, seconds * 1000);
}

async function groupAntiSpam(conn, m, sender) {
    const chatId = m.chat;
    const data = ((global.spamTracker[chatId] ??= {})[sender] ??= { messages: 0, stickers: 0, warns: 0, timeout: null, keys: [], stickerKeys: [] });
    const reset = () => Object.assign(data, { messages: 0, stickers: 0, keys: [], stickerKeys: [] });

    if (['conversation', 'extendedTextMessage'].includes(m.mtype)) { data.messages++; data.keys.push(m.key); }
    if (m.mtype === 'stickerMessage') { data.stickers++; data.keys.push(m.key); data.stickerKeys.push(m.key); }
    clearTimeout(data.timeout);
    data.timeout = setTimeout(() => { reset(); data.timeout = null; }, 8000);

    if (data.messages < 15 && data.stickers < 5) return false;

    const del = keys => Promise.allSettled(keys.map(key => conn.sendMessage(chatId, { delete: key }).catch(() => {})));
    try {
        if (data.warns === 0) {
            data.warns = 1;
            await del(data.stickerKeys);
            await closeGroup(conn, chatId, 30);
            await conn.sendMessage(chatId, {
                text: `⚠️ ${mention(sender)}, primo avvertimento per spam. Gruppo chiuso per 30 secondi per sicurezza. Alla prossima verrai espulso.`,
                mentions: [sender]
            });
            reset();
            return true;
        }
        await del(data.keys);
        await conn.sendMessage(chatId, { text: `🚫 *Utente espulso per spam*\n\n${mention(sender)}`, mentions: [sender] });
        await conn.groupParticipantsUpdate(chatId, [sender], 'remove');
        await closeGroup(conn, chatId, 60);
        delete global.spamTracker[chatId][sender];
        return true;
    } catch {}
    return false;
}

async function commandFlood(conn, m, exempt) {
    const g = (global.groupSpam[m.chat] ??= { count: 0, firstCommandTimestamp: 0, isSuspended: false, suspendedAt: 0 });
    const now = Date.now();
    const notify = text => {
        const mentions = (global.owner ?? []).map(([num]) => normalizeNumber(num));
        return conn.sendMessage(m.chat, {
            text: mentions.length ? `${text}\n\n${mentions.map(mention).join(', ')}` : text,
            mentions
        }).catch(() => {});
    };

    if (g.isSuspended) {
        if (now - g.suspendedAt < 20_000) {
            if (!exempt) return true;
        } else {
            Object.assign(g, { isSuspended: false, count: 0, firstCommandTimestamp: 0 });
            await notify('✅ *Antispam comandi terminato!* Il bot è di nuovo attivo.');
        }
    }
    if (!g.isSuspended && !exempt) {
        if (now - g.firstCommandTimestamp > 10_000) { g.count = 1; g.firstCommandTimestamp = now; }
        else g.count++;
        if (g.count > 5) {
            Object.assign(g, { isSuspended: true, suspendedAt: now });
            await notify('🚫 *Antispam comandi attivo!* Per 20 secondi il bot non risponderà.');
            return true;
        }
    }
    return false;
}

function matchPrefix(text, pfx) {
    for (const p of [].concat(pfx)) {
        const re = p instanceof RegExp ? p : typeof p === 'string' ? new RegExp(str2Regex(p)) : null;
        const res = re?.exec(text);
        if (res) return [res, p];
    }
}

export async function handler(chatUpdate) {
    this.msgqueque ??= [];
    this.uptime ??= Date.now();
    if (!chatUpdate?.messages?.length) return;

    this.pushMessage(chatUpdate.messages).catch(err => {
        if (!err.message?.includes('Bad MAC') && !err.message?.includes('absent'))
            console.error('[ERRORE] pushMessage:', err);
    });

    for (let m of chatUpdate.messages) {
        if (!m?.key?.remoteJid) continue;

        if (!m.message && m.messageStubType == null) {
            m = await recoverUndecrypted(this, m);
            if (!m) continue;
        }

        const edit = m.message?.protocolMessage;
        if (edit?.type === 'MESSAGE_EDIT') {
            const { key, editedMessage } = edit;
            Object.assign(m, {
                key, message: editedMessage, mtype: Object.keys(editedMessage)[0],
                text: editedMessage.conversation ?? editedMessage.extendedTextMessage?.text ?? ''
            });
        }

        m = smsg(this, m, global.store);
        if (!m?.key?.remoteJid) continue;
        if (m.messageStubType === 29 || m.messageStubType === 30) global.groupCache.del(m.chat);

        try {
            m.key.remoteJid = this.decodeJid(m.key.remoteJid);
            if (m.key.participant) {
                let p = this.decodeJid(m.key.participant);
                if (!p.endsWith('@s.whatsapp.net')) p = p.split('@')[0].split(':')[0] + '@s.whatsapp.net';
                m.key.participant = p;
            }
        } catch { continue; }

        m.chat ??= m.key.remoteJid;
        if (!m.chat || typeof m.chat !== 'string') continue;
        m.sender = normalizeNumber(this.decodeJid(m.key.participant ?? m.key.remoteJid));

        const msgId = m.key.id;
        if (msgId) {
            if (global.processedMessages.has(msgId)) continue;
            global.processedMessages.add(msgId);
            setTimeout(() => global.processedMessages.delete(msgId), DUPLICATE_WINDOW);
        }

        initResponseHandler(this);

        const btnId = buttonIdOf(m.message);
        if (typeof btnId === 'string' && btnId) {
            const sender = normalizeNumber(this.decodeJid(m.key.participant ?? m.sender));
            const chat = m.key.remoteJid;
            const rk = respKey(chat, sender);
            const rh = responseHandlers.get(rk);
            if (rh) {
                clearTimeout(rh.timeoutId);
                responseHandlers.delete(rk);
                rh.resolve({ text: btnId, sender, chat });
            } else {
                const participant = m.key.participant ?? m.sender;
                handler.call(this, {
                    messages: [{
                        key: { remoteJid: chat, fromMe: false, id: `btn_${Date.now()}_${Math.random().toString(36).slice(2)}`, participant },
                        message: { conversation: btnId },
                        text: btnId,
                        messageTimestamp: m.messageTimestamp ?? Date.now(),
                        pushName: m.pushName ?? '',
                        broadcast: false,
                        participant
                    }]
                });
            }
            continue;
        }

        if (m.message?.eventResponseMessage) {
            try {
                const { eventId, response } = m.message.eventResponseMessage;
                const data = global.activeEvents.get(eventId) ?? global.activeGiveaways.get(this.decodeJid(m.key.remoteJid));
                if (data) {
                    const userId = this.decodeJid(m.key.participant ?? m.key.remoteJid);
                    (data.participants ??= new Set())[response === 'going' ? 'add' : 'delete'](userId);
                }
            } catch {}
        }

        if (!global.db.data) await global.loadDatabase();

        m.exp = 0;
        m['888coin'] = false;
        m.isCommand = false;

        const normalizedSender = this.decodeJid(m.sender);
        const normalizedBot = this.decodeJid(this.user.jid);
        if (!/@(s\.whatsapp\.net|lid)$/.test(normalizedSender ?? '')) continue;

        try {
            Object.defineProperty(m, 'sender', { value: normalizedSender, writable: true, configurable: true });
        } catch { m.normalizedSender = normalizedSender; }

        const user = (global.db.data.users[normalizedSender] ??= newUser(m.pushName));
        for (const [k, v] of Object.entries(USER_BACKFILL)) user[k] ??= v;
        if (user['888coin'] == null && typeof user.euro === 'number') user['888coin'] = user.euro;
        delete user.euro;

        if (user.banned) {
            if (!user.notifiedBan) {
                await this.sendMessage(m.chat, { text: '❌ Un owner ti ha bloccato i comandi!' }, { quoted: m });
                user.notifiedBan = true;
            }
            continue;
        }

        const chat = (global.db.data.chats[m.chat] ??= newChat());
        for (const k of CHAT_FLAGS_ON) chat[k] ??= true;
        for (const k of CHAT_OBSOLETE) delete chat[k];
        chat.topUsers ??= {};
        chat.topRich ??= {};
        chat.topBlasphemy ??= {};
        const settings = ((global.db.data.settings ??= {})[this.user.jid] ??= newSettings());

        if (m.mtype === 'pollUpdateMessage' || m.mtype === 'reactionMessage') continue;

        const rk = respKey(m.chat, normalizedSender);
        const rh = responseHandlers.get(rk);
        if (rh) {
            let ok = true;
            if (typeof rh.filter === 'function') ok = rh.filter(m);
            if (rh.validResponses?.length) {
                const txt = (m.text ?? '').toLowerCase().trim();
                ok = rh.validResponses.some(v => txt === v.toLowerCase() || txt.includes(v.toLowerCase()));
            }
            if (ok) {
                clearTimeout(rh.timeoutId);
                responseHandlers.delete(rk);
                rh.resolve(m);
                continue;
            }
        }

        const isElixir = isBotOwnerNumber(normalizedSender);
        const isROwner = isElixir;
        const isOwner = isElixir;
        const isMods = isOwner ||
            global.mods?.map(normalizeNumber).includes(normalizedSender) ||
            global.db.data.chats?.[m.chat]?.moderatori?.includes(normalizedSender) || false;
        const isPrems = isROwner || global.prems?.map(normalizeNumber).includes(normalizedSender) || false;

        if (!m.isGroup && settings.antiprivato && !isOwner) continue;

        let isBotAdmin = false, isAdmin = false, isRAdmin = false;
        let groupMetadata = null, participants = [], normalizedParticipants = [];

        if (m.isGroup) {
            groupMetadata = await getMeta(this, m.chat);
            if (groupMetadata?.participants) {
                participants = groupMetadata.participants;
                normalizedParticipants = normParts(this, participants);
                ({ isAdmin, isBotAdmin, isRAdmin } = calcAdminFlags(this, participants, groupMetadata, normalizedSender, normalizedBot));
            }
        }

        if (m.isGroup && chat.antimedia && !isAdmin && !isOwner && ['imageMessage', 'videoMessage'].includes(m.mtype)) {
            await quiet(async () => {
                await this.sendMessage(m.chat, { delete: m.key });
                await this.sendMessage(m.chat, {
                    text: `${mention(normalizedSender)}, solo foto/video ad una visualizzazione! ⚠️`,
                    mentions: [normalizedSender]
                });
            });
            continue;
        }
        if (m.isGroup && chat.antispam && !isAdmin && !isOwner && await groupAntiSpam(this, m, normalizedSender)) continue;

        if (chat.isBanned && !isOwner) continue;

        const pluginMap = pluginIndex(global.plugins, global.prefix ?? '.');
        await Promise.allSettled(
            Object.entries(global.plugins)
                .filter(([, p]) => p && !p.disabled && typeof p.all === 'function')
                .map(async ([name, p]) => {
                    try {
                        await p.all.call(this, m, { chatUpdate, __dirname: PLUGINS_DIR, __filename: join(PLUGINS_DIR, name) });
                    } catch (e) { console.error(`[ERRORE] plugin.all (${name}):`, e); }
                })
        );

        try {
            const pluginEntries = candidates(m.text, { index: pluginMap }).map(([name, plugin]) => ({
                name, plugin,
                __filename: join(PLUGINS_DIR, name),
                match: matchPrefix(m.text, plugin.customPrefix ?? global.prefix ?? '.')
            }));

            const baseCtx = () => ({
                conn: this, participants: normalizedParticipants, groupMetadata,
                user: { admin: isAdmin ? 'admin' : null }, bot: { admin: isBotAdmin ? 'admin' : null },
                isElixir, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, isMods,
                chatUpdate, __dirname: PLUGINS_DIR
            });

            const beforeHooks = pluginEntries
                .filter(e => typeof e.plugin.before === 'function')
                .map(e => [e.name, () => e.plugin.before.call(this, m, { match: e.match, ...baseCtx(), __filename: e.__filename })]);
            const skip = new Set();
            if (beforeHooks.length) {
                const { results } = await runBeforeAll(beforeHooks, { timeout: global.busTimeout ?? 500 });
                results.forEach((r, i) => { if (r.status === 'ok' && r.value) skip.add(beforeHooks[i][0]); });
            }

            for (const { name, plugin, __filename, match } of pluginEntries) {
                if (skip.has(name) || typeof plugin !== 'function') continue;
                const usedPrefix = match?.[0]?.[0];
                if (!usedPrefix) continue;

                const noPrefix = m.text.replace(usedPrefix, '');
                const [rawCmd, ...args] = noPrefix.trim().split(' ').filter(Boolean);
                const command = rawCmd?.toLowerCase() ?? '';
                const _args = noPrefix.trim().split(' ').slice(1);
                const text = _args.join(' ');
                const fail = plugin.fail ?? global.dfail;

                const accepts = c => c instanceof RegExp ? c.test(command) : c === command;
                if (![].concat(plugin.command ?? []).some(accepts)) continue;

                if (m.isGroup && (plugin.admin || plugin.botAdmin)) {
                    const fresh = global.groupCache.get(m.chat) ?? await safeMeta(this, m.chat);
                    if (fresh) {
                        global.groupCache.set(m.chat, fresh);
                        groupMetadata = fresh;
                        participants = fresh.participants;
                        normalizedParticipants = normParts(this, participants, true);
                        const bot = this.decodeJid(this.user.jid ?? this.user.id ?? '');
                        const direct = normalizedParticipants.some(u => isAdm(u) && [u.id, u.jid, u.lid].includes(bot));
                        const flags = calcAdminFlags(this, participants, fresh, normalizedSender, bot);
                        ({ isAdmin, isRAdmin } = flags);
                        isBotAdmin = direct || flags.isBotAdmin;
                    }
                }

                if (plugin.disabled && !isOwner) { fail('disabled', m, this); continue; }
                if (user.muto && !isROwner && !isOwner) {
                    await this.sendMessage(m.chat, { text: `Sei stato mutato, non puoi usare i comandi.` }, { quoted: m }).catch(() => {});
                    break;
                }
                const ignored = global.ignoredUsersGlobal.has(normalizedSender) || (m.isGroup && global.ignoredUsersGroup[m.chat]?.has(normalizedSender));
                if (ignored && !isROwner) {
                    await this.sendMessage(m.chat, { text: `Non sei autorizzato a usare comandi.` }, { quoted: m }).catch(() => {});
                    break;
                }

                m.plugin = name;
                if (chat.isBanned && !isROwner && !['gp-sbanchat.js', 'creatore-exec.js', 'gp-delete.js'].includes(name)) break;
                if (user.banned && !isROwner && name !== 'creatore-banuser.js') {
                    if (user.antispam > 2) break;
                    await this.sendMessage(m.chat, {
                        text: `Sei stato bannato/a dall'utilizzo del bot.\n\n${user.bannedReason ? `Motivo: ${user.bannedReason}` : 'Motivo: Non specificato ma meritato'}\n\nContatta il creatore [...]`
                    }, { quoted: m }).catch(() => {});
                    user.antispam = (user.antispam ?? 0) + 1;
                    break;
                }

                if (m.isGroup && await commandFlood(this, m, isElixir)) break;
                if (!canUseModoadmin(chat, m.isGroup, isAdmin, isOwner, isROwner, isMods)) break;

                const privileged = isAdmin || isOwner || isROwner;
                if (m.isGroup && !privileged && ((chat.antiporno && plugin.tags?.includes('nsfw')) || (chat.antiLink && plugin.tags?.includes('link')))) {
                    fail('restrict', m, this);
                    continue;
                }
                if (settings.soloCreatore && !isROwner) break;

                const perms = global.db.data.pluginPerms?.[normalizedSender] ?? [];
                const baseName = name.replace(/^.*[\\/]/, '').replace(/\.(js|mjs|cjs)$/, '').toLowerCase();
                const cmd = plugin.command;
                const hasPerm = perms.includes(baseName) ||
                    (cmd instanceof RegExp && perms.some(p => cmd.test(p))) ||
                    (typeof cmd === 'string' && perms.includes(cmd.toLowerCase()));

                const denied = [
                    [plugin.elixir && !isElixir, 'elixir'],
                    [plugin.rowner && !isROwner && !hasPerm, 'rowner'],
                    [plugin.owner && !isOwner && !isROwner && !hasPerm, 'owner'],
                    [plugin.mods && !isMods && !isAdmin && !isOwner && !isROwner, 'mods'],
                    [plugin.premium && !isPrems, 'premium'],
                    [plugin.group && !m.isGroup, 'group'],
                    [plugin.botAdmin && !isBotAdmin, 'botAdmin'],
                    [plugin.admin && !isAdmin && !isOwner, 'admin'],
                    [plugin.private && m.isGroup, 'private'],
                    [plugin.register && !user.registered, 'unreg']
                ].find(([cond]) => cond);
                if (denied) { fail(denied[1], m, this); continue; }

                m.isCommand = true;
                const xp = 'exp' in plugin ? parseInt(plugin.exp) : 17;
                m.exp += xp <= 200 ? xp : 0;

                if (!isPrems && plugin['888coin'] && user['888coin'] < plugin['888coin']) {
                    await this.reply(m.chat, `Niente più soldini, stupido poraccio`, m, null, global.rcanal).catch(() => {});
                    continue;
                }

                const extra = {
                    match, usedPrefix, noPrefix, _args, args, command, text,
                    ...baseCtx(), __filename, mentionedJid: m.mentionedJid ?? []
                };

                try {
                    const out = await runGuarded(m.plugin || __filename || 'plugin', () => plugin.call(this, m, extra), {
                        timeout: global.busCommandTimeout ?? 30000
                    });
                    if (out.status === 'ok') {
                        if (!isPrems) m['888coin'] = plugin['888coin'] || false;
                    } else if (out.status === 'timeout') {
                        m.error = out.error;
                        await this.reply(m.chat, '⚠️ Il comando sta impiegando troppo, ho interrotto l\'operazione.', m).catch(() => {});
                    } else throw out.error;
                } catch (e) {
                    m.error = e;
                    console.error(`[ERRORE] Plugin ${m.plugin}:`, e);
                    let errText = format(e);
                    for (const key of Object.values(global.APIKeys ?? {}))
                        if (key) errText = errText.replaceAll(String(key), '#HIDDEN#');
                    if (typeof e === 'string' && e.includes('rate-overlimit')) await delay(2000);
                    await this.reply(m.chat, errText, m).catch(() => {});
                } finally {
                    if (typeof plugin.after === 'function') await quiet(() => plugin.after.call(this, m, extra));
                    if (m['888coin']) await this.reply(m.chat, `Hai utilizzato *${+m['888coin']}*`, m, null, global.rcanal).catch(() => {});
                }
                break;
            }
        } catch (e) {
            console.error(`[ERRORE] Handler ${m.chat}:`, e);
        } finally {
            if (user.muto && !m.fromMe) await this.sendMessage(m.chat, { delete: m.key }).catch(() => {});

            user.exp = (user.exp || 0) + (m.exp || 0);
            user['888coin'] = (user['888coin'] || 0) - (m['888coin'] || 0);
            user.messaggi = (user.messaggi || 0) + 1;
            user.messages = (user.messages || 0) + 1;

            if (m.isCommand) {
                user.comandiEseguiti = (user.comandiEseguiti || 0) + 1;
                if (isAdmin) {
                    if (typeof global.logAdmin?.increment === 'function') global.logAdmin.increment(m.chat, m.sender, 'commands', 1);
                    else (global.logAdminQueue ??= []).push({ chatId: m.chat, adminJid: m.sender, actionKey: 'commands', amount: 1 });
                }
            }

            if (m.isGroup) {
                chat.users ??= {};
                (chat.users[normalizedSender] ??= { messages: 0 }).messages++;
                chat.topUsers[normalizedSender] = (chat.topUsers[normalizedSender] || 0) + 1;
                chat.topRich[normalizedSender] = (Number(user.money) || 0) + (Number(user.bank) || 0);
                chat.topBlasphemy[normalizedSender] = Number(user.blasphemy) || 0;
            }

            if (m.plugin) {
                const stat = ((global.db.data.stats ??= {})[m.plugin] ??= { total: 0, success: 0, last: 0, lastSuccess: 0 });
                const now = Date.now();
                stat.total++;
                stat.last = now;
                if (!m.error) { stat.success++; stat.lastSuccess = now; }
            }

            try {
                if (!global.opts['noprint']) await (await printModule())(m, this);
            } catch (e) { console.error('[ERRORE] Print:', e); }

            if (global.opts['autoread'] || global.db.data?.settings?.[this.user?.jid]?.autoread2)
                await this.readMessages([m.key]).catch(() => {});

            if (chat.reaction && !m.fromMe && m.text?.match(/(mente|zione|ta|ivo|osa|issimo|ma|pero|eppure|anche|no|se|ai|ciao|si)/gi)) {
                const emot = pickRandom(['🟢', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰']);
                await this.sendMessage(m.chat, { react: { text: emot, key: m.key } }).catch(() => {});
            }

            global.markDbDirty?.();
        }
    }
}

export async function participantsUpdate({ id, participants }) {
    if (global.db.data.chats[id]?.rileva === false) return;
    try {
        if (!await getMeta(this, id)) return;
        for (const user of participants) {
            const jid = this.decodeJid(user);
            if (!global.nameCache.get(jid))
                global.nameCache.set(jid, (await this.getName(jid)) ?? jid.split('@')[0] ?? 'Sconosciuto');
        }
    } catch {}
}

export async function groupsUpdate(updates) {
    if (global.opts['self']) return;
    for (const update of updates) {
        if (!update?.id) continue;
        global.groupCache.del(update.id);
        const chats = global.db.data.chats[update.id] ?? {};
        const text = update.icon ? (chats.sIcon ?? this.sIcon ?? '`immagine modificata`').replace('@icon', update.icon) : '';
        if (!text) continue;
        await this.sendMessage(update.id, { text, mentions: this.parseMention(text) }).catch(console.error);
    }
}

export async function deleteUpdate(message) {
    try { if (!message.fromMe) this.serializeM(this.loadMessage(message.id)); } catch (e) { console.error(e); }
}

const NO_AURA = '𝑵𝒐𝒏 𝒉𝒂𝒊 𝒂𝒃𝒃𝒂𝒔𝒕𝒂𝒏𝒛𝒂 𝒂𝒖𝒓𝒂 𝒑𝒆𝒓 𝒖𝒔𝒂𝒓𝒆 𝒒𝒖𝒆𝒔𝒕𝒐 𝒄𝒐𝒎𝒂𝒏𝒅𝒐.';
global.dfail = async (type, m, conn) => {
    const msg = {
        elixir: NO_AURA,
        rowner: NO_AURA,
        owner: NO_AURA,
        mods: '𝑸𝒖𝒆𝒔𝒕𝒐 𝒄𝒐𝒎𝒂𝒏𝒅𝒐 𝒆̀ 𝒅𝒊𝒔𝒑𝒐𝒏𝒊𝒃𝒊𝒍𝒆 𝒔𝒐𝒍𝒐 𝒑𝒆𝒓 𝒊 𝑴𝒐𝒅𝒆𝒓𝒂𝒕𝒐𝒓𝒊',
        premium: '𝑸𝒖𝒆𝒔𝒕𝒐 𝒄𝒐𝒎𝒂𝒏𝒅𝒐 𝒆̀ 𝒓𝒊𝒔𝒆𝒓𝒗𝒂𝒕𝒐 𝒂𝒊 𝑷𝒓𝒆𝒎𝒊𝒖𝒎 💎',
        group: '𝑸𝒖𝒆𝒔𝒕𝒐 𝒄𝒐𝒎𝒂𝒏𝒅𝒐 𝒑𝒖𝒐̀ 𝒆𝒔𝒔𝒆𝒓𝒆 𝒖𝒔𝒂𝒕𝒐 𝒔𝒐𝒍𝒐 𝒏𝒆𝒊 𝑮𝒓𝒖𝒑𝒑𝒊 👥',
        private: '𝑸𝒖𝒆𝒔𝒕𝒂 𝒇𝒖𝒏𝒛𝒊𝒐𝒏𝒆 𝒆̀ 𝒅𝒊𝒔𝒑𝒐𝒏𝒊𝒃𝒊𝒍𝒆 𝒔𝒐𝒍𝒐 𝒊𝒏 𝑷𝒓𝒊𝒗𝒂𝒕𝒐 🔒',
        admin: '𝑸𝒖𝒆𝒔𝒕𝒐 𝒄𝒐𝒎𝒂𝒏𝒅𝒐 𝒆̀ 𝒅𝒊𝒔𝒑𝒐𝒏𝒊𝒃𝒊𝒍𝒆 𝒔𝒐𝒍𝒐 𝒑𝒆𝒓 𝒈𝒍𝒊 𝑨𝒅𝒎𝒊𝒏 ⚙️',
        botAdmin: '𝑫𝒆𝒗𝒐 𝒆𝒔𝒔𝒆𝒓𝒆 𝑨𝒅𝒎𝒊𝒏 𝒑𝒆𝒓 𝒆𝒔𝒆𝒈𝒖𝒊𝒓𝒆 𝒒𝒖𝒆𝒔𝒕𝒐 𝒄𝒐𝒎𝒂𝒏𝒅𝒐 🤖',
        unreg: '𝑵𝒐𝒏 𝒔𝒆𝒊 𝒓𝒆𝒈𝒊𝒔𝒕𝒓𝒂𝒕𝒐/𝒂 📝\n𝑹𝒆𝒈𝒊𝒔𝒕𝒓𝒂𝒕𝒊 𝒑𝒆𝒓 𝒖𝒔𝒂𝒓𝒆 𝒒𝒖𝒆𝒔𝒕𝒂 𝒇𝒖𝒏𝒛𝒊𝒐𝒏𝒆',
        restrict: '𝑸𝒖𝒆𝒔𝒕𝒂 𝒇𝒖𝒏𝒛𝒊𝒐𝒏𝒆 𝒆̀ 𝒂𝒕𝒕𝒖𝒂𝒍𝒎𝒆𝒏𝒕𝒆 𝒅𝒊𝒔𝒂𝒕𝒕𝒊𝒗𝒂𝒕𝒂 🚫',
        disabled: '𝑸𝒖𝒆𝒔𝒕𝒐 𝒄𝒐𝒎𝒂𝒏𝒅𝒐 𝒆̀ 𝒂𝒕𝒕𝒖𝒂𝒍𝒎𝒆𝒏𝒕𝒆 𝒅𝒊𝒔𝒂𝒃𝒊𝒍𝒊𝒕𝒂𝒕𝒐 🚫'
    }[type];
    if (msg) conn.reply(m.chat, msg, m, global.rcanal).catch(() => {});
};

export async function callUpdate(calls) {
    if (global.db?.data?.settings?.[global.conn?.user?.jid]?.anticall !== true) return;
    for (const call of [].concat(calls)) {
        if (!call || call.status !== 'offer') continue;
        if (isBotOwnerNumber(global.conn.decodeJid(call.from))) continue;
        global.processedCalls.set(`callUpdate:${call.id}`, true);
        try { await global.conn.rejectCall(call.id, call.from); }
        catch (e) { console.error('[anticall] Errore rifiuto:', e.message); }
    }
}

const file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
    unwatchFile(file);
    console.log(chalk.bgHex('#3b0d95')(chalk.white.bold("File: 'handler.js' Aggiornato")));
    if (global.reloadHandler) console.log(await global.reloadHandler());
});
