const handler = m => m;

handler.before = async function (m, { conn, participants, isBotAdmin }) {
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

  const sender = m.key?.participant || m.participant || m.sender;
  if (!sender) return;

  const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
  const target = m.messageStubParameters?.[0];

  if ([28, 29, 30].includes(m.messageStubType) && target === botJid) {
    await conn.sendMessage(m.chat, {
      text: `🛡️ *PROTEZIONE BOT ATTIVA*\n━━━━━━━━━━━━━━━━━━━━\n⚠️ Tentativo di modificare i permessi del bot rilevato.\n❌ Azione bloccata.\n━━━━━━━━━━━━━━━━━━━━\n🔐 *888 SECURITY SYSTEM*`
    });
    return;
  }

  const botOwners = (global.owner || []).filter(o => o[0]).map(o => o[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net');
  const whitelist = chatData.whitelist || [];
  
  let groupMetadata = participants ? { participants } : null;
  if (!groupMetadata) {
    try {
      groupMetadata = await conn.groupMetadata(m.chat);
    } catch {
      return;
    }
  }

  const ownerJid = groupMetadata.owner || groupMetadata.subjectOwner;
  const allowed = new Set([botJid, ownerJid, ...botOwners, ...whitelist]);

  if (allowed.has(sender)) return;

  if (m.messageStubType === 28 && target === sender) return;

  const senderData = groupMetadata.participants?.find(p => p.id === sender || p.jid === sender);
  if (!senderData?.admin && !senderData?.superAdmin) return;

  try {
    let usersToDemote = [sender];

    if (m.messageStubType === 29 && target && target !== botJid) {
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