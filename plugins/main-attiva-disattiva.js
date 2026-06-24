//Plugin by Elixir & 888 staff

import fetch from 'node-fetch';
import fs from 'fs';

let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {
  const userName = m.pushName || 'Utente';

  const imgBuffer = fs.readFileSync('icone/888.jpg');

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: '888Attiva'
    },
    message: {
      locationMessage: {
        name: '🤖 888 BOT • Sginal Control',
        jpegThumbnail: imgBuffer.toString('base64'),
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;333;;;\nFN:333\nEND:VCARD'
      }
    },
    participant: '0@s.whatsapp.net'
  }

  let isEnable = /true|enable|attiva|(turn)?on|1/i.test(command);
  if (/disable|disattiva|off|0/i.test(command)) isEnable = false;

  global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {};
  global.db.data.users[m.sender] = global.db.data.users[m.sender] || {};
  let chat = global.db.data.chats[m.chat];
  let user = global.db.data.users[m.sender];
  let bot = global.db.data.settings[conn.user.jid] || {};

  const catalogs = {
    security: ['antilink', 'antiporno', 'modoadmin','antispam','antimedia','antitoxic','antiBot','antivoip','antioneview','antitrava','antibusiness','slowmode','antinuke'],
    protezione: ['antispam', 'antitoxic', 'antiBot', 'antivoip', 'antioneview', 'antitrava', 'antibusiness'],
    media: ['antimedia', 'antiporno', 'antigore'],
    full: ['antilink', 'antiporno', 'antigore', 'antispam', 'antitoxic', 'antiBot', 'antivoip', 'antioneview', 'antimedia', 'antilinktg', 'antilinkig', 'antilinktiktok', 'modoadmin', 'antitrava', 'antibusiness', 'slowmode', 'antinuke']
  };

  const adminFeatures = [
    { key: 'welcome', name: 'Welcome', desc: 'Messaggio di benvenuto' },
    { key: 'antinuke', name: 'AntiNuke', desc: 'Protezione totale del gruppo (Anti-Nuke)' },
    { key: 'antimedia', name: 'AntiMedia', desc: 'Blocca foto e video a più visual' },
    { key: 'goodbye', name: 'Addio', desc: 'Messaggio di addio' },
    { key: 'antispam', name: 'Antispam', desc: 'Antispam' },
    { key: 'antibusiness', name: 'AntiBusiness', desc: 'Rimuove account business non admin' },
    { key: 'antitrava', name: 'AntiTrava', desc: 'Blocca messaggi trava e crash' },
    { key: 'antitoxic', name: 'Antitossici', desc: 'Avverte e rimuove per parolacce/insulti' },
    { key: 'antiBot', name: 'Antibot', desc: 'Rimuove eventuali bot indesiderati' },
    { key: 'antioneview', name: 'Antiviewonce', desc: 'Antiviewonce' },
    { key: 'rileva', name: 'Rileva', desc: 'Rileva events gruppo' },
    { key: 'antiporn', name: 'Antiporno', desc: 'Antiporno' },
    { key: 'antigore', name: 'Antigore', desc: 'Antigore' },
    { key: 'logrichieste', name: 'LogRichieste', desc: 'Messaggi di join request anti-spam' },
    { key: 'modoadmin', name: 'Soloadmin', desc: 'Solo gli admin possono usare i comandi' },
    { key: 'slowmode', name: 'Slowmode', desc: 'Limita i messaggi troppo ravvicinati' },
    { key: 'ai', name: 'IA', desc: 'Intelligenza artificiale' },
    { key: 'vocali', name: 'Siri', desc: 'Risponde con audio agli audio e msg ricevuti' },
    { key: 'antivoip', name: 'Antivoip', desc: 'Antivoip' },
    { key: 'antilinktg', name: 'AntiTelegram', desc: 'Blocca link Telegram con espulsione immediata' },
    { key: 'antilinkig', name: 'AntiInstagram', desc: 'Blocca link Instagram con warn' },
    { key: 'antilinktiktok', name: 'AntiTikTok', desc: 'Blocca link TikTok con warn' },
    { key: 'antilink', name: 'antilink', desc: 'antilink whatsapp' },
    { key: 'reaction', name: 'Reazioni', desc: 'Reazioni automatiche' },
    { key: 'bestemmiometro', name: 'Bestemmiometro', desc: 'Rileva e conta le bestemmie' }
  ];

  const ownerFeatures = [
    { key: 'antiprivato', name: 'Antiprivato', desc: 'Blocca chiunque scrive in pv al bot' },
    { key: 'soloCreatore', name: 'Solocreatore', desc: 'Solo il creatore puo usare i comandi' },
    { key: 'jadibotmd', name: 'Subbots', desc: 'Subbots' },
    { key: 'read', name: 'Lettura', desc: 'Il bot legge automaticamente i messaggi' },
    { key: 'anticall', name: 'Antichiamate', desc: 'Rifiuta automaticamente le chiamate' }
  ];

  const toggleFeature = (type) => {
    let result = { type, status: '', success: false };
    const adminCheck = m.isGroup && !(isAdmin || isOwner || isROwner);
    const ownerOnly = !isOwner && !isROwner;

    const adminGuard = () => { result.status = 'Azione consentita solo agli amministratori.'; };
    const ownerGuard = () => { result.status = 'Azione riservata esclusivamente al proprietario.'; };
    const groupGuard = () => { result.status = 'Questo comando può essere usato solo nei gruppi.'; };

    const setChat = (key) => {
      if (chat[key] === isEnable) { result.status = isEnable ? 'risulta già attivo.' : 'risulta già disattivato.'; return; }
      chat[key] = isEnable;
      result.status = isEnable ? 'ATTIVATO' : 'DISATTIVATO';
      result.success = true;
    };
    const setBot = (key) => {
      if (bot[key] === isEnable) { result.status = isEnable ? 'risulta già attivo.' : 'risulta già disattivato.'; return; }
      bot[key] = isEnable;
      result.status = isEnable ? 'ATTIVATO' : 'DISATTIVATO';
      result.success = true;
    };

    switch (type) {
      case 'welcome': case 'benvenuto':
        if (!m.isGroup && !isOwner) { groupGuard(); break; }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) { adminGuard(); break; }
        setChat('welcome'); break;
      case 'goodbye': case 'addio':
        if (!m.isGroup && !isOwner) { groupGuard(); break; }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) { adminGuard(); break; }
        setChat('goodbye'); break;
      case 'antinuke':
        if (!m.isGroup && !isOwner) { groupGuard(); break; }
        if (adminCheck) { adminGuard(); break; }
        setChat('antinuke'); break;
      case 'antiprivato': case 'antipriv':
        if (ownerOnly) { ownerGuard(); break; }
        setBot('antiprivato'); break;
      case 'antilinkig':
        if (adminCheck) { adminGuard(); break; }
        setChat('antilinkig'); break;
      case 'antilinktg':
        if (adminCheck) { adminGuard(); break; }
        setChat('antilinktg'); break;
      case 'antilinktiktok':
        if (adminCheck) { adminGuard(); break; }
        setChat('antilinktiktok'); break;
      case 'read': case 'lettura':
        if (ownerOnly) { ownerGuard(); break; }
        setBot('read'); break;
      case 'anticall': case 'antichiamate':
        if (ownerOnly) { ownerGuard(); break; }
        setBot('anticall'); break;
      case 'solocreatore': case 'creatore':
        if (ownerOnly) { ownerGuard(); break; }
        setBot('soloCreatore'); break;
      case 'modoadmin': case 'soloadmin':
        if (adminCheck) { adminGuard(); break; }
        setChat('modoadmin'); break;
      case 'antimedia':
        if (!m.isGroup) { groupGuard(); break; }
        if (adminCheck) { adminGuard(); break; }
        setChat('antimedia'); break;
      case 'antibot':
        if (adminCheck) { adminGuard(); break; }
        setChat('antiBot'); break;
      case 'antivoip':
        if (adminCheck) { adminGuard(); break; }
        setChat('antivoip'); break;
      case 'antitoxic': case 'antitossici':
        if (adminCheck) { adminGuard(); break; }
        setChat('antitoxic'); break;
      case 'antioneview': case 'antiviewonce':
        if (adminCheck) { adminGuard(); break; }
        setChat('antioneview'); break;
      case 'reaction': case 'reazioni':
        if (adminCheck) { adminGuard(); break; }
        setChat('reaction'); break;
      case 'bestemmiometro': case 'bestemmie':
        if (adminCheck) { adminGuard(); break; }
        setChat('bestemmiometro'); break;
      case 'antispam':
        if (adminCheck) { adminGuard(); break; }
        setChat('antispam'); break;
      case 'antibusiness': case 'antibiz':
        if (!m.isGroup && !isOwner) { groupGuard(); break; }
        if (adminCheck) { adminGuard(); break; }
        setChat('antibusiness'); break;
      case 'antitrava':
        if (!m.isGroup && !isOwner) { groupGuard(); break; }
        if (adminCheck) { adminGuard(); break; }
        setChat('antitrava'); break;
      case 'antiporn': case 'antiporno': case 'antinsfw':
        if (adminCheck) { adminGuard(); break; }
        setChat('antiporno'); break;
      case 'antigore':
        if (adminCheck) { adminGuard(); break; }
        setChat('antigore'); break;
      case 'slowmode':
        if (adminCheck) { adminGuard(); break; }
        setChat('slowmode'); break;
      case 'logrichieste':
        if (!m.isGroup && !isOwner) { groupGuard(); break; }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) { adminGuard(); break; }
        setChat('logrichieste'); break;
      case 'ia': case 'ai':
        if (!m.isGroup && !isOwner) { groupGuard(); break; }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) { adminGuard(); break; }
        setChat('ai'); break;
      case 'vocali': case 'siri':
        if (!m.isGroup && !isOwner) { groupGuard(); break; }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) { adminGuard(); break; }
        setChat('vocali'); break;
      case 'subbots':
        if (ownerOnly) { ownerGuard(); break; }
        setBot('jadibotmd'); break;
      case 'detect': case 'rileva':
        if (!m.isGroup && !isOwner) { groupGuard(); break; }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) { adminGuard(); break; }
        setChat('rileva'); break;
      case 'antilink': case 'nolink':
        if (adminCheck) { adminGuard(); break; }
        setChat('antiLink'); break;
      default:
        result.status = `Modulo non riconosciuto. Scrivi *${usedPrefix}funzioni* per la lista completa.`; break;
    }
    return result;
  };

  const buildMessage = (result) => {
    let icon = result.success ? (isEnable ? '🟩' : '🟥') : result.status.includes('già') ? '🟨' : '⚠️';
    let displayStatus = result.success ? `*${result.status}*` : result.status;
    return `╭━━━〔 *888 CONTROL* 〕━━━┈\n┃ ⚙️ *Funzione:* ${result.type}\n┃ ${icon} *Stato:* ${displayStatus}\n┃ 👤 *Operatore:* ${userName}\n╰━━━━━━━━━━━━━━━━━━━━┈\n\n`;
  };

  const createSections = (features) => [
    { title: '🟢 Attiva Modulo', rows: features.map(f => ({ title: f.name, description: f.desc, id: `${usedPrefix}attiva ${f.key}` })) },
    { title: '🔴 Disattiva Modulo', rows: features.map(f => ({ title: f.name, description: f.desc, id: `${usedPrefix}disattiva ${f.key}` })) }
  ];

  if (!args.length) {
    const bot333 = 'icone/888.jpg';
    let cards = [
      {
        image: { url: bot333 },
        title: '⚙️ Pannello Gestione Gruppo',
        body: 'Seleziona dal menù a tendina sottostante i moduli di sicurezza e utilità da attivare o disattivare nel gruppo.',
        footer: '𝟴𝟴𝟴 𝗕𝗢𝗧 • Security Panel',
        buttons: [{ name: 'single_select', buttonParamsJson: JSON.stringify({ title: 'Apri Impostazioni', sections: createSections(adminFeatures) }) }]
      }
    ];

    if (isOwner || isROwner) {
      cards.push({
        image: { url: bot333 },
        title: '👑 Pannello Configurazione Owner',
        body: 'Configura i settaggi core del bot e le funzioni globali di protezione del sistema.',
        footer: '𝟴𝟴𝟴 𝗕𝗢𝗧 • Owner Panel',
        buttons: [{ name: 'single_select', buttonParamsJson: JSON.stringify({ title: 'Apri Comandi Core', sections: createSections(ownerFeatures) }) }]
      });
    }

    return conn.sendMessage(m.chat, {
      text: '🤖 *SISTEMA GESTIONE FUNZIONI* 🤖\n\n_Usa i menù nelle schede sottostanti per configurare il bot._',
      footer: '𝟴𝟴𝟴 𝗕𝗢𝗧',
      cards
    }, { quoted: fake });
  }

  const firstArg = args[0].toLowerCase();
  if (catalogs[firstArg]) {
    if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
      return conn.sendMessage(m.chat, { text: '⚠️ *Azione negata:* Questo catalogo è accessibile solo dagli amministratori.' }, { quoted: fake });
    }
    const results = catalogs[firstArg].map(key => toggleFeature(key));
    const msg = results.map(buildMessage).join('').trim();
    return conn.sendMessage(m.chat, { text: msg }, { quoted: fake });
  }

  const results = args.map(arg => toggleFeature(arg.toLowerCase()));
  const summaryMessage = results.map(buildMessage).join('').trim();
  await conn.sendMessage(m.chat, { text: summaryMessage }, { quoted: fake });
};

handler.help = ['attiva', 'disabilita'];
handler.tags = ['main'];
handler.command = ['enable', 'disable', 'attiva', 'disabilita', 'on', 'off'];

export default handler;
