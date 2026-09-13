const PROTECTED_USERS = [
  '393784409415@s.whatsapp.net',
  '393206032199@s.whatsapp.net'
];

const MAX_WARN = 5;

const handler = async (msg, { conn, command, text, isAdmin }) => {
  let mentionedJid = msg.mentionedJid?.[0] || msg.quoted?.sender;

  if (!mentionedJid && text) {
    let number = text.split(' ')[0].replace(/[^0-9]/g, '');
    if (number.length >= 8 && number.length <= 15) {
      mentionedJid = number + '@s.whatsapp.net';
    }
  }

  const chatId = msg.chat;
  const botNumber = conn.user.jid;
  const groupMetadata = await conn.groupMetadata(chatId);
  const groupOwner = groupMetadata.owner || chatId.split('-')[0] + '@s.whatsapp.net';

  if (!isAdmin) throw '⛔ Accesso negato — servono privilegi admin.';

  if (!mentionedJid) {
    return conn.reply(chatId, `⚠️ Devi menzionare o rispondere a un utente.`, msg);
  }

  let reason = text ? text.replace(/@\d+|^\d+/, '').trim() : '';

  if (command === 'warn' && (!reason || reason.length < 3)) {
    return conn.reply(chatId, `ℹ️ Inserisci una motivazione valida per ammonire l’utente.`, msg);
  }

  if (mentionedJid === groupOwner || PROTECTED_USERS.includes(mentionedJid) || mentionedJid === botNumber) {
    return conn.reply(chatId, `ⓘ Questo utente è protetto e non può essere sanzionato.`, msg);
  }

  if (!global.db.data.users[mentionedJid]) global.db.data.users[mentionedJid] = { warn: 0 };
  const user = global.db.data.users[mentionedJid];
  const tag = '@' + mentionedJid.split('@')[0];

  // -------------------------
  // 🔥 WARN — STILE 888
  // -------------------------
  if (command === 'warn') {
    user.warn = (user.warn || 0) + 1;

    if (user.warn >= MAX_WARN) {
      user.warn = 0;

      let messaggioKick =
`❌ *Utente Espulso*
👤 Target: ${tag}
⚙️ Azione: Rimozione automatica
⛔ Motivo: Ha raggiunto ${MAX_WARN} avvertimenti`;

      await conn.sendMessage(chatId, { text: messaggioKick, mentions: [mentionedJid] });
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await conn.groupParticipantsUpdate(chatId, [mentionedJid], 'remove');
    }

    let messaggioWarn =
`⚠️ *Avvertimento*
👤 Target: ${tag}
👑 Eseguito da: @${msg.sender.split('@')[0]}
📊 Sanzioni: [ ${user.warn} / ${MAX_WARN} ]
📝 Motivo: ${reason}

⮕ Al quinto avvertimento verrai espulso dal gruppo.`;

    return conn.sendMessage(chatId, { text: messaggioWarn, mentions: [mentionedJid, msg.sender] });
  }

  // -------------------------
  // 🔥 UNWARN — STILE 888
  // -------------------------
  if (command === 'unwarn') {
    if (!user.warn || user.warn <= 0) throw 'ℹ️ L’utente non ha sanzioni attive.';
    user.warn -= 1;

    let messaggioUnwarn =
`✅ *Sanzione Revocata*
👤 Target: ${tag}
👑 Eseguito da: @${msg.sender.split('@')[0]}
📊 Sanzioni Rimanenti: [ ${user.warn} / ${MAX_WARN} ]

⮕ Un avvertimento è stato rimosso.`;

    return conn.sendMessage(chatId, { text: messaggioUnwarn, mentions: [mentionedJid, msg.sender] });
  }
};

handler.help = ['warn', 'unwarn'];
handler.tags = ['admin'];
handler.command = /^(warn|unwarn)$/i;
handler.group = true;
handler.botAdmin = true;

export default handler;