/**
 * Mio Bot WhatsApp - Powered by 888Baileys
 */

// Importa 888Baileys (locale o da link)
const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    extractPhoneNumberFromJid,
    isJidGroup,
    isJidUser,
    delay 
} = require('888baileys');

const pino = require('pino');
const qrcode = require('qrcode-terminal');

// === CONFIGURAZIONE ===
const PREFIX = '!';
const OWNER_NUMBER = '391234567890'; // <-- Cambia con il tuo numero (senza +)

let sock;

// === AVVIO BOT ===
async function startBot() {
    console.log('Avvio bot...');

    // 1. Carica sessione
    const { state, saveCreds } = await useMultiFileAuthState('./auth_session');

    // 2. Crea socket WhatsApp
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ['MioBot', 'Chrome', '1.0.0'],
        keepAliveIntervalMs: 30000,
        syncFullHistory: false,
    });

    // 3. Salva credenziali
    sock.ev.on('creds.update', saveCreds);

    // 4. Gestione connessione
    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.log('Scansiona il QR code con WhatsApp!');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') {
            console.log('Bot connesso e online!');
        }
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code !== DisconnectReason.loggedOut) {
                console.log('Riconnessione in 5 secondi...');
                setTimeout(startBot, 5000);
            } else {
                console.log('Disconnesso. Riavvia per riconnetterti.');
            }
        }
    });

    // 5. Ricezione messaggi
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        const phone = extractPhoneNumberFromJid(jid) || 'sconosciuto';
        const pushName = msg.pushName || 'Utente';
        const text = getMessageText(msg);

        if (!text) return;
        console.log(`[${pushName} (${phone})]: ${text}`);

        // === GESTIONE COMANDI ===
        if (text.startsWith(PREFIX)) {
            const cmd = text.slice(PREFIX.length).trim().split(' ')[0].toLowerCase();
            const args = text.trim().split(' ').slice(1);
            await handleCommand(jid, msg, cmd, args, pushName, phone);
        }
    });

    // 6. Benvenuto gruppi
    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        if (action === 'add') {
            for (const p of participants) {
                await sock.sendMessage(id, { 
                    text: `Benvenuto nel gruppo! @${p.split('@')[0]}`, 
                    mentions: [p] 
                });
            }
        }
    });

    return sock;
}

// === COMANDI ===
async function handleCommand(jid, msg, cmd, args, pushName, phone) {
    const isGroup = isJidGroup(jid);

    switch (cmd) {
        case 'ping':
            await sock.sendMessage(jid, { text: 'Pong! Bot attivo' });
            break;

        case 'info':
            await sock.sendMessage(jid, {
                text: `*Info Bot*\n\nNome: MioBot\nLibreria: 888Baileys\nIl tuo JID: ${jid}\nTelefono: ${phone}`
            });
            break;

        case 'id':
            await sock.sendMessage(jid, { text: `Il tuo ID:\n${jid}` });
            break;

        case 'echo':
            await sock.sendMessage(jid, { text: args.join(' ') || 'Niente da ripetere' });
            break;

        case 'membri':
            if (!isGroup) {
                return sock.sendMessage(jid, { text: 'Funziona solo nei gruppi!' });
            }
            const meta = await sock.groupMetadata(jid);
            await sock.sendMessage(jid, {
                text: `*${meta.subject}*\nMembri: ${meta.participants.length}`
            });
            break;

        case 'sticker':
            if (msg.message.imageMessage) {
                await sock.sendMessage(jid, { text: 'Creazione sticker...' });
                // Qui andrà la logica per creare sticker
            } else {
                await sock.sendMessage(jid, { text: 'Invia un\'immagine con caption !sticker' });
            }
            break;

        case 'help':
        case 'menu':
            await sock.sendMessage(jid, {
                text: `*Comandi disponibili*\n\n${PREFIX}ping - Test\n${PREFIX}info - Info bot\n${PREFIX}id - Il tuo ID\n${PREFIX}echo [testo] - Ripete\n${PREFIX}membri - Info gruppo\n${PREFIX}sticker - Crea sticker\n${PREFIX}help - Questo menu`
            });
            break;

        default:
            await sock.sendMessage(jid, { text: `Comando sconosciuto: ${cmd}\nScrivi ${PREFIX}help` });
    }
}

// === UTILITY ===
function getMessageText(msg) {
    const m = msg.message;
    if (!m) return null;
    return m.conversation 
        || m.extendedTextMessage?.text 
        || m.imageMessage?.caption 
        || m.videoMessage?.caption;
}

// === AVVIA ===
startBot().catch(err => console.error('Errore:', err));

// Chiusura pulita
process.on('SIGINT', () => {
    console.log('\nChiusura bot...');
    process.exit(0);
});
