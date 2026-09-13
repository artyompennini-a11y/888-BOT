let handler = async (m, { conn, text, command, usedPrefix, args }) => {

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
  if (!global.db.data.chats[m.chat].whitelist) global.db.data.chats[m.chat].whitelist = [];

  let chat = global.db.data.chats[m.chat];
  let who;

  // LISTA WHITELIST — PREMIUM 888
  if (command === 'whitelist' && (!args.length || (args.length === 1 && args[0] === 'list'))) {
    let list = chat.whitelist.map(jid => `• @${jid.split('@')[0]}`).join('\n');

    let caption =
      `📑 *Whitelist Gruppo*\n` +
      `Utenti autorizzati:\n\n` +
      `${list || '⚠️ Nessun utente autorizzato.'}`;

    return m.reply(caption, null, { mentions: conn.parseMention(list) });
  }

  // Determinazione target
  let action = null;

  if (command === 'whitelist' && args.length >= 2) {
    action = args[0].toLowerCase();
    let targetText = args.slice(1).join(' ');
    who = m.mentionedJid?.[0]
      || m.quoted?.sender
      || (targetText ? targetText.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false);

  } else if (command === 'addwhitelist') {
    action = 'add';
    who = m.mentionedJid?.[0]
      || m.quoted?.sender
      || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false);

  } else if (command === 'delwhitelist') {
    action = 'remove';
    who = m.mentionedJid?.[0]
      || m.quoted?.sender
      || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false);
  }

  if (!who) {
    return m.reply(
      `⚠️ Uso corretto:\n` +
      `${usedPrefix}whitelist add @tag\n` +
      `${usedPrefix}addwhitelist @tag`
    );
  }

  // AGGIUNTA — PREMIUM 888
  if (action === 'add' || command === 'addwhitelist') {
    if (chat.whitelist.includes(who)) {
      return m.reply(`✨ L’utente è già presente nella whitelist.`);
    }

    chat.whitelist.push(who);
    await global.db.write();

    await conn.sendMessage(
      m.chat,
      {
        text:
          `✅ *Utente Autorizzato*\n` +
          `👤 @${who.split('@')[0]}\n` +
          `🏰 Ambito: Questo gruppo\n\n` +
          `L’utente è ora esente dai controlli antinuke.`,
        contextInfo: { mentionedJid: [who] }
      },
      { quoted: m }
    );

    return;
  }

  // RIMOZIONE — PREMIUM 888
  if (action === 'remove' || command === 'delwhitelist') {
    if (!chat.whitelist.includes(who)) {
      return m.reply(`❌ L’utente non è presente nella whitelist.`);
    }

    chat.whitelist = chat.whitelist.filter(jid => jid !== who);
    await global.db.write();

    await conn.sendMessage(
      m.chat,
      {
        text:
          `🗑️ *Utente Rimosso*\n` +
          `👤 @${who.split('@')[0]}\n` +
          `🏰 Ambito: Questo gruppo\n\n` +
          `L’utente è stato rimosso dalla whitelist.`,
        contextInfo: { mentionedJid: [who] }
      },
      { quoted: m }
    );

    return;
  }
};

handler.help = ['addwhitelist', 'delwhitelist', 'whitelist'];
handler.tags = ['owner', 'group'];
handler.command = /^(addwhitelist|delwhitelist|whitelist)$/i;

handler.owner = true;
handler.group = true;

export default handler;