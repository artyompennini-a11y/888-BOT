// Plugin by Elixir
const tag = (jid = '') => '@' + String(jid).split('@')[0].split(':')[0];

function buildContextMsg(title) {
  return {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: 'CTX'
    },
    message: {
      locationMessage: {
        name: title
      }
    },
    participant: '0@s.whatsapp.net'
  };
}

function resolveTarget(m, text = '', botJid = '') {
  const ctx = m.message?.extendedTextMessage?.contextInfo || {};

  const numero = String(text || '').replace(/[^\d]/g, '');
  if (numero.length >= 5) return numero + '@s.whatsapp.net';

  if (String(text || '').endsWith('@s.whatsapp.net') || String(text || '').endsWith('@c.us')) {
    return String(text).trim();
  }

  if (Array.isArray(m.mentionedJid) && m.mentionedJid.length) return m.mentionedJid[0];
  if (Array.isArray(ctx.mentionedJid) && ctx.mentionedJid.length) return ctx.mentionedJid[0];

  const quotedSender = m.quoted?.sender || m.quoted?.participant || ctx.participant;
  if (quotedSender && quotedSender !== botJid) return quotedSender;

  return null;
}

let handler = async (m, { conn, text, usedPrefix, command, isGroup }) => {
  const chat = m.chat || m.key?.remoteJid;
  if (!chat) return;

  // Limita ai gruppi se serve (come il comando bacio originale)
  if (isGroup === false && !chat.endsWith('@g.us')) {
    return conn.sendMessage(chat, {
      text: '*⚠️ Questo comando funziona solo nei gruppi 🔥🍋*',
      contextInfo: global.rcanal?.contextInfo || {}
    }, { quoted: buildContextMsg('*🔥 𝐋𝐈𝐌𝐎𝐍𝐀 𝐀𝐏𝐏𝐀𝐒𝐒𝐎𝐍𝐀𝐓𝐎*') });
  }

  const sender = String(
    m.sender ||
    m.key?.participant ||
    m.participant ||
    (m.key?.fromMe ? conn?.user?.id : '')
  );

  const botJid = conn.user?.jid || conn.user?.id || '';
  const target = resolveTarget(m, text, botJid);
  const q = buildContextMsg('*🔥 𝐋𝐈𝐌𝐎𝐍𝐀 𝐀𝐏𝐏𝐀𝐒𝐒𝐎𝐍𝐀𝐓𝐎*');

  if (!target) {
    return conn.sendMessage(chat, {
      text: '*⚠️ Devi menzionare qualcuno o rispondere a un messaggio per limonare qualcuno 🔥*\n\n*Esempio:*\n*' + usedPrefix + command + ' @utente*',
      contextInfo: global.rcanal?.contextInfo || {}
    }, { quoted: q });
  }

  if (target === sender) {
    return conn.sendMessage(chat, {
      text: '*🔥 ' + tag(sender) + ' sei cosi bello che hai fatto un sguardo a te stesso... 🔥*',
      contextInfo: {
        ...(global.rcanal?.contextInfo || {})
      },
      mentions: [sender],
      quoted: q
    });
  }

  const senderNumero = String(sender).split('@')[0].split(':')[0];

  await conn.sendMessage(chat, {
    text: '*🔥 ' + tag(sender) + ' ha scoperto la sua passione per ' + tag(target) + '... lo limona appassionatamente🔥*',
    contextInfo: {
      ...(global.rcanal?.contextInfo || {})
    },
    mentions: [sender, target],
    buttons: [
      {
        buttonId: usedPrefix + command + ' ' + senderNumero,
        buttonText: { displayText: '🔥 Ricambia la passione con la limona appassionata' },
        type: 1
      }
    ],
    headerType: 1
  }, { quoted: q });
};

handler.help = ['limona @user 🔥'];
handler.tags = ['fun'];
handler.command = ['limona'];
handler.group = true;

export default handler;
