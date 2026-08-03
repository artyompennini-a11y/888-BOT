const handler = m => m;

handler.before = async function (m, { conn, participants, isBotAdmin }) {
  if (!m.isGroup) return;
  if (!isBotAdmin) return;

  const chat = global.db.data.chats[m.chat];
  if (!chat?.antinuke) return;

  // 21: Nome gruppo | 22: Icona | 26: Impostazioni gruppo | 28: Rimozione utente | 29: Promozione | 30: Retrocessione
  if (![21, 22, 26, 28, 29, 30].includes(m.messageStubType)) return;

  const sender = m.key?.participant || m.participant || m.sender;
  if (!sender) return;

  const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';

  const BOT_OWNERS = (global.owner || [])
    .filter(o => o[0])
    .map(o => o[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net');

  const localWhitelist = chat.whitelist || [];

  let ownerGroup = null;
  let currentParticipants = participants;

  try {
    const metadata = await conn.groupMetadata(m.chat);
    ownerGroup = metadata.owner || metadata.subjectOwner;
    if (!currentParticipants || !currentParticipants.length) {
      currentParticipants = metadata.participants;
    }
  } catch {
    ownerGroup = null;
  }

  const allowed = [
    botJid,
    ...BOT_OWNERS,
    ...localWhitelist,
    ownerGroup
  ].filter(Boolean);

  // Se l'autore dell'azione è in whitelist, ignora
  if (allowed.includes(sender)) return;

  // Se l'utente sta uscendo spontaneamente dal gruppo, ignora
  if (m.messageStubType === 28) {
    const affected = m.messageStubParameters?.[0];
    if (affected === sender) return;
  }

  if (!currentParticipants || !Array.isArray(currentParticipants) || currentParticipants.length === 0) return;

  // Verifica se l'autore dell'azione è un admin
  const senderData = currentParticipants.find(p => p.jid === sender);
  if (!senderData?.admin) return;

  // Degradiamo solo l'autore dell'infrazione se non è in whitelist
  const usersToDemote = [sender];

  try {
    // Retrocessione dell'autore
    await conn.groupParticipantsUpdate(m.chat, usersToDemote, 'demote');
    // Blocco del gruppo in sola lettura
    await conn.groupSettingUpdate(m.chat, 'announcement');
  } catch (e) {
    console.error('[ANTINUKE ERRORE] Impossibile eseguire azioni di sicurezza:', e);
    return;
  }

  const actionMap = {
    21: 'MODIFICA NOME GRUPPO',
    22: 'MODIFICA ICONA GRUPPO',
    26: 'MODIFICA IMPOSTAZIONI GRUPPO',
    28: 'RIMOZIONE UTENTE',
    29: 'PROMOZIONE ADMIN',
    30: 'RETROCESSIONE ADMIN'
  };

  const action = actionMap[m.messageStubType] || 'ATTIVITÀ SOSPETTA';

  const text = `⚠️ *ATTIVITÀ SOSPETTA RILEVATA*
━━━━━━━━━━━━━━━━━━━━
👤 *Autore:* @${sender.split('@')[0]}
🚫 *Azione:* ${action}
⚡ *Stato:* INTERVENTO IMMEDIATO
━━━━━━━━━━━━━━━━━━━━
📉 Autore dell'azione degradato
🔒 Gruppo impostato in sola lettura
✅ Utenti in whitelist preservati
━━━━━━━━━━━━━━━━━━━━
🔐 *888 SECURITY SYSTEM*`;

  try {
    await conn.sendMessage(m.chat, {
      text,
      contextInfo: {
        mentionedJid: [sender, ...BOT_OWNERS].filter(Boolean),
        externalAdReply: {
          title: '🛡️ 888 ANTINUKE',
          body: 'Protocollo di Emergenza Attivo',
          thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Portrait_Placeholder.png/240px-Portrait_Placeholder.png',
          sourceUrl: '888_ANTINUKE',
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