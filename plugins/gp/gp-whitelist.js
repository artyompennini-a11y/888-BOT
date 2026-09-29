let handler = async (m, { conn, command, usedPrefix, args }) => {

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
  if (!global.db.data.chats[m.chat].whitelist) global.db.data.chats[m.chat].whitelist = [];

  let chat = global.db.data.chats[m.chat];

  if (command === 'addwhitelist' && !args.length) {
    let group = await conn.groupMetadata(m.chat);
    let admins = group.participants.filter(p => p.admin);

    if (!admins.length) return m.reply("⚠️ Nessun admin trovato.");

    let buttons = admins.map(a => ({
      buttonId: `${usedPrefix}addwhitelist ${a.id.split('@')[0]}`,
      buttonText: { displayText: `➕ @${a.id.split('@')[0]}` },
      type: 1
    }));

    let text =
      `📑 *Whitelist Gruppo*\n` +
      `Seleziona un admin da aggiungere:\n\n` +
      admins.map(a => `• @${a.id.split('@')[0]}`).join('\n');

    await conn.sendMessage(
      m.chat,
      {
        text,
        mentions: admins.map(a => a.id),
        buttons,
        headerType: 1
      }
    );

    return;
  }

  if (command === 'addwhitelist') {
    let raw = args.join(' ');
    let cleaned = raw.replace(/[^0-9]/g, '');
    if (!cleaned) return m.reply("⚠️ Numero non valido.");

    let who = cleaned + '@s.whatsapp.net';

    if (chat.whitelist.includes(who)) {
      return m.reply(`✨ L’utente è già nella whitelist.`);
    }

    chat.whitelist.push(who);
    await global.db.write();

    await conn.sendMessage(
      m.chat,
      {
        text:
          `✅ *Utente Autorizzato*\n` +
          `👤 @${who.split('@')[0]}\n\n` +
          `Ora è esente dai controlli antinuke.`,
        contextInfo: { mentionedJid: [who] }
      },
      { quoted: m }
    );

    return;
  }

  if (command === 'delwhitelist') {
    let raw = args.join(' ');
    let cleaned = raw.replace(/[^0-9]/g, '');
    if (!cleaned) return m.reply("⚠️ Numero non valido.");

    let who = cleaned + '@s.whatsapp.net';

    if (!chat.whitelist.includes(who)) {
      return m.reply(`❌ L’utente non è nella whitelist.`);
    }

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