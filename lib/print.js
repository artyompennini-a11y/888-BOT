import PhoneNumber from 'awesome-phonenumber'
import chalk from 'chalk'
import fs, { watchFile } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import NodeCache from 'node-cache'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const __filename = fileURLToPath(import.meta.url)

const nameCache = global.nameCache || (global.nameCache = new NodeCache({ stdTTL: 600, useClones: false }));
const groupMetaCache = global.groupCache || (global.groupCache = new NodeCache({ stdTTL: 300, useClones: false }));
const errorThrottle = new Map();
const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
const lastLogCache = { jid: null, time: 0 };

export function ensureMessageUpdateListener(conn = { ev: null, user: {} }) {
  if (!conn?.ev || global.messageUpdateListenerSet) return
  conn.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      const key = update?.key
      if (!key?.remoteJid || !key?.id) continue
      if (update.update?.message?.editedMessage?.message) {
        try {
          const editedContainer = update.update.message.editedMessage
          let editedMessage = editedContainer?.message || editedContainer
          if (editedMessage?.message) editedMessage = editedMessage.message
          if (!editedMessage) continue

          let originalMsg = null
          try {
            if (global.store?.getMessage) {
              originalMsg = await global.store.getMessage(key)
            } else if (global.store?.loadMessage) {
              const jid = conn.decodeJid(key.remoteJid)
              originalMsg = await global.store.loadMessage(jid, key.id)
            }
          } catch {
          }

          const participant = key.participant || originalMsg?.key?.participant || originalMsg?.participant || key.remoteJid
          const fakeMsg = {
            key: {
              ...key,
              participant,
              fromMe: false,
            },
            message: editedMessage,
            messageTimestamp: originalMsg?.messageTimestamp || update.update?.timestamp || update.update?.messageTimestamp,
            pushName: originalMsg?.pushName,
            broadcast: originalMsg?.broadcast,
          }

          if (typeof conn.handler === 'function') {
            await conn.handler({ messages: [fakeMsg], type: 'notify' })
          }
        } catch {
        }
        continue
      }
      if (update.update?.message === null) {
        continue
      }
    }
  })
  global.messageUpdateListenerSet = true
}

export default async function (m, conn = { user: {} }) {
  ensureMessageUpdateListener(conn)

  const protocolType = m?.message?.protocolMessage?.type
  const hasEditedMessage = !!(m?.message?.editedMessage || m?.message?.protocolMessage?.editedMessage || m?.message?.protocolMessage?.editedMessage?.message)
  const isEdit = hasEditedMessage || protocolType === 'MESSAGE_EDIT' || protocolType === 14
  const isDelete = m?.messageStubType === 68 || protocolType === 'REVOKE' || protocolType === 0
  if (isEdit || isDelete) return

  if (!m || m.key?.fromMe) return

  try {
    const senderJid = conn.decodeJid(m.sender)
    const chatJid = conn.decodeJid(m.chat || '')
    const botJid = conn.decodeJid(conn.user?.jid)

    if (!chatJid) {
      console.warn('chatJid is undefined, skipping print');
      return;
    }

    const getName = async (jid) => {
      let cached = nameCache.get(jid);
      if (cached) return cached;

      if (jid.endsWith('@newsletter')) {
        cached = 'Newsletter ' + jid.split('@')[0];
      } else if (jid.endsWith('@g.us')) {
        const meta = groupMetaCache.get(jid);
        cached = meta?.subject || '';
      }

      if (!cached) {
        const c = conn.contacts?.[jid] || global.store?.contacts?.[jid];
        cached = c?.notify || c?.name || '';
        if (!cached) {
          cached = await conn.getName(jid) || '';
        }
      }

      if (cached) nameCache.set(jid, cached);
      return cached || (jid.endsWith('@g.us') ? 'Chat Sconosciuta' : '');
    };

    const _name = await getName(senderJid);
    const sender = formatPhoneNumber(senderJid, _name);
    const chat = await getName(chatJid) || 'Chat Sconosciuta';

    const me = formatPhoneNumber(botJid || '', conn.user?.name || 'Bot')
    const now = Date.now();
    if (lastLogCache.jid === senderJid && now - lastLogCache.time < 1000) return;
    lastLogCache.jid = senderJid;
    lastLogCache.time = now;

    const senderPhone = senderJid.split('@')[0];
    const isOwner = Array.isArray(global.owner)
      ? global.owner.some(([number]) => number === senderPhone)
      : global.owner === senderPhone;
    const isGroup = chatJid.endsWith('@g.us');
    const isAdmin = isGroup ? await checkAdmin
