//Plugin by elixir

export async function before(m, { isAdmin, isOwner, isROwner }) {
  if (m.fromMe) return true;
  if (m.isBaileys && m.fromMe) return true;
  if (!m.isGroup) return false;

  const chat = global.db.data.chats[m.chat];
  if (!chat?.modoadmin) return false;

  if (isOwner || isROwner || isAdmin) return false;

  const prefix = global.prefix ?? global.opts?.prefix ?? '.';
  const text = (m.text || '').toString();

  if (!text) return false;
  if (prefix instanceof RegExp) return prefix.test(text);
  if (Array.isArray(prefix)) {
    return prefix.some(value => value instanceof RegExp ? value.test(text) : text.startsWith(value));
  }
  return text.startsWith(prefix);
}
