let handler = async (m, { conn, command }) => {
  if (!m.isGroup) return m.reply('❌ Questo comando funziona solo nei gruppi.');

  if (!global.db?.data) global.db = { data: { chats: {} } };
  if (!global.db.data.chats) global.db.data.chats = {};
  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};

  if (command === 'includitop') {
    global.db.data.chats[m.chat].excludeFromTop = false;
    return m.reply('✅ *Questo gruppo è stato reinserito nella TOP.*');
  }

  global.db.data.chats[m.chat].excludeFromTop = true;
  return m.reply('✅ *Questo gruppo è stato escluso dalla TOP GRUPPI.*\nNon apparirà più nella classifica.');
};

handler.command = /^(escluditop|includitop)$/i;
handler.group = true;
handler.admin = true;
handler.tags = ['admin', 'gruppo', 'info'];
handler.help = [
  'escluditop - esclude questo gruppo dalla top gruppi',
  'includitop - reinserisce questo gruppo nella top gruppi'
];

export default handler;
