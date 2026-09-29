let handler = async (m, { conn, text, command, usedPrefix, args }) => {

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
  if (!global.db.data.chats[m.chat].whitelist) global.db.data.chats[m.chat].whitelist = [];

  let chat = global.db.data.chats[m.chat];

  if (command === 'addwhitelist' && !args.length) {
    let group = await conn.groupMetadata(m.chat);
    let admins = group.participants.filter(p => p.admin);

    if (!admins.length) return m.reply("⚠️ Nessun admin trovato.");

    let adminList = admins.map(a => `• @${a.id.split('@')[0]}`).join('\n');

    await conn.sendMessage(
      m.chat,
      {
        text:
          `📑 *Admin del Gruppo*\n\n` +
          `${adminList}\n\n` +
          `Premi il tasto sotto per aggiungerli alla whitelist.`,
        mentions: admins.map(a => a.id),
        buttons: [
          {
            buttonId: `${usedPrefix}addwhitelist alladmins`,
            buttonText: { displayText: "➕ Aggiungi nella whitelist" },
            type: 1
          }
        ],
        headerType: 1
      }
    );

    return;
  }

  if (command === 'addwhitelist' && args[0] === 'alladmins') {
    let group = await conn.groupMetadata(m.chat);
    let admins = group.participants.filter(p => p.admin).map(a => a.id);

    let added = [];

    for (let who of admins) {
      if (!chat.whitelist.includes(who)) {
        chat.whitelist.push(who);
        added.push(who);
      }
    }

    await global.db.write();

    if (!added.length) return m.reply(`✨ Tutti gli admin erano già nella whitelist.`);

    let mentionText = added.map(j => `@${j.split('@')[0]}`).join(', ');

    await conn.sendMessage(
      m.chat,
      {
        text:
          `✅ *Admin Aggiunti nella Whitelist*\n` +
          `${mentionText}\n\n` +
          `Ora sono esenti dai controlli antinuke.`,
        contextInfo: { mentionedJid: added }
      },
      { quoted: m }
    );

    return;
  }

  if (command === 'addwhitelist') {
    let targets = [];

    if (m.mentionedJid?.length) {
      targets = m.mentionedJid;
    } else {
      let nums = args.map(v => v.replace(/[^0-9]/g, '')).filter(v => v.length >= 5);
      targets = nums.map(n => n + '@s.whatsapp.net');
    }

    if (!targets.length) return m.reply("⚠️ Nessun numero valido.");

    let added = [];

    for (let who of targets) {
      if (!chat.whitelist.includes(who)) {
        chat.whitelist.push(who);
        added.push(who);
      }
    }

    await global.db.write();

    if (!added.length) return m.reply(`✨ Gli utenti indicati erano già nella whitelist.`);

    let mentionText = added.map(j => `@${j.split('@')[0]}`).join(', ');

    await conn.sendMessage(
      m.chat,
      {
        text:
          `✅ *Utenti Autorizzati*\n` +
          `${mentionText}\n\n` +
          `Ora sono esenti dai controlli antinuke.`,
        contextInfo: { mentionedJid: added }
      },
      { quoted: m }
    );

    return;
  }

  if (command === 'delwhitelist' && !args.length) {
    let list = chat.whitelist;

    if (!list.length) return m.reply("⚠️ Nessun utente nella whitelist.");

    let formatted = list.map(j => `• @${j.split('@')[0]}`).join('\n');

    await conn.sendMessage(
      m.chat,
      {
        text:
          `🗑️ *Whitelist Attuale*\n\n` +
          `${formatted}\n\n` +
          `Premi il tasto sotto per rimuoverli dalla whitelist.`,
        mentions: list,
        buttons: [
          {
            buttonId: `${usedPrefix}delwhitelist all`,
            buttonText: { displayText: "🗑️ Rimuovi dalla whitelist" },
            type: 1
          }
        ],
        headerType: 1
      }
    );

    return;
  }

  if (command === 'delwhitelist' && args[0] === 'all') {
    let removed = [...chat.whitelist];

    chat.whitelist = [];
    await global.db.write();

    if (!removed.length) return m.reply("⚠️ Nessun utente da rimuovere.");

    let mentionText = removed.map(j => `@${j.split('@')[0]}`).join(', ');

    await conn.sendMessage(
      m.chat,
      {
        text:
          `🗑️ *Utenti Rimossi dalla Whitelist*\n` +
          `${mentionText}\n\n` +
          `La whitelist è ora vuota.`,
        contextInfo: { mentionedJid: removed }
      },
      { quoted: m }
    );

    return;
  }

  if (command === 'delwhitelist') {
    let nums = args.map(v => v.replace(/[^0-9]/g, '')).filter(v => v.length >= 5);
    if (!nums.length) return m.reply("⚠️ Numero non valido.");

    let who = nums[0] + '@s.whatsapp.net';

    if (!chat.whitelist.includes(who)) return m.reply(`❌ L’utente non è nella whitelist.`);

    chat.whitelist = chat.whitelist.filter(jid => jid !== who);
    await global.db.write();

    await conn.sendMessage(
      m.chat,
      {
        text:
          `🗑️ *Utente Rimosso*\n` +
          `👤 @${who.split('@')[0]}\n\n` +
          `Rimosso dalla whitelist.`,
        contextInfo: { mentionedJid: [who] }
      },
      { quoted: m }
    );

    return;
  }

  if (command === 'whitelist') {
    let list = chat.whitelist.map(jid => `• @${jid.split('@')[0]}`).join('\n');
    let caption =
      `📑 *Whitelist Gruppo*\n` +
      `${list || '⚠️ Nessun utente autorizzato.'}`;

    return m.reply(caption, null, { mentions: conn.parseMention(list) });
  }
};

handler.help = ['addwhitelist', 'delwhitelist', 'whitelist'];
handler.tags = ['owner', 'group'];
handler.command = /^(addwhitelist|delwhitelist|whitelist)$/i;
handler.owner = true;
handler.group = true;

export default handler;