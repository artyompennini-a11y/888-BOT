//Plugin fatto da Axtral_WiZaRd

export async function before(
  m,
  { conn, isAdmin, isBotAdmin, isOwner, isROwner }
) {
  if (m.fromMe && m.isBaileys) return true;
  if (m.isGroup) return false;
  if (!m.message) return true;

  let chat = global.db.data.chats[m.chat];
  let botSettings =
    global.db.data.settings[this.user.jid] || {};

  if (
    botSettings.antiPrivate &&
    !isOwner &&
    !isROwner
  ) {
    await this.updateBlockStatus(
      m.chat,
      'block'
    );
  }

  return false;
}
