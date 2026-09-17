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
      const statusContent = '⚠️ La cartella sessione non è stata trovata.';
      console.warn(`[SESSION CLEANUP] Cartella non trovata: ${sessionFolder}`);

      await conn.sendMessage(message.chat, { 
        text: `⚙️ *${global.db?.data?.nomedelbot || '888 BOT'}*\n${statusContent}`
      });

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

    const botName = global.db?.data?.nomedelbot || '888 BOT';

    console.log(`[SESSION CLEANUP] Cartella: ${sessionFolder}`);
    console.log(`[SESSION CLEANUP] File rimossi: ${deletedCount}`);
    console.log(`[SESSION CLEANUP] File preservati: ${skippedCount}`);
    if (removedFiles.length > 0) {
      console.log(`[SESSION CLEANUP] File eliminati: ${removedFiles.join(', ')}`);
    }

    const statusContent =
      deletedCount === 0
        ? '🧹 Nessun file temporaneo da rimuovere. Sessione già pulita.'
        : `🧹 Pulizia completata. File rimossi: *${deletedCount}*.`;

    await conn.sendMessage(message.chat, {
      text: `⚙️ *${botName}*\n${statusContent}\n\n📌 File preservati: *${skippedCount}*`
    });

    return true;

  } catch (error) {
    console.error('[SESSION CLEANUP] Errore durante la pulizia:', error);

    await conn.sendMessage(message.chat, {
      text: `❌ *Pulizia fallita*\nErrore durante la rimozione dei file temporanei.`
    });

    return true;
  }
};

handler.help = ['rs'];
handler.tags = ['admin'];
handler.command = /^rs$/i;
handler.admin = true;
handler.owner = true;
handler.private = false;

export default handler;
