const handler = m => m;

handler.before = async function (m, { conn, participants, isBotAdmin }) {
  if (!m.isGroup) return;
  if (!isBotAdmin) return;

  const chat = global.db.data.chats[m.chat];
  if (!chat?.antinuke) return;

  if (![21, 28, 29, 30].includes(m.messageStubType)) return;

  const sender = m.key?.participant || m.participant || m.sender;
  if (!sender) return;

  const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';

  const BOT_OWNERS = global.owner
    .filter(o => o[0])
    .map(o => o[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net');

  const localWhitelist = chat.whitelist || [];

  let ownerGroup = null;
  try {
    const metadata = await conn.groupMetadata(m.chat);
    ownerGroup = metadata.owner || metadata.subjectOwner;
  } catch {
    ownerGroup = null;
  }

  const allowed = [
    botJid,
    ...BOT_OWNERS,
    ...localWhitelist,
    ownerGroup
  ].filter(Boolean);

  if (allowed.includes(sender)) return;

  if (m.messageStubType === 28) {
    const affected = m.messageStubParameters?.[0];
    if (affected === sender) return;
  }

  if (!participants || !Array.isArray(participants) || participants.length === 0) return;

  const senderData = participants.find(p => p.jid === sender);
  if (!senderData?.admin) return;

  const usersToDemote = participants
    .filter(p => p.admin)
    .map(p => p.jid)
    .filter(jid => jid && !allowed.includes(jid));

  if (!usersToDemote.length && m.messageStubType !== 21) return;

  try {
    if (usersToDemote.length) {
      await conn.groupParticipantsUpdate(m.chat, usersToDemote, 'demote');
    }
    await conn.groupSettingUpdate(m.chat, 'announcement');
  } catch (e) {
    console.error('[ANTINUKE ERRORE] Impossibile eseguire azioni di sicurezza:', e);
    return;
  }

  const action =
    m.messageStubType === 21 ? 'MODIFICA NOME GRUPPO' :
    m.messageStubType === 28 ? 'RIMOZIONE UTENTE' :
    m.messageStubType === 29 ? 'PROMOZIONE ADMIN' :
    'RETROCESSIONE ADMIN';

  const text = `⚠️ *ATTIVITÀ SOSPETTA RILEVATA*
━━━━━━━━━━━━━━━━━━━━
👤 *Autore:* @${sender.split('@')[0]}
🚫 *Azione:* ${action}
⚡ *Stato:* INTERVENTO IMMEDIATO
━━━━━━━━━━━━━━━━━━━━
📉 Admin non autorizzati degradati
🔒 Gruppo impostato in sola lettura
✅ Utenti in whitelist preservati
━━━━━━━━━━━━━━━━━━━━
🔐 *888 SECURITY SYSTEM*`;

  try {
    await conn.sendMessage(m.chat, {
      text,
      contextInfo: {
        mentionedJid: [sender, ...usersToDemote, ...BOT_OWNERS].filter(Boolean),
        externalAdReply: {
          title: '🛡️ 888 ANTINUKE',
          body: 'Protocollo di Emergenza Attivo',
          thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Portrait_Placeholder.png/240px-Portrait_Placeholder.png',
          sourceUrl: 'ELIXIR_ANTINUKE',
          mediaType: 1,
          renderLargerThumbnail: true
        }
      },
    });
  } catch (e) {
    console.error('[ANTINUKE ERRORE] Invio messaggio fallito:', e);
  }
};

export default handler;
