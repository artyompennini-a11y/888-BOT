//Plugin by Gab, Lucifero & 888 staff - AntiMedia Module (blocks risky media)

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
  if (m.fromMe) return true;
  if (m.isBaileys && m.fromMe) return true;
  if (!m.isGroup) return false;

  const chat = global.db.data.chats[m.chat];
  if (!chat.antimedia || chat.isBanned) return true;

  if (isAdmin || isOwner || isROwner) return true;
  if (!isBotAdmin) return true;

  // Check for high-risk media types
  const mtype = m.mtype || '';
  const riskyTypes = ['documentMessage', 'videoMessage'];
  
  if (!riskyTypes.includes(mtype)) return true;

  const fileName = (m.msg?.document?.fileName || '').toLowerCase();
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.msi', '.scr', '.pif', '.jar', '.dll', '.vbs', '.ps1', '.js', '.wsf'];
  
  const hasDangerousExt = dangerousExtensions.some(ext => fileName.endsWith(ext));
  const isExecutable = m.message?.documentMessage?.mimetype?.startsWith('application/');

  if (hasDangerousExt || isExecutable) {
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.sender
      }
    });

    await conn.sendMessage(m.chat, {
      text: `🚫 *AntiMedia attivato*\n\n👤 @${m.sender.split('@')[0]}\n📝 File potenzialmente pericoloso rimosso`,
      mentions: [m.sender]
    });

    return false;
  }

  return true;
}
