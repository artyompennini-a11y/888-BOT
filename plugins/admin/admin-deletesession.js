// Plugin by Elixir, Punisher & 888 staff
import { existsSync, promises as fsPromises } from 'fs';
import path from 'path';

const handler = async (message, { conn }) => {
  try {
    // Usa il nome sessione configurato nel bot (default: 888BotSession)
    const authFolder = global.authFile || '888BotSession';
    const sessionFolder = path.join(process.cwd(), authFolder);
    let deletedCount = 0;
    let statusContent = '';

    if (!existsSync(sessionFolder)) {
      statusContent = 'Directory sessioni non trovata.';
    } else {
      const sessionFiles = await fsPromises.readdir(sessionFolder);

      for (const file of sessionFiles) {
        if (file !== 'creds.json') {
          await fsPromises.unlink(path.join(sessionFolder, file));
          deletedCount++;
        }
      }

      statusContent = deletedCount === 0
        ? 'Cache già pulita.'
        : `Svuotati ${deletedCount} archivi temporanei.`;
    }

    const botName = global.db?.data?.nomedelbot || '𝟴𝟴𝟴 𝗕𝗢𝗧';

    await conn.sendMessage(message.chat, { text: `⚙️ ${botName}: ${statusContent}` });
    return true;
  } catch (error) {
    console.error('Errore deletession:', error);
    await conn.sendMessage(message.chat, { text: '❌ Errore durante la pulizia sessioni.' });
    return true;
  }
};

handler.help = ['.ds'];
handler.tags = ['admin'];
handler.command = /^(deletession|ds|clearallsession)$/i;
handler.admin = true;
handler.owner = true;
handler.private = false;

export default handler;
