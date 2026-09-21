// Plugin by Elixir
const MAX_MESSAGES_PER_CHAT = 150;
const initPurgeHistoryListener = () => {
  if (global.purgeClearListenerSet) return;
  global.purgeClearListenerSet = true;
  if (!global.purgeClearHistory) global.purgeClearHistory = {};
  const attach = () => {
    if (!global.conn?.ev?.on) return false;
    global.conn.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        try {
          if (!msg?.key?.remoteJid) continue;
          const chat = msg.key.remoteJid;
          if (!global.purgeClearHistory[chat]) {
            global.purgeClearHistory[chat] = [];
          }
          const inMemory = global.purgeClearHistory[chat];
          if (!inMemory.some(item => item.key?.id === msg.key?.id)) {
            inMemory.push(msg);
            if (inMemory.length > MAX_MESSAGES_PER_CHAT) {
              inMemory.splice(0, inMemory.length - MAX_MESSAGES_PER_CHAT);
            }
          }
        } catch (e) {
          console.error('[gp-purge] Errore nel salvataggio messaggi:', e);
        }
      }
    });
    return true;
  };
  if (!attach()) {
    const interval = setInterval(() => {
      if (attach()) clearInterval(interval);
    }, 1000);
  }
};
initPurgeHistoryListener();
let handler = async (m, { conn, text, isGroup, isAdmin, isROwner, usedPrefix, command }) => {
  // Verifica se è un gruppo controllando direttamente il chat
  const chatId = m.chat;
  const isGroupChat = chatId.endsWith('@g.us');
  
  if (!isGroupChat) {
    return m.reply('⚠️ Questo comando funziona solo nei gruppi.');
  }
  
  // Usa i permessi forniti dal sistema handler (calcolati correttamente da Baileys)
  if (!isAdmin && !isROwner) {
    return m.reply('❌ Solo admin o proprietario del bot possono usare questo comando.');
  }
  
  if (!text || isNaN(text)) {
    return m.reply(`🧹 𝐂𝐎𝐌𝐀𝐍𝐃𝐎 𝐏𝐔𝐑𝐆𝐄
❌ Devi specificare il numero di messaggi da eliminare!
📌 Utilizzo:
• ${usedPrefix + command} 5
• ${usedPrefix + command} 10
• ${usedPrefix + command} 100
⚠️ Massimo 100 messaggi per volta
📝 I messaggi vengono eliminati dal più recente`);
  }
  let count = parseInt(text);
  if (count <= 0) {
    return m.reply("❌ Il numero deve essere maggiore di 0!");
  }
  if (count > 100) {
    return m.reply("❌ Il massimo è 100 messaggi per volta!");
  }
  try {
    let messages = (global.purgeClearHistory && global.purgeClearHistory[m.chat]) || [];
    if (!messages || messages.length === 0) {
      const chatData = conn?.chats?.[m.chat] || global.conn?.chats?.[m.chat];
      if (chatData?.messages) {
        messages = Object.values(chatData.messages);
      } else if (Array.isArray(conn?.messages?.[m.chat])) {
        messages = conn.messages[m.chat];
      } else if (Array.isArray(global.store?.messages?.[m.chat])) {
        messages = global.store.messages[m.chat];
      }
    }
    if (!messages || messages.length === 0) {
      return m.reply("❌ Non ci sono messaggi da eliminare nella memoria!");
    }
    const recentMessages = messages.slice(-count);
    if (recentMessages.length === 0) {
      return m.reply(`❌ Non ci sono abbastanza messaggi da eliminare! (Disponibili: ${messages.length})`);
    }
    let deleted = 0;
    for (const message of recentMessages) {
      try {
        if (message && message.key) {
          await conn.sendMessage(m.chat, { delete: message.key });
          deleted++;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (err) {
        console.error(`[gp-purge] Errore nell'eliminazione del messaggio:`, err);
      }
    }
    if (deleted > 0) {
      await conn.sendMessage(m.chat, { 
        text: `✅ *MESSAGGI ELIMINATI (PURGE)*\n\n📊 Eliminati: *${deleted}/${count}* messaggi\n🧹 La chat è stata ripulita!`
      }, { quoted: m });
    } else {
      m.reply("❌ Nessun messaggio è stato eliminato!");
    }
  } catch (err) {
    console.error("[gp-purge] Errore nel comando purge:", err);
    m.reply("❌ Errore durante l'eliminazione dei messaggi!");
  }
};
handler.help = ['purge <numero>'];
handler.tags = ['admin', 'group'];
handler.command = /^purge$/i;
handler.admin = true;
handler.botAdmin = true;
export default handler;