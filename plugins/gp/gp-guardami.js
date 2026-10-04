//Plugin by Elixir, Punisher & 888 staff

let handler = async (m, { conn }) => {
  if (!m.isGroup) return;

  let keysToClear = {};
  let memoryToClear = {};


  const meJid = conn.user?.id || conn.user?.jid || '';
  const meUser = meJid ? meJid.split(':')[0].split('@')[0] : '';
  const meDevice = meJid.includes(':') ? meJid.split(':')[1].split('@')[0] : '0';

  try {

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


    await conn.groupMetadata(m.chat).catch(() => null);

  } catch (e) {
    console.error('[guardami] Errore reset keys:', e);
    return conn.reply(m.chat, "『 ❌ 』 `Errore:` Impossibile aggiornare le chiavi di sessione.", m);
  }

  return conn.sendMessage(m.chat, { 
    text: "*Messaggi e sessione di gruppo aggiornati con successo!*" 
  }, { 
    quoted: m 
  });
};

handler.command = ['rs', 'ntevedo', 'guardami'];
handler.tags = ['gruppo'];
handler.help = ['guardami'];
handler.group = true;
handler.admin = false;
handler.botAdmin = false;

export default handler;
