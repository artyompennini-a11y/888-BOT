//Plugin by 888 staff - AntiPrivate Module (blocks DMs silently)

export async function before(m, { conn, isOwner, isRowner, isMods }) {
  if (m.fromMe) return true;
  if (m.isGroup) return false;
  if (!m.message) return true;
  if (isOwner || isRowner || isMods) return false;
  
  const botSettings = global.db.data.settings[this.user.jid] || {};
  if (!botSettings.antiprivato) return true;
  
  // Block contact silently - mark as banned and optionally block at WhatsApp level
  if (typeof global.db.data.users !== 'undefined') {
    global.db.data.users[m.sender] = global.db.data.users[m.sender] || {};
    global.db.data.users[m.sender].banned = true;
    global.db.data.users[m.sender].bannedReason = 'DM bloccato - antiprivato attivo';
    
    // Attempt to block at WhatsApp level if method exists
    if (typeof conn.blockUser === 'function') {
      try {
        await conn.blockUser(m.sender);
      } catch (e) {
        console.error('[anti-privato] blockUser failed:', e.message);
      }
    }
  }
  
  // Empty text to prevent any content processing
  if (typeof m.text === 'string') m.text = '';
  
  return true;
}

const handler = {
  help: ['antiprivato <on/off>'],
  tags: ['owner'],
  command: /^antiprivato$/i,
  owner: true,
  
  async handler(m, { conn, text }) {
    if (text && text !== text.toLowerCase()) {
      return m.reply('❌ Per attivare o disattivare una funzione devi scrivere il comando tutto in minuscolo.', m);
    }

    if (!text) {
      const current = global.db.data.settings[conn.user.jid]?.antiprivato || false;
      return m.reply(`*Antiprivato attuale:* ${current ? '✅ ATTIVATO' : '❌ DISATTIVATO'}`, m);
    }
    
    const isOn = /on|true|attiva/.test(text);
    if (isOn) {
      global.db.data.settings[conn.user.jid] = global.db.data.settings[conn.user.jid] || {};
      global.db.data.settings[conn.user.jid].antiprivato = true;
      await conn.sendMessage(m.chat, { text: '*Antiprivato:* ✅ ATTIVATO\n\nI messaggi privati da non owner verranno bloccati silenziosamente.' });
    } else {
      global.db.data.settings[conn.user.jid] = global.db.data.settings[conn.user.jid] || {};
      global.db.data.settings[conn.user.jid].antiprivato = false;
      await conn.sendMessage(m.chat, { text: '*Antiprivato:* ❌ DISATTIVATO\n\nI messaggi privati non vengono più bloccati automaticamente.' });
    }
  }
};

handler.lowercaseOnly = true;

export default handler;
