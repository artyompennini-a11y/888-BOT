import { readWhitelist, isWhitelistedJid } from '../../lib/whitelist.js';
import { findGroupParticipant, isParticipantAdmin } from '../../lib/moderation.js';

const onlyDigits = value => String(value ?? '').replace(/\D/g, '');

const decodeJid = (conn, jid) => {
  try {
    return typeof conn?.decodeJid === 'function' ? conn.decodeJid(jid) : jid;
  } catch {
    return jid;
  }
};

const sameJid = (conn, left, right) => {
  if (!left || !right) return false;
  const decodedLeft = decodeJid(conn, left);
  const decodedRight = decodeJid(conn, right);
  if (decodedLeft === decodedRight) return true;
  const leftDigits = onlyDigits(decodedLeft);
  const rightDigits = onlyDigits(decodedRight);
  return Boolean(leftDigits && rightDigits) && leftDigits === rightDigits;
};

const handler = m => m;
handler.customPrefix = false;

const recentAntinukeEvents = new Map();

const processAntinuke = async ({ conn, chat, actor, targets = [], action, isBotAdmin = true }) => {
  if (!chat || !actor || !isBotAdmin) return;

  const chatData = global.db.data.chats[chat];
  if (!chatData?.antinuke) return;

  const STUB_TYPES = {
    21: 'MODIFICA NOME GRUPPO',
    22: 'MODIFICA ICONA GRUPPO',
    26: 'MODIFICA IMPOSTAZIONI GRUPPO',
    28: 'RIMOZIONE UTENTE',
    29: 'PROMOZIONE ADMIN',
    30: 'RETROCESSIONE ADMIN'
  };
  if (!STUB_TYPES[action]) return;

  const sender = decodeJid(conn, actor);
  const botJid = decodeJid(conn, conn.user?.id || conn.user?.jid);

  if ([28, 29, 30].includes(action) && targets.some(targetJid => sameJid(conn, targetJid, botJid))) {
    await conn.sendMessage(chat, {
      text: `🛡️ *PROTEZIONE BOT ATTIVA*\n━━━━━━━━━━━━━━━━━━━━\n⚠️ Tentativo di modificare i permessi del bot rilevato.\n❌ Azione bloccata.\n━━━━━━━━━━━━━━━━━━━━\n🔐 *888 SECURITY SYSTEM*`
    });
    return;
  }

  const botOwners = (global.owner || [])
    .filter(owner => Array.isArray(owner) ? owner[0] : owner)
    .map(owner => decodeJid(conn, Array.isArray(owner) ? owner[0] : owner))
    .filter(Boolean);
  const whitelist = readWhitelist('antinuke', chat);
  
  let groupMetadata = null;
  try {
    groupMetadata = await conn.groupMetadata(chat);
  } catch {
    return;
  }
  if (!groupMetadata) return;

  const ownerJid = decodeJid(conn, groupMetadata.owner || groupMetadata.ownerLid || groupMetadata.subjectOwner);
  const allowedByJid = [botJid, ownerJid, ...botOwners, ...whitelist]
    .filter(Boolean)
    .some(jid => sameJid(conn, jid, sender));
  if (allowedByJid) return;

  if (isWhitelistedJid('antinuke', chat, sender)) return;

  if (action === 28 && targets.some(targetJid => sameJid(conn, targetJid, sender))) return;

  const senderData = findGroupParticipant(groupMetadata.participants || [], sender, conn);
  if (!isParticipantAdmin(senderData)) {
    const actorDigits = onlyDigits(decodeJid(conn, sender));
    const ownerNumbers = new Set(botOwners.map(jid => onlyDigits(jid)).filter(Boolean));
    if (!ownerNumbers.has(actorDigits)) return;
  }

  const dedupeKey = `${chat}:${sender}:${action}:${targets.map(targetJid => onlyDigits(targetJid)).join(',')}`;
  const now = Date.now();
  if ((recentAntinukeEvents.get(dedupeKey) || 0) > now - 4000) return;
  recentAntinukeEvents.set(dedupeKey, now);
  for (const [key, timestamp] of recentAntinukeEvents) {
    if (timestamp < now - 10000) recentAntinukeEvents.delete(key);
  }

  try {
    let usersToDemote = [sender];

    if ([29, 30].includes(action)) {
      for (const targetJid of targets) {
        if (targetJid && !sameJid(conn, targetJid, botJid) && !sameJid(conn, targetJid, sender)) {
          usersToDemote.push(decodeJid(conn, targetJid));
        }
      }
    }

    await Promise.all([
      conn.groupParticipantsUpdate(chat, [...new Set(usersToDemote)], 'demote'),
      conn.groupSettingUpdate(chat, 'announcement')
    ]);
  } catch (e) {
    console.error('[ANTINUKE ERROR]:', e);
    return;
  }

  const actionLabel = STUB_TYPES[action] || 'ATTIVITÀ SOSPETTA';
  const message = `⚠️ *ATTIVITÀ SOSPETTA RILEVATA*\n━━━━━━━━━━━━━━━━━━━━\n👤 *Autore:* @${sender.split('@')[0]}\n🚖 *Azione:* ${actionLabel}\n⚡ *Stato:* INTERVENTO IMMEDIATO\n━━━━━━━━━━━━━━━━━━━━\n📉 Admin colpevole degradato\n🔒 Gruppo impostato in sola lettura\n🔁 Eventuali promozioni annullate\n━━━━━━━━━━━━━━━━━━━━\n🔐 *888 SECURITY SYSTEM*`;

  await conn.sendMessage(chat, {
    text: message,
    contextInfo: {
      mentionedJid: [sender, ...botOwners].filter(Boolean),
      externalAdReply: {
        title: '🛡️ 888 ANTINUKE',
        body: 'Protocollo di Emergenza Attivo',
        thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Portrait_Placeholder.png/240px-Portrait_Placeholder.png',
        sourceUrl: '888_ANTINUKE',
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  }).catch(() => {});
};

handler.before = async function (m, { conn, isBotAdmin }) {
  if (!m.isGroup || !isBotAdmin) return;
  const stubAction = m.messageStubType;
  if (![21, 22, 26, 28, 29, 30].includes(stubAction)) return;
  const actor = m.key?.participant || m.participant || m.sender;
  const targets = Array.isArray(m.messageStubParameters) ? m.messageStubParameters : [];
  await processAntinuke({
    conn,
    chat: m.chat,
    actor,
    targets,
    action: stubAction,
    isBotAdmin
  });
};

handler.groupParticipantsUpdate = async function (update) {
  if (!update?.id) return;
  if (!['promote', 'demote'].includes(update.action)) return;
  const conn = this;
  const botParticipant = await conn.groupMetadata(update.id).then(meta =>
    meta.participants?.find(participant =>
      [participant.id, participant.jid, participant.lid, participant.phoneNumber]
        .filter(Boolean)
        .some(jid => decodeJid(conn, jid) === decodeJid(conn, conn.user?.id || conn.user?.jid))
    )
  ).catch(() => null);
  const isBotAdmin = !!botParticipant?.admin || botParticipant?.admin === 'superadmin';
  const actor = update.author || update.authorPn || update.authorLid || update.participant;
  await processAntinuke({
    conn,
    chat: update.id,
    actor,
    targets: Array.isArray(update.participants) ? update.participants : [],
    action: update.action === 'promote' ? 29 : 30,
    isBotAdmin
  });
};

export default handler;
