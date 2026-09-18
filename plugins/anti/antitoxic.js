function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const toxicWords = [
  'coglione', 'cog**', 'cog*', 'cog.d', 'cog.',
  'stronzo', 'stronz*', 'stron.',
  'vaffanculo', 'vaffa', 'vaffancu',
  'bastardo', 'bastard*',
  'puttana', 'puttan*',
  'stupido', 'stupid*',
  'idiota', 'idiot*',
  'pezzo di merda', 'pezzo di merd*',
  'coglioni', 'coglion*',
  'stronzata', 'stronzat*',
  'merda', 'merd*',
  'fano', 'fanno', 'fanculo',
  'minchia', 'minchi*',
  'cogl.*',
  'vaffancu*'
];

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
  if (m.fromMe) return true;
  if (m.isBaileys && m.fromMe) return true;
  if (!m.isGroup) return false;

  const chat = global.db.data.chats[m.chat];
  if (!chat.antitoxic || chat.isBanned) return true;

  if (isAdmin || isOwner || isROwner) return true;
  if (!isBotAdmin) return true;

  let text =
    m.text ||
    m.caption ||
    (m.message && (
      m.message.conversation ||
      (m.message.extendedTextMessage && m.message.extendedTextMessage.text)
    )) ||
    '';

  text = text.toString();
  if (!text) return true;

  const lowered = text.toLowerCase();

  for (const word of toxicWords) {
    const pattern = new RegExp(escapeRegex(word), 'i');
    if (pattern.test(lowered)) {

      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: m.key.id,
          participant: m.sender
        }
      });

      await conn.sendMessage(m.chat, {
        text: `⚠️ *Antitossico attivato*\n\n👤 @${m.sender.split('@')[0]}\n📝 Messaggio con contenuto tossico rimosso`,
        mentions: [m.sender]
      });

      return false;
    }
  }

  return true;
}