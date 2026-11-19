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

handler.before = async function (m, { conn, participants, groupMetadata: extraGroupMetadata, isBotAdmin }) {
  if (!m.isGroup || !isBotAdmin) return;

  const chatData = global.db.data.chats[m.chat];
  if (!chatData?.antinuke) return;

  const STUB_TYPES = {
    21: 'MODIFICA NOME GRUPPO',
    22: 'MODIFICA ICONA GRUPPO',
    26: 'MODIFICA IMPOSTAZIONI GRUPPO',
    28: 'RIMOZIONE UTENTE',
    29: 'PROMOZIONE ADMIN',
    30: 'RETROCESSIONE ADMIN'
  };

  if (!STUB_TYPES[m.messageStubType]) return;

  const sender = decodeJid(conn, m.key?.participant || m.participant || m.sender);
  if (!sender) return;

  const botJid = decodeJid(conn, conn.user?.id || conn.user?.jid);
  const target = decodeJid(conn, m.messageStubParameters?.[0]);

  if ([28, 29, 30].includes(m.messageStubType) && sameJid(conn, target, botJid)) {
    await conn.sendMessage(m.chat, {
      text: `🛡️ *PROTEZIONE BOT ATTIVA*\n━━━━━━━━━━━━━━━━━━━━\n⚠️ Tentativo di modificare i permessi del bot rilevato.\n❌ Azione bloccata.\n━━━━━━━━━━━━━━━━━━━━\n🔐 *888 SECURITY SYSTEM*`
    });
    return;
  }

  const botOwners = (global.owner || [])
    .filter(owner => Array.isArray(owner) ? owner[0] : owner)
    .map(owner => decodeJid(conn, Array.isArray(owner) ? owner[0] : owner))
    .filter(Boolean);
  const whitelist = readWhitelist('antinuke', m.chat);
  
  let groupMetadata = extraGroupMetadata?.participants
    ? extraGroupMetadata
    : (Array.isArray(participants) && participants.length ? { participants } : null);
  if (!groupMetadata) {
    try {
      groupMetadata = await conn.groupMetadata(m.chat);
    } catch {
      return;
    }
  }
  if (!groupMetadata) return;

  const ownerJid = decodeJid(conn, groupMetadata.owner || groupMetadata.ownerLid || groupMetadata.subjectOwner);
  const allowedByJid = [botJid, ownerJid, ...botOwners, ...whitelist]
    .filter(Boolean)
    .some(jid => sameJid(conn, jid, sender));
  if (allowedByJid) return;

  if (isWhitelistedJid('antinuke', m.chat, sender)) return;

  if (m.messageStubType === 28 && sameJid(conn, target, sender)) return;

  const senderData = findGroupParticipant(groupMetadata.participants || [], sender, conn);
  if (!isParticipantAdmin(senderData)) return;

  try {
    let usersToDemote = [sender];

    if (m.messageStubType === 29 && target && !sameJid(conn, target, botJid)) {
      usersToDemote.push(target);
    }

    await Promise.all([
      conn.groupParticipantsUpdate(m.chat, usersToDemote, 'demote'),
      conn.groupSettingUpdate(m.chat, 'announcement')
    ]);
  } catch (e) {
    console.error('[ANTINUKE ERROR]:', e);
    return;
  }

  const action = STUB_TYPES[m.messageStubType] || 'ATTIVITÀ SOSPETTA';
  const message = `⚠️ *ATTIVITÀ SOSPETTA RILEVATA*\n━━━━━━━━━━━━━━━━━━━━\n👤 *Autore:* @${sender.split('@')[0]}\n🚫 *Azione:* ${action}\n⚡ *Stato:* INTERVENTO IMMEDIATO\n━━━━━━━━━━━━━━━━━━━━\n📉 Admin colpevole degradato\n🔒 Gruppo impostato in sola lettura\n🔁 Eventuali promozioni annullate\n━━━━━━━━━━━━━━━━━━━━\n🔐 *888 SECURITY SYSTEM*`;

  await conn.sendMessage(m.chat, {
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

export default handler;
