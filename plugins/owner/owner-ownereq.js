// Codice di a-ownreq.js
//Ownreq by Riad
const ownReqProcessing = new Set();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function normalizeNumber(jid, conn) {
  try {
    const decoded = conn.decodeJid(jid || '');
    return decoded.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
  } catch {
    return String(jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
  }
}

function getOwnerNumbers(conn) {
  const owners = [];

  if (Array.isArray(global.owner)) {
    for (const owner of global.owner) {
      const number = Array.isArray(owner) ? owner[0] : owner;
      if (number) owners.push(normalizeNumber(number, conn));
    }
  } else if (global.owner) {
    owners.push(normalizeNumber(global.owner, conn));
  }

  try {
    const botNumber = normalizeNumber(conn.user?.id || conn.user?.jid, conn);
    if (botNumber) owners.push(botNumber);
  } catch {}

  return [...new Set(owners.filter(Boolean))];
}

function attachOwnReq(conn) {
  if (!conn?.ws?.on) return;

  const ws = conn.ws;
  if (ws.__ownreqListenerAttached) return;
  ws.__ownreqListenerAttached = true;

  console.log('[OWNREQ] Listener collegato.');

  ws.on('CB:notification', async node => {
    try {
      if (!node) return;

      const attrs = node.attrs || {};
      if (attrs.type !== 'w:gp2') return;

      const content = node.content || [];
      const requestNode = content.find(item => item?.tag === 'created_membership_requests');
      if (!requestNode) return;

      const groupId = attrs.from;
      if (!groupId || !groupId.endsWith('@g.us')) return;

      const chat = global.db?.data?.chats?.[groupId];
      if (chat && !('ownreq' in chat)) chat.ownreq = true;
      if (!chat?.ownreq) return;

      if (ownReqProcessing.has(groupId)) return;

      const participantPn = attrs.participant_pn;
      if (!participantPn) return;

      const ownerNumbers = getOwnerNumbers(conn);
      const requestedNumber = normalizeNumber(participantPn, conn);

      if (!ownerNumbers.includes(requestedNumber)) return;

      ownReqProcessing.add(groupId);

      try {
        const ownerJid = participantPn.includes('@')
          ? participantPn
          : `${requestedNumber}@s.whatsapp.net`;

        console.log(`[OWNREQ] Owner rilevato: ${ownerJid} nel gruppo ${groupId}`);

        let metadata;
        try {
          metadata = await conn.groupMetadata(groupId);
        } catch (e) {
          console.error('[OWNREQ] Errore metadata:', e);
          return;
        }

        const bot = metadata?.participants?.find(p => {
          const jid = conn.decodeJid(p.jid || p.id || '');
          const botJid = conn.decodeJid(conn.user?.jid || conn.user?.id || '');
          return jid === botJid;
        });

        const isBotAdmin = bot?.admin === 'admin' || bot?.admin === 'superadmin';
        if (!isBotAdmin) {
          console.log(`[OWNREQ] Bot non admin nel gruppo ${groupId}`);
          return;
        }

        try {
          await conn.groupRequestParticipantsUpdate(groupId, [ownerJid], 'approve');
          console.log(`[OWNREQ] Owner accettato: ${ownerJid}`);
        } catch (e) {
          console.error('[OWNREQ] Errore accettando owner:', e);
          return;
        }

        await sleep(1500);

        try {
          await conn.groupParticipantsUpdate(groupId, [ownerJid], 'promote');
          console.log(`[OWNREQ] Owner promosso: ${ownerJid}`);
        } catch (e) {
          console.error('[OWNREQ] Errore promuovendo owner:', e);

          await conn.sendMessage(groupId, {
            text:
              `⚠️ *OWNREQ — Promozione non riuscita*\n\n` +
              `L’owner @${requestedNumber} è stato accettato ma non promosso ad admin.`,
            mentions: [ownerJid]
          });

          return;
        }

        await conn.sendMessage(groupId, {
          text:
            `🟢 *OWNREQ Attivo*\n\n` +
            `L’owner @${requestedNumber} è stato:\n` +
            `• Accettato automaticamente\n` +
            `• Promosso ad admin\n\n` +
            `Sistema OWNREQ 888 attivo nel gruppo.`,
          mentions: [ownerJid]
        });

      } finally {
        ownReqProcessing.delete(groupId);
      }

    } catch (e) {
      console.error('[OWNREQ] Errore listener:', e);
    }
  });
}

export async function all(m) {
  const conn = this;
  if (!conn) return;

  attachOwnReq(conn);

  if (conn.ev?.on && !conn.__ownreqConnectionUpdate) {
    conn.__ownreqConnectionUpdate = true;

    conn.ev.on('connection.update', () => {
      try {
        if (!conn.ws?.on) return;
        attachOwnReq(conn);
      } catch (e) {
        console.error('[OWNREQ] Errore riconnessione:', e);
      }
    });
  }

  if (!conn.__ownreqStarted) {
    conn.__ownreqStarted = true;
    console.log('[OWNREQ] Monitor richieste avviato.');
  }
}

export default { all };