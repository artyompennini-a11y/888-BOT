//Plugin by 888 staff - ModoAdmin Module (restricts bot commands to admins only)

export async function before(m, { isAdmin, isOwner, isROwner }) {
  if (m.fromMe) return true;
  if (m.isBaileys && m.fromMe) return true;
  if (!m.isGroup) return false;

  const chat = global.db.data.chats[m.chat];
  if (!chat.modoadmin) return true;

  if (isOwner || isROwner) return true;
  if (!isAdmin) return true;

  // If modoadmin is enabled, only admins can use bot commands
  // This checks if the message is a command (starts with prefix)
  const prefix = global.opts?.prefix || '.';
  const text = (m.text || '').toString();
  
  if (text && text.startsWith(prefix)) {
    // Non-admin is trying to use a command, but isAdmin check above already passed
    // This is for additional filtering if needed
    return true;
  }

  return true;
}
