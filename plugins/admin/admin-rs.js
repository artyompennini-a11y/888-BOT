// Plugin by Elixir, Punisher & 888 staff
import { existsSync, promises as fsPromises } from 'fs';
import path from 'path';

const handler = async (message, { conn }) => {
  try {
    const authFolder = global.authFile || '888BotSession';
    const sessionFolder = path.join(process.cwd(), authFolder);
    let deletedCount = 0;
    let skippedCount = 0;
    const removedFiles = [];

    console.log(`\n[SESSION CLEANUP] Inizio pulizia sessione: ${authFolder}`);

    if (!existsSync(sessionFolder)) {
      const statusContent = '⚠️ Session folder non trovata o non ancora creata.';
      console.warn(`[SESSION CLEANUP] Cartella non trovata: ${sessionFolder}`);
      await conn.sendMessage(message.chat, { text: `⚙️ ${global.db?.data?.nomedelbot || '𝟴𝟴𝟴 𝗕𝗢𝗧'}: ${statusContent}` });
      return true;
    }

    const sessionFiles = await fsPromises.readdir(sessionFolder);

    for (const file of sessionFiles) {
      const fullPath = path.join(sessionFolder, file);
      if (file === 'creds.json') {
        skippedCount++;
        continue;
      }

      await fsPromises.unlink(fullPath);
      removedFiles.push(file);
      deletedCount++;
    }

    const botName = global.db?.data?.nomedelbot || '888 𝗕𝗢𝗧';

    console.log(`[SESSION CLEANUP] Cartella: ${sessionFolder}`);
    console.log(`[SESSION CLEANUP] File rimossi: ${deletedCount}`);
    console.log(`[SESSION CLEANUP] File preservati: ${skippedCount}`);
    if (removedFiles.length > 0) {
      console.log(`[SESSION CLEANUP] File eliminati: ${removedFiles.join(', ')}`);
    }

    const statusContent = deletedCount === 0
      ? '🧹 Sessione già pulita. Nessun file temporaneo da rimuovere.'
      : `🧹 Sessione pulita con successo. File rimossi: ${deletedCount}.`;

    await conn.sendMessage(message.chat, {
      text: `⚙️ *${botName}*\n${statusContent}\n\n📌 Preservati: ${skippedCount} file di sicurezza.`
    });
    return true;
  } catch (error) {
    console.error('[SESSION CLEANUP] Errore durante la pulizia:', error);
    await conn.sendMessage(message.chat, {
      text: '❌ *Session cleanup fallito*\nImpossibile completare la pulizia dei file temporanei.'
    });
    return true;
  }
};

handler.help = ['.rs'];
handler.tags = ['admin'];
handler.command = /^rs$/i;
handler.admin = true;
handler.owner = true;
handler.private = false;

export default handler;
