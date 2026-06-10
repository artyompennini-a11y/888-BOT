import fetch from 'node-fetch';

let handler = async (m, { args, conn }) => {

  if (!args[0]) {
    return m.reply(`
╭━〔 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏 𝐁𝐀𝐍 𝐂𝐇𝐄𝐂𝐊 〕━╮
┣━━━━━━━━━━━━━━━━━━━━━
┃ 📌 *𝐔𝐬𝐨:* .checkban <numero>
┃ 🌍 *𝐅𝐨𝐫𝐦𝐚𝐭𝐨:* internazionale
┣━━━━━━━━━━━━━━━━━━━━━
┃ ✅ 𝐄𝐬𝐞𝐦𝐩𝐢:
┃ • .checkban 391112224444
┃ • .checkban +39 111 222 4444
┃ • .checkban 347 968 4300
┣━━━━━━━━━━━━━━━━━━━━━
┃ 🤖 𝐈𝐥 𝐛𝐨𝐭 𝐫𝐢𝐦𝐮𝐨𝐯𝐞
┃ 𝐚𝐮𝐭𝐨𝐦𝐚𝐭𝐢𝐜𝐚𝐦𝐞𝐧𝐭𝐞 𝐬𝐩𝐚𝐳𝐢 𝐞 +
╰━━━━━━━━━━━━━━━━━━━━━╯
`.trim());
  }

  let phoneNumber = args.join(' ').trim();

  phoneNumber = phoneNumber.replace(/[\s\-\(\)\+]/g, '');

  if (phoneNumber.startsWith('3') && phoneNumber.length === 10) {
    phoneNumber = '39' + phoneNumber;
  }

  if (!/^\d+$/.test(phoneNumber)) {
    return m.reply(`
╭━〔 ❌ 𝐍𝐔𝐌𝐄𝐑𝐎 𝐈𝐍𝐕𝐀𝐋𝐈𝐃𝐎 〕━╮
┣━━━━━━━━━━━━━━━━━━━━━
┃ 📌 𝐈𝐧𝐬𝐞𝐫𝐢𝐬𝐜𝐢 𝐬𝐨𝐥𝐨 𝐧𝐮𝐦𝐞𝐫𝐢
┃
┃ ✅ 𝐅𝐨𝐫𝐦𝐚𝐭𝐢 𝐚𝐜𝐜𝐞𝐭𝐭𝐚𝐭𝐢:
┃ • 391112224444
┃ • +391112224444
┃ • 347 968 4300
┃ • +39 347 968 4300
╰━━━━━━━━━━━━━━━━━━━━━╯
`.trim());
  }

  if (phoneNumber.length < 10) {
    return m.reply(`
╭━〔 𝐍𝐔𝐌𝐄𝐑𝐎 𝐓𝐑𝐎𝐏𝐏𝐎 𝐂𝐎𝐑𝐓𝐎 〕━╮
┣━━━━━━━━━━━━━━━━━━━━
┃ 📌 𝐈𝐧𝐬𝐞𝐫𝐢𝐬𝐜𝐢 𝐚𝐥𝐦𝐞𝐧𝐨
┃ 𝟏𝟎 𝐜𝐢𝐟𝐫𝐞 𝐯𝐚𝐥𝐢𝐝𝐞
╰━━━━━━━━━━━━━━━━━━━╯
`.trim());
  }

  try {

    await m.reply(`
╭━━〔 🔍 𝐂𝐎𝐍𝐓𝐑𝐎𝐋𝐋𝐎 〕━━╮
┣━━━━━━━━━━━━━━━━━━━
┃ 📱 𝐕𝐞𝐫𝐢𝐟𝐢𝐜𝐚 𝐧𝐮𝐦𝐞𝐫𝐨
┃ 𝐢𝐧 𝐜𝐨𝐫𝐬𝐨 𝐬𝐮 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩...
╰━━━━━━━━━━━━━━━━━━━╯
`.trim());

    const tokenRes = await fetch('https://baron0.com/api/get-token');

    if (!tokenRes.ok) {
      return m.reply(`
╭━━〔 ❌ 𝐄𝐑𝐑𝐎𝐑𝐄 𝐀𝐏𝐈 〕━━╮
┣━━━━━━━━━━━━━━━━━━━
┃ HTTP ${tokenRes.status}
┃ Token non disponibile
╰━━━━━━━━━━━━━━━━━━━╯
`.trim());
    }

    const { token } = await tokenRes.json();

    const response = await fetch('https://baron0.com/check-number', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-page-token': token,
      },
      body: JSON.stringify({
        number: `+${phoneNumber}`
      }),
    });

    if (!response.ok) {
      return m.reply(`
╭━━〔 ❌ 𝐄𝐑𝐑𝐎𝐑𝐄 𝐀𝐏𝐈 〕━━╮
┣━━━━━━━━━━━━━━━━━━━━
┃ HTTP ${response.status}
┃ Endpoint non disponibile
╰━━━━━━━━━━━━━━━━━━━╯
`.trim());
    }

    const data = await response.json();

    const isBanned = data.banned || false;
    const err = data.error || {};

    const status = err.status || 'unknown';
    const reason = err.reason || 'unknown';
    const loginNum = err.login || phoneNumber;

    const methods =
      Array.isArray(err.fallback_methods) &&
      err.fallback_methods.length
        ? err.fallback_methods.join(', ')
        : 'nessuno';

    const autoconf =
      err.autoconf_type != null
        ? err.autoconf_type
        : 'n/a';

    let replyMsg = `╭━〔 📱 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏 𝐒𝐓𝐀𝐓𝐔𝐒 〕━╮
┣━━━━━━━━━━━━━━━━━━━━━
┃ 📞 𝐍𝐮𝐦𝐞𝐫𝐨:
┃ +${loginNum}
┣━━━━━━━━━━━━━━━━━━━━━
`;

if (isBanned) {
  replyMsg += `┃ 🔴 𝐒𝐓𝐀𝐓𝐎: 𝐁𝐀𝐍𝐍𝐀𝐓𝐎
┃ ❌ 𝐍𝐮𝐦𝐞𝐫𝐨 𝐛𝐚𝐧𝐧𝐚𝐭𝐨
┃ 𝐝𝐚 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩
`;
} else {
  replyMsg += `┃ 🟢 𝐒𝐓𝐀𝐓𝐎: 𝐀𝐓𝐓𝐈𝐕𝐎
┃ ✅ 𝐍𝐮𝐦𝐞𝐫𝐨 𝐚𝐭𝐭𝐢𝐯𝐨
┃ 𝐬𝐮 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩
`;
}

replyMsg += `┣━━━━━━━━━━━━━━━━━━━━━
┃ 📊 𝐃𝐄𝐓𝐓𝐀𝐆𝐋𝐈
┣━━━━━━━━━━━━━━━━━━━━━
┃ • 𝐒𝐭𝐚𝐭𝐮𝐬: ${status}
┃ • 𝐌𝐨𝐭𝐢𝐯𝐨: ${reason}
┃ • 𝐀𝐮𝐭𝐡: ${methods}
┃ • 𝐀𝐮𝐭𝐨𝐜𝐨𝐧𝐟: ${autoconf}
┃ • 𝐎𝐫𝐚: ${new Date().toLocaleString('it-IT')}
╰━━━━━━━━━━━━━━━━━━━━━╯`;

m.reply(replyMsg.trim());

  } catch (error) {

    console.error('WhatsApp Ban Check Error:', error);

    m.reply(`
╭━━〔 ❌ 𝐄𝐑𝐑𝐎𝐑𝐄 〕━━╮
┣━━━━━━━━━━━━━━━━━━━
┃ 🌐 𝐄𝐫𝐫𝐨𝐫𝐞 𝐜𝐨𝐧𝐧𝐞𝐬𝐬𝐢𝐨𝐧𝐞
┃
┃ ${error.message}
┃
┃ 🔄 𝐑𝐢𝐩𝐫𝐨𝐯𝐚 𝐩𝐢𝐮̀ 𝐭𝐚𝐫𝐝𝐢
╰━━━━━━━━━━━━━━━━━━━╯
`.trim());
  }
};

handler.help = ['checkban'];
handler.tags = ['tools'];

handler.command =
 /^(checkban|check-ban|controllabn|controllawhatsapp|wa-check|whatsapp-check)$/i;

export default handler;     
