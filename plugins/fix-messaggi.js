//Codice di gp-fix.js

let handler = async (m, { conn }) => {
  if (!m.isGroup) return;

  let keysToClear = {};
  let memoryToClear = {};

  // Dati del bot
  const meJid = conn.user?.id || conn.user?.jid || '';
  const meUser = meJid ? meJid.split(':')[0].split('@')[0] : '';
  const meDevice = meJid.includes(':') ? meJid.split(':')[1].split('@')[0] : '0';

  try {
    // 1. Reset locale delle Sender Keys per la chat corrente
    if (meUser) {
      keysToClear[`${m.chat}::${meUser}::${meDevice}`] = null;
    }
    memoryToClear[m.chat] = null;

    if (conn.authState?.keys?.set) {
      await conn.authState.keys.set({
        'sender-key': keysToClear,
        'sender-key-memory': memoryToClear
      });
    }

    // 2. Forza il recupero dei metadati per risincronizzare i partecipanti
    await conn.groupMetadata(m.chat).catch(() => null);

  } catch (e) {
    console.error('[guardami] Errore reset keys:', e);
    return conn.reply(m.chat, "『 ❌ 』 `Errore:` Impossibile aggiornare le chiavi di sessione.", m);
  }

  // 3. Invia il messaggio standard senza opzioni custom che corrompono la cifratura
  return conn.sendMessage(m.chat, { 
    text: "*Messaggi e sessione di gruppo aggiornati con successo!*" 
  }, { 
    quoted: m 
  });
};

handler.command = ['fix', 'ntevedo', 'guardami'];
handler.tags = ['gruppo'];
handler.help = ['guardami'];
handler.group = true;
handler.admin = false;
handler.botAdmin = false;

export default handler;