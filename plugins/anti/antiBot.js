// Plugin by 888 staff - AntiBot Module

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {

  if (m.fromMe) return true;
  if (!m.isGroup) return false;

  const chat = global.db.data.chats[m.chat];
  if (!chat.antiBot || chat.isBanned) return true;

  if (isAdmin || isOwner || isROwner) return true;
  if (!isBotAdmin) return true;

  const sender = m.sender;
  const text = (m.text || m.caption || '').toString().trim();

  if (!global.botTracker) global.botTracker = {};
  if (!global.botTracker[m.chat]) global.botTracker[m.chat] = {};
  if (!global.botTracker[m.chat][sender]) {
    global.botTracker[m.chat][sender] = {
      lastTime: 0,
      msgCount: 0,
      lastMsg: "",
      repeatCount: 0
    };
  }

  const tracker = global.botTracker[m.chat][sender];

  if (Date.now() - tracker.lastTime < 1200) {
    tracker.msgCount++;
  } else {
    tracker.msgCount = 1;
  }

  tracker.lastTime = Date.now();

  if (tracker.msgCount >= 5) {
    await kickBot(conn, m, sender, "Spam rapido (5 messaggi in <1.2s)");
    return false;
  }

  const suspiciousPatterns = [
    /click here/i,
    /support/i,
    /service/i,
    /auto/i,
    /bot/i,
    /info/i,
    /system/i,
    /verify/i,
    /security/i
  ];

  if (text.length > 300) {
    await kickBot(conn, m, sender, "Messaggio troppo lungo (possibile bot)");
    return false;
  }

  if (suspiciousPatterns.some(r => r.test(text))) {
    await kickBot(conn, m, sender, "Pattern sospetto rilevato");
    return false;
  }

  if (text && text === tracker.lastMsg) {
    tracker.repeatCount++;
    if (tracker.repeatCount >= 3) {
      await kickBot(conn, m, sender, "Messaggi identici ripetuti");
      return false;
    }
  } else {
    tracker.repeatCount = 0;
  }

  tracker.lastMsg = text;

  return true;
}

async function kickBot(conn, m, sender, reason) {
  await conn.sendMessage(m.chat, {
    delete: {
      remoteJid: m.chat,
      fromMe: false,
      id: m.key.id,
      participant: sender
    }
  });

  await conn.sendMessage(m.chat, {
    text: `🤖 *AntiBot attivato*\n\n👤 @${sender.split('@')[0]}\n📝 ${reason}\n⚠️ Utente rimosso`,
    mentions: [sender]
  });

  try {
    await conn.groupParticipantsUpdate(m.chat, [sender], 'remove');
  } catch (e) {
    console.error('[AntiBot] Errore rimozione:', e);
  }
}

export const disabled = false;