//Plugin by 888 staff - AntiBot Module

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
  if (m.fromMe) return true;
  if (m.isBaileys && m.fromMe) return true;
  if (!m.isGroup) return false;

  const chat = global.db.data.chats[m.chat];
  if (!chat.antiBot || chat.isBanned) return true;

  if (isAdmin || isOwner || isROwner) return true;
  if (!isBotAdmin) return true;

  // Detect if sender is a bot/automated account
  const sender = m.sender || '';
  const isBotPattern = /bot|cat|auto|service|support|info/i.test(sender.split('@')[0]);
  
  // Check if account has been registered recently (new accounts are often bots)
  const user = global.db.data.users[m.sender] || {};
  const accountAge = user.registeredAt ? Date.now() - new Date(user.registeredAt).getTime() : Infinity;
  const isNewAccount = accountAge < 7 * 24 * 60 * 60 * 1000; // Less than 7 days

  if (isBotPattern && isNewAccount) {
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.sender
      }
    });

    await conn.sendMessage(m.chat, {
      text: `🤖 *AntiBot attivato*\n\n👤 @${m.sender.split('@')[0]}\n📝 Account bot rilevato e rimosso`,
      mentions: [m.sender]
    });

    try {
      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
    } catch (e) {
      console.error('[antiBot] Errore rimozione:', e);
    }

    return false;
  }

  // Detect if message is automated (identical content repeated quickly)
  if (!global.botTracker) global.botTracker = {};
  if (!global.botTracker[m.chat]) global.botTracker[m.chat] = {};
  if (!global.botTracker[m.chat][m.sender]) {
    global.botTracker[m.chat][m.sender] = { lastMsg: '', lastTime: 0, count: 0 };
  }

  const tracker = global.botTracker[m.chat][m.sender];
  const text = (m.text || m.caption || '').toString().toLowerCase().trim();

  if (text && text === tracker.lastMsg && Date.now() - tracker.lastTime < 3000) {
    tracker.count++;
    if (tracker.count >= 3) {
      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: m.key.id,
          participant: m.sender
        }
      });

      await conn.sendMessage(m.chat, {
        text: `🤖 *AntiBot attivato*\n\n👤 @${m.sender.split('@')[0]}\n📝 Messaggio automatizzato rilevato`,
        mentions: [m.sender]
      });

      try {
        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
      } catch (e) {
        console.error('[antiBot] Errore rimozione:', e);
      }

      return false;
    }
  } else {
    tracker.count = 1;
  }

  tracker.lastMsg = text;
  tracker.lastTime = Date.now();

  return true;
}
