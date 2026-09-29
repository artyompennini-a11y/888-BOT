let handler = async (m, { conn, text, command, usedPrefix, args }) => {

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
  if (!global.db.data.chats[m.chat].whitelist) global.db.data.chats[m.chat].whitelist = [];

  let chat = global.db.data.chats[m.chat];

  if (command === 'whitelist' && (!args.length || (args.length === 1 && args[0] === 'list'))) {
    let list = chat.whitelist.map(jid => `• @${jid.split('@')[0]}`).join('\n');
    let caption =
      `📑 *Whitelist Gruppo*\n` +
      `Utenti autorizzati:\n\n` +
      `${list || '⚠️ Nessun utente autorizzato.'}`;

    return m.reply(caption, null, { mentions: conn.parseMention(list) });
  }

  let action = null;
  if (command === 'whitelist' && args.length >= 2) {
    action = args[0].toLowerCase();
  } else if (command === 'addwhitelist') {
    action = 'add';
  } else if (command === 'delwhitelist') {
    action = 'remove';
  }

  if (!action) {
    return m.reply(
      `⚠️ Uso corretto:\n` +
      `${usedPrefix}whitelist add 123 456 789\n` +
      `${usedPrefix}addwhitelist 123 456`
    );
  }

  let targets = [];

  if (m.mentionedJid?.length) {
    targets = m.mentionedJid;
  } else if (m.quoted) {
    targets.push(m.quoted.sender);
  } else if (args.length >= 2) {
    let raw = args.slice(1).join(' ');
    let nums = raw.split(/\s+/).filter(v => v.length > 0);

    for (let n of nums) {
      let cleaned = n.replace(/[^0-9]/g, '');
      if (cleaned.length >= 5) {
        targets.push(cleaned + '@s.whatsapp.net');
      }
    }
  }

  if (!targets.length) {
    return m.reply(`⚠️ Nessun numero valido trovato.`);
  }

  if (action === 'add') {
    let added = [];

    for (let who of targets) {
      if (!chat.whitelist.includes(who)) {
        chat.whitelist.push(who);
        added.push(who);
      }
    }

    await global.db.write();

    if (!added.length) {
      return m.reply(`✨ Tutti gli utenti indicati erano già nella whitelist.`);
    }

    let mentionText = added.map(j => `@${j.split('@')[0]}`).join(', ');

    await conn.sendMessage(
      m.chat,
      {
        text:
          `✅ *Utenti Autorizzati*\n` +
          `${mentionText}\n\n` +
          `Sono ora esenti dai controlli antinuke.`,
        contextInfo: { mentionedJid: added }
      },
      { quoted: m }
    );

    return;
  }

  if (action === 'remove') {
    let removed = [];

    for (let who of targets) {
      if (chat.whitelist.includes(who)) {
        chat.whitelist = chat.whitelist.filter(jid => jid !== who);
        removed.push(who);
      }
    }

    await global.db.write();

    if (!removed.length) {
      return m.reply(`❌ Nessuno degli utenti indicati era nella whitelist.`);
    }

    let mentionText = removed.map(j => `@${j.split('@')[0]}`).join(', ');

    await conn.sendMessage(
      m.chat,
      {
        text:
          `🗑️ *Utenti Rimossi*\n` +
          `${mentionText}\n\n` +
          `Sono stati rimossi dalla whitelist.`,
        contextInfo: { mentionedJid: removed }
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