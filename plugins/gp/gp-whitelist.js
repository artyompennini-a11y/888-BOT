

const cleanJid = (jid = '') => String(jid).replace(/:\d+@/, '@'); // toglie il suffisso device

const isReal = (jid = '') => jid.endsWith('@s.whatsapp.net');
const isLid  = (jid = '') => jid.endsWith('@lid');

const tag = (jid) => '@' + String(jid).split('@')[0];

function normalizeJid(input) {
  if (!input) return null;
  input = String(input).trim();

  // già un JID (s.whatsapp.net oppure lid): NON toccarlo
  if (input.includes('@')) return cleanJid(input);

  const num = input.replace(/[^0-9]/g, '');
  if (num.length < 5) return null;

  return num + '@s.whatsapp.net';
}

async function getParticipants(conn, chatId) {
  try {
    return (await conn.groupMetadata(chatId)).participants || [];
  } catch {
    return [];
  }
}

// Numero reale di un partecipante (se WhatsApp lo fornisce)
const realOf = (p) => {
  const cand = p.phoneNumber || p.jid || (isReal(p.id) ? p.id : null);
  return cand ? cleanJid(cand) : null;
};

// Converte un LID nel numero vero usando i partecipanti del gruppo
function resolveJid(jid, participants) {
  jid = normalizeJid(jid);
  if (!jid) return null;
  if (isReal(jid) && !participants.some(p => p.id === jid && isLid(p.id))) {
    // potrebbe essere un LID mascherato: lo controlla la migrazione
    return jid;
  }

  const p = participants.find(x =>
    cleanJid(x.id) === jid || x.lid === jid || cleanJid(x.jid || '') === jid
  );

  if (p) return realOf(p) || cleanJid(p.id);
  return jid;
}

// Ripara le voci salvate male in passato (LID trasformati in @s.whatsapp.net)
function repairWhitelist(list, participants) {
  const out = [];

  for (let jid of list) {
    let fixed = cleanJid(jid);

    if (isReal(fixed)) {
      const digits = fixed.split('@')[0];

      // è un vero numero presente nel gruppo? allora ok
      const okReal = participants.some(p => realOf(p) === fixed);

      if (!okReal) {
        // forse era un LID trasformato in numero finto
        const asLid = `${digits}@lid`;
        const p = participants.find(x => cleanJid(x.id) === asLid || x.lid === asLid);
        if (p) fixed = realOf(p) || asLid;
      }
    } else if (isLid(fixed)) {
      const p = participants.find(x => cleanJid(x.id) === fixed || x.lid === fixed);
      if (p) fixed = realOf(p) || fixed;
    }

    if (!out.includes(fixed)) out.push(fixed);
  }

  return out;
}

function extractTargets(m, args, participants) {
  let targets = [];

  if (m.mentionedJid?.length) {
    targets = m.mentionedJid.map(j => resolveJid(j, participants)).filter(Boolean);
    return [...new Set(targets)];
  }

  if (m.quoted) {
    const jid = resolveJid(m.quoted.sender, participants);
    if (jid) targets.push(jid);
    return targets;
  }

  for (const n of args.join(' ').split(/\s+/)) {
    const jid = resolveJid(n, participants);
    if (jid) targets.push(jid);
  }

  return [...new Set(targets)];
}

/* =========================================================
   HANDLER
   ========================================================= */

let handler = async (m, { conn, text, command, usedPrefix, args }) => {

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
  if (!global.db.data.chats[m.chat].whitelist) global.db.data.chats[m.chat].whitelist = [];

  let chat = global.db.data.chats[m.chat];

  const participants = await getParticipants(conn, m.chat);

  // ripara automaticamente le voci vecchie sbagliate
  const before = JSON.stringify(chat.whitelist);
  chat.whitelist = repairWhitelist(chat.whitelist, participants);
  if (JSON.stringify(chat.whitelist) !== before) await global.db.write();

  /* ---------- addwhitelist (lista admin + bottone) ---------- */
  if (command === 'addwhitelist' && !args.length && !m.quoted && !m.mentionedJid?.length) {
    let admins = participants.filter(p => p.admin);

    if (!admins.length) return m.reply('⚠️ Nessun admin trovato.');

    let adminList = admins
      .map(a => `• ${tag(realOf(a) || a.id)}`)
      .join('\n');

    await conn.sendMessage(m.chat, {
      text:
        `📑 *Admin del Gruppo*\n\n` +
        `${adminList}\n\n` +
        `Premi il tasto sotto per aggiungerli alla whitelist.`,
      mentions: admins.map(a => realOf(a) || a.id),
      buttons: [
        {
          buttonId: `${usedPrefix}addwhitelist alladmins`,
          buttonText: { displayText: '➕ Aggiungi nella whitelist' },
          type: 1
        }
      ],
      headerType: 1
    });

    return;
  }

  /* ---------- addwhitelist alladmins ---------- */
  if (command === 'addwhitelist' && args[0] === 'alladmins') {
    let admins = participants
      .filter(p => p.admin)
      .map(a => realOf(a) || cleanJid(a.id));

    let added = [];

    for (let who of admins) {
      if (!chat.whitelist.includes(who)) {
        chat.whitelist.push(who);
        added.push(who);
      }
    }

    await global.db.write();

    if (!added.length) return m.reply('✨ Tutti gli admin erano già nella whitelist.');

    await conn.sendMessage(m.chat, {
      text:
        `✅ *Admin Aggiunti nella Whitelist*\n` +
        `${added.map(tag).join(', ')}\n\n` +
        `Ora sono esenti dai controlli antinuke.`,
      contextInfo: { mentionedJid: added }
    }, { quoted: m });

    return;
  }

  /* ---------- addwhitelist <utente> ---------- */
  if (command === 'addwhitelist') {
    let targets = extractTargets(m, args, participants);

    if (!targets.length) return m.reply('⚠️ Nessun numero valido.');

    let added = [];

    for (let who of targets) {
      if (!chat.whitelist.includes(who)) {
        chat.whitelist.push(who);
        added.push(who);
      }
    }

    await global.db.write();

    if (!added.length) return m.reply('✨ Gli utenti indicati erano già nella whitelist.');

    await conn.sendMessage(m.chat, {
      text:
        `✅ *Utenti Autorizzati*\n` +
        `${added.map(tag).join(', ')}\n\n` +
        `Ora sono esenti dai controlli antinuke.`,
      contextInfo: { mentionedJid: added }
    }, { quoted: m });

    return;
  }

  /* ---------- delwhitelist (lista + bottone) ---------- */
  if (command === 'delwhitelist' && !args.length && !m.quoted && !m.mentionedJid?.length) {
    let list = chat.whitelist;

    if (!list.length) return m.reply('⚠️ Nessun utente nella whitelist.');

    await conn.sendMessage(m.chat, {
      text:
        `🗑️ *Whitelist Attuale*\n\n` +
        `${list.map(j => `• ${tag(j)}`).join('\n')}\n\n` +
        `Premi il tasto sotto per rimuoverli dalla whitelist.`,
      mentions: list,
      buttons: [
        {
          buttonId: `${usedPrefix}delwhitelist all`,
          buttonText: { displayText: '🗑️ Rimuovi dalla whitelist' },
          type: 1
        }
      ],
      headerType: 1
    });

    return;
  }

  /* ---------- delwhitelist all ---------- */
  if (command === 'delwhitelist' && args[0] === 'all') {
    let removed = [...chat.whitelist];

    chat.whitelist = [];
    await global.db.write();

    if (!removed.length) return m.reply('⚠️ Nessun utente da rimuovere.');

    await conn.sendMessage(m.chat, {
      text:
        `🗑️ *Utenti Rimossi dalla Whitelist*\n` +
        `${removed.map(tag).join(', ')}\n\n` +
        `La whitelist è ora vuota.`,
      contextInfo: { mentionedJid: removed }
    }, { quoted: m });

    return;
  }

  /* ---------- delwhitelist <utente> ---------- */
  if (command === 'delwhitelist') {
    let targets = extractTargets(m, args, participants);
    if (!targets.length) return m.reply('⚠️ Numero non valido.');

    let who = targets[0];

    if (!chat.whitelist.includes(who)) return m.reply('❌ L’utente non è nella whitelist.');

    chat.whitelist = chat.whitelist.filter(jid => jid !== who);
    await global.db.write();

    await conn.sendMessage(m.chat, {
      text:
        `🗑️ *Utente Rimosso*\n` +
        `👤 ${tag(who)}\n\n` +
        `Rimosso dalla whitelist.`,
      contextInfo: { mentionedJid: [who] }
    }, { quoted: m });

    return;
  }

  /* ---------- whitelist ---------- */
  if (command === 'whitelist') {
    let list = chat.whitelist.map(jid => `• ${tag(jid)}`).join('\n');

    let caption =
      `📑 *Whitelist Gruppo*\n` +
      `${list || '⚠️ Nessun utente autorizzato.'}`;

    return m.reply(caption, null, { mentions: chat.whitelist });
  }
};

handler.help = ['addwhitelist', 'delwhitelist', 'whitelist'];
handler.tags = ['owner', 'group'];
handler.command = /^(addwhitelist|delwhitelist|whitelist)$/i;
handler.owner = true;
handler.group = true;

export default handler;
