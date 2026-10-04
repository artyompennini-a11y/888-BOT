// Plugin by elixir, punisher & 888 staff
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(PLUGIN_DIR, '..', '..');
const BOT_ENTRY = join(ROOT_DIR, '888.js');

// true se il bot e' partito da index.js (worker di cluster), false se gia' "node 888.js"
const isClusterWorker = () => typeof process.send === 'function';

// Avvio diretto di "node 888.js": salta index.js, quindi niente animazione iniziale.
// Usato solo quando il bot NON e' un worker di cluster (stdio e' gia' il TTY reale).
const spawnBot = () => new Promise((resolve, reject) => {
    try {
        const child = spawn(process.execPath, [BOT_ENTRY, ...process.argv.slice(2)], {
            cwd: process.cwd(),
            stdio: 'inherit',
            windowsHide: false,
            env: { ...process.env, SUPPRESS_BANNER: 'true' }
        });

        child.once('error', reject);

        child.once('spawn', () => {
            child.unref();
            resolve(true);
        });
    } catch (error) {
        reject(error);
    }
});

const handler = async (m, { conn, isOwner }) => {
    if (!isOwner) 
        return m.reply("❌ Solo il proprietario può usare questo comando.");

    if (global.__restarting)
        return m.reply("⏳ Riavvio già in corso, attendi qualche secondo.");

    global.__restarting = true;

    try {
        const { key } = await conn.sendMessage(m.chat, {
            text: `🔄 *Riavvio in corso...*\n⏱️ Attendi qualche secondo.\n\n> 888 BOT restart`
        }, { quoted: m });

        await delay(1000);

        await conn.sendMessage(m.chat, {
            text: '🚀🚀🚀🚀',
            edit: key
        });

        await delay(1000);

        await conn.sendMessage(m.chat, {
            text: `⚙️ *Avvio procedura...*\n🔃 Riavvio diretto con \`node 888.js\`.\n\n> 888 BOT restart`,
            edit: key
        });

        await delay(1000);

        await conn.sendMessage(m.chat, {
            text: `✅ *Riavvio completato!*\n🟢 Bot online a breve.\n\n> 888 BOT restart`,
            edit: key
        });

        await delay(1000);

        if (isClusterWorker()) {
            // index.js gestisce il codice 43 riavviando con "node 888.js" (senza animazione).
            // Sta al master decidere: da qui lo stdout non e' un TTY reale.
            process.exit(43);
        }

        // Bot gia' avviato come "node 888.js": riavvio diretto, stdio = TTY reale.
        await spawnBot();

        process.exit(0);

    } catch (error) {
        global.__restarting = false;
        m.reply(`❌ Errore durante il riavvio: ${error.message}`);
    }
};

handler.help = ['riavvia', 'restart'];
handler.tags = ['owner'];
handler.command = /^(riavvia|restart)$/i;
handler.owner = true;

export default handler;
