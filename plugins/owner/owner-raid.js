import { generateWAMessageFromContent } from '@chatunity/baileys';
import { isZushiBotAdmin, isZushiGroupAdmin, cleanJid } from '../lib/ZushiPerms.js';

global.pizzoLoops ||= new Map();

export default {
  name: 'payment',
  aliases: ['pizzo', 'finepizzo'],
  description: 'Spamma richieste di pagamento con hidetag finché non viene fermato con .finepizzo',

  async run({ sock, msg, from, sender, command, args, sendText }) {
    if (!from.endsWith('@g.us')) {
      return sendText('Questo comando si può usare solo nei gruppi.');
    }

    const cleanedSender = cleanJid(sender);
    const isGrpAdm = await isZushiGroupAdmin(sock, from, cleanedSender);
    const isBotAdm = isZushiBotAdmin(cleanedSender);

    if (!isGrpAdm && !isBotAdm) {
      return sendText('❌ Solo gli amministratori del gruppo o del bot possono usare questo comando.');
    }

    const cmd = command.toLowerCase();

    if (cmd === 'finepizzo') {
      if (!global.pizzoLoops.has(from)) {
        return sendText('⚠️ Non c\'è nessun attacco payment in corso in questo gruppo.');
      }

      clearInterval(global.pizzoLoops.get(from));
      global.pizzoLoops.delete(from);
      return sendText('🛑 *Spam Payment Terminato.*');
    }

    if (global.pizzoLoops.has(from)) {
      return sendText('⚠️ C\'è già uno spam payment attivo in questo gruppo. Usa *.finepizzo* per fermarlo.');
    }

    const text = args.join(' ');
    if (!text) {
      return sendText('⚠️ Specifica un testo da inviare.\n\nEsempio: *.payment ciao*');
    }

    sendText('🚀 *Spam Payment Avviato*\n\n> Usa *.finepizzo* per fermarlo.');

    const sendPaymentSpam = async () => {
      try {
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants.map(p => p.id);

        const paymentMsg = generateWAMessageFromContent(from, {
          requestPaymentMessage: {
            currencyCodeIso4217: 'EUR',
            amount1000: 1000,
            requestFrom: sender,
            noteMessage: {
              extendedTextMessage: {
                text: text,
                contextInfo: {
                  mentionedJid: participants
                }
              }
            },
            expiryTimestamp: 0
          }
        }, { userJid: sock.user.id });

        await sock.relayMessage(from, paymentMsg.message, { messageId: paymentMsg.key.id });
      } catch (err) {
        console.error('[PAYMENT SPAM] Errore invio:', err);
      }
    };

    await sendPaymentSpam();

    const intervalId = setInterval(async () => {
      await sendPaymentSpam();
    }, 1500);

    global.pizzoLoops.set(from, intervalId);
  }
};