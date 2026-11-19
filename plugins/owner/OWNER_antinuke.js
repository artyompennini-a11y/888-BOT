import { readWhitelist, isWhitelistedJid } from '../../lib/whitelist.js';

const handler = m => m;

const STUB_TYPES = {
  21: 'MODIFICA NOME GRUPPO',
  22: 'MODIFICA ICONA GRUPPO',
  25: 'MODIFICA INFO GRUPPO',
  26: 'MODIFICA IMPOSTAZIONI GRUPPO',
  28: 'RIMOZIONE UTENTE',
  29: 'PROMOZIONE ADMIN',
  30: 'RETROCESSIONE ADMIN'
};

const norm = j => String(j || '').split('@')[0].split(':')[0];

const stop = reason => {
  console.log('[ANTINUKE] stop:', reason);
};

const parseTarget = raw => {
  if (!raw) return raw;
  try {
    const p = JSON.parse(raw);
    return p.id || p.lid || p.phoneNumber || raw;
  } catch {
    return raw;
  }
};

handler.before = async function (m, { conn, participants }) {
  if (!m.isGroup) return;
  if (!STUB_TYPES[m.messageStubType]) return;

  const chatData = global.db.data.chats[m.chat];
  if (!chatData?.antinuke) return stop('antinuke non attivo in questo gruppo');

  const sender = m.key?.participant || m.participant || m.sender;
  if (!sender) return stop('sender mancante');

  const target = parseTarget(m.messageStubParameters?.[0]);

  const botIds = [conn.user?.lid, conn.user?.id].map(norm).filter(Boolean);
  const isBot = j => botIds.includes(norm(j));

  let groupMetadata = null;
  try {
    groupMetadata = await conn.groupMetadata(m.chat);
  } catch {
    if (participants) groupMetadata = { participants };
  }
  if (!groupMetadata) return stop('metadata non disponibili');

  const parts = groupMetadata.participants || [];
  const idsOf = p => [p.id, p.lid, p.jid, p.phoneNumber].map(norm).filter(Boolean);

  const botData = parts.find(p => idsOf(p).some(i => botIds.includes(i)));
  if (!botData?.admin) return stop('il bot non risulta admin');

  if (isBot(sender)) return stop('azione fatta dal bot');

  if ([28, 29, 30].includes(m.messageStubType) && isBot(target)) {
    await conn.sendMessage(m.chat, {
      text: `🛡️ *PROTEZIONE BOT ATTIVA*\n━━━━━━━━━━━━━━━━━━━━\n⚠️ Tentativo di modificare i permessi del bot rilevato.\n❌ Azione bloccata.\n━━━━━━━━━━━━━━━━━━━━\n🔐 *888 SECURITY SYSTEM*`
    }).catch(() => {});
    return;
  }

  const senderData = parts.find(p => idsOf(p).includes(norm(sender)));
  const senderIds = senderData ? idsOf(senderData) : [norm(sender)];

  const botOwners = (global.owner || [])
    .filter(o => o && o[0])
    .map(o => String(o[0]).replace(/[^0-9]/g, '') + '@s.whatsapp.net');

  const whitelist = readWhitelist('antinuke', m.chat) || [];

  const ownerJid = groupMetadata.owner || groupMetadata.subjectOwner;
  const ownerData = ownerJid ? parts.find(p => idsOf(p).includes(norm(ownerJid))) : null;
  const ownerIds = ownerData ? idsOf(ownerData) : [norm(ownerJid)];

  const allowed = new Set([
    ...botIds,
    ...ownerIds,
    ...botOwners.map(norm),
    ...whitelist.map(norm)
  ].filter(Boolean));

  if (senderIds.some(i => allowed.has(i))) return stop('sender esente (creatore gruppo, owner bot o whitelist): ' + senderIds.join(','));
  if (senderIds.some(i => isWhitelistedJid('antinuke', m.chat, i + '@s.whatsapp.net'))) return stop('sender in whitelist');
  if (isWhitelistedJid('antinuke', m.chat, sender)) return stop('sender in whitelist');

  if (m.messageStubType === 28 && norm(target) === norm(sender)) return stop('utente uscito da solo');

  if (!senderData?.admin) return stop('sender non admin o non trovato tra i partecipanti: ' + sender);

  try {
    const usersToDemote = [senderData.id || sender];

    if (m.messageStubType === 29 && target && !isBot(target)) {
      const targetData = parts.find(p => idsOf(p).includes(norm(target)));
      usersToDemote.push(targetData?.id || target);
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
  const message = `⚠️ *ATTIVITÀ SOSPETTA RILEVATA*\n━━━━━━━━━━━━━━━━━━━━\n👤 *Autore:* @${norm(sender)}\n🚫 *Azione:* ${action}\n⚡ *Stato:* INTERVENTO IMMEDIATO\n━━━━━━━━━━━━━━━━━━━━\n📉 Admin colpevole degradato\n🔒 Gruppo impostato in sola lettura\n🔁 Eventuali promozioni annullate\n━━━━━━━━━━━━━━━━━━━━\n🔐 *888 SECURITY SYSTEM*`;

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
