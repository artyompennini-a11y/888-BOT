// Plugin by Elixir & 888 staff

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
        name: '🤖 888 BOT • Signal Control',
        jpegThumbnail: imgBuffer.toString('base64'),
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;888;;;\nFN:888\nEND:VCARD'
      }
    },
    participant: '0@s.whatsapp.net'
  };

  let isEnable = /true|enable|attiva|(turn)?on|1/i.test(command);
  if (/disable|disattiva|off|0/i.test(command)) isEnable = false;

  global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {};
  global.db.data.users[m.sender] = global.db.data.users[m.sender] || {};
  let chat = global.db.data.chats[m.chat];
  let user = global.db.data.users[m.sender];
  let bot = global.db.data.settings[conn.user.jid] || {};

  const catalogs = {
    security: ['antilink','antiporno','modoadmin','antispam','antimedia','antitoxic','antiBot','antivoip','antioneview','antitrava','slowmode','antinuke'],
    protezione: ['antispam','antitoxic','antiBot','antivoip','antioneview','antitrava'],
    media: ['antimedia','antiporno','antigore'],
    full: ['antilink','antiporno','antigore','antispam','antitoxic','antiBot','antivoip','antioneview','antimedia','antilinktg','antilinkig','antilinktiktok','modoadmin','antitrava','slowmode','antinuke']
  };

  const adminFeatures = [
    { key: 'welcome', name: 'Welcome', desc: 'Messaggio di benvenuto' },
    { key: 'antinuke', name: 'AntiNuke', desc: 'Protezione totale del gruppo' },
    { key: 'antimedia', name: 'AntiMedia', desc: 'Blocca media a rischio' },
    { key: 'goodbye', name: 'Addio', desc: 'Messaggio di addio' },
    { key: 'antispam', name: 'Antispam', desc: 'Blocca spam' },
    { key: 'antitrava', name: 'AntiTrava', desc: 'Blocca messaggi trava' },
    { key: 'antitoxic', name: 'Antitossici', desc: 'Rileva insulti' },
    { key: 'antiBot', name: 'Antibot', desc: 'Blocca bot indesiderati' },
    { key: 'antioneview', name: 'Antiviewonce', desc: 'Blocca view-once' },
    { key: 'rileva', name: 'Rileva', desc: 'Rileva eventi gruppo' },
    { key: 'antiporno', name: 'Antiporno', desc: 'Blocca contenuti NSFW' },
    { key: 'antigore', name: 'Antigore', desc: 'Blocca contenuti gore' },
    { key: 'logrichieste', name: 'LogRichieste', desc: 'Log join request' },
    { key: 'modoadmin', name: 'SoloAdmin', desc: 'Solo admin possono usare comandi' },
    { key: 'slowmode', name: 'Slowmode', desc: 'Limita spam messaggi' },
    { key: 'ai', name: 'IA', desc: 'Intelligenza artificiale' },
    { key: 'vocali', name: 'Siri', desc: 'Risposte vocali automatiche' },
    { key: 'antivoip', name: 'AntiVoip', desc: 'Blocca chiamate VoIP' },
    { key: 'antilinktg', name: 'AntiTelegram', desc: 'Blocca link Telegram' },
    { key: 'antilinkig', name: 'AntiInstagram', desc: 'Blocca link Instagram' },
    { key: 'antilinktiktok', name: 'AntiTikTok', desc: 'Blocca link TikTok' },
    { key: 'antilink', name: 'AntiLink', desc: 'Blocca link WhatsApp' },
    { key: 'reaction', name: 'Reazioni', desc: 'Reazioni automatiche' },
    { key: 'bestemmiometro', name: 'Bestemmiometro', desc: 'Conta bestemmie' },
    { key: 'antifake', name: 'AntiFake', desc: 'Blocca numeri fake' }
  ];

  const ownerFeatures = [
    { key: 'antiprivato', name: 'Antiprivato', desc: 'Blocca chi scrive in privato al bot' },
    { key: 'soloCreatore', name: 'SoloCreatore', desc: 'Solo il creatore può usare comandi' },
    { key: 'jadibotmd', name: 'Subbots', desc: 'Gestione sub-bot' },
    { key: 'read', name: 'Lettura', desc: 'Il bot legge automaticamente i messaggi' },
    { key: 'anticall', name: 'Antichiamate', desc: 'Blocca chiamate' }
  ];

  const toggleFeature = (type) => {
    let result = { type, status: '', success: false };

    const adminCheck = m.isGroup && !(isAdmin || isOwner || isROwner);
    const ownerOnly = !isOwner && !isROwner;

    const adminGuard = () => { result.status = 'Azione consentita solo agli amministratori.'; };
    const ownerGuard = () => { result.status = 'Azione riservata al proprietario.'; };
    const groupGuard = () => { result.status = 'Questo comando è disponibile solo nei gruppi.'; };

    const setChat = (key) => {
      if (chat[key] === isEnable) {
        result.status = isEnable ? 'già attivo.' : 'già disattivato.';
        return;
      }
      chat[key] = isEnable;
      result.status = isEnable ? 'ATTIVATO' : 'DISATTIVATO';
      result.success = true;
    };

    const setBot = (key) => {
      if (bot[key] === isEnable) {
        result.status = isEnable ? 'già attivo.' : 'già disattivato.';
        return;
      }
      bot[key] = isEnable;
      result.status = isEnable ? 'ATTIVATO' : 'DISATTIVATO';
      result.success = true;
    };

    switch (type) {
      case 'welcome': case 'benvenuto':
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
        setChat('welcome'); break;

      case 'goodbye': case 'addio':
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
        setChat('goodbye'); break;

      case 'antinuke':
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
        setChat('antinuke'); break;

      case 'antiprivato':
        if (ownerOnly) return ownerGuard();
        setBot('antiprivato'); break;

      case 'antilinkig':
        if (adminCheck) return adminGuard();
        setChat('antilinkig'); break;

      case 'antilinktg':
        if (adminCheck) return adminGuard();
        setChat('antilinktg'); break;

      case 'antilinktiktok':
        if (adminCheck) return adminGuard();
        setChat('antilinktiktok'); break;

      case 'read':
        if (ownerOnly) return ownerGuard();
        setBot('read'); break;

      case 'anticall':
        if (ownerOnly) return ownerGuard();
        setBot('anticall'); break;

      case 'soloCreatore':
        if (ownerOnly) return ownerGuard();
        setBot('soloCreatore'); break;

      case 'modoadmin':
        if (adminCheck) return adminGuard();
        setChat('modoadmin'); break;

      case 'antimedia':
        if (!m.isGroup) return groupGuard();
        if (adminCheck) return adminGuard();
        setChat('antimedia'); break;

      case 'antiBot':
        if (adminCheck) return adminGuard();
        setChat('antiBot'); break;

      case 'antivoip':
        if (adminCheck) return adminGuard();
        setChat('antivoip'); break;

      case 'antitoxic':
        if (adminCheck) return adminGuard();
        setChat('antitoxic'); break;

      case 'antioneview':
        if (adminCheck) return adminGuard();
        setChat('antioneview'); break;

      case 'reaction':
        if (adminCheck) return adminGuard();
        setChat('reaction'); break;

      case 'bestemmiometro':
        if (adminCheck) return adminGuard();
        setChat('bestemmiometro'); break;

      case 'antispam':
        if (adminCheck) return adminGuard();
        setChat('antispam'); break;

      case 'antitrava':
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
        setChat('antitrava'); break;

      case 'antiporno':
        if (adminCheck) return adminGuard();
        setChat('antiporno'); break;

      case 'antigore':
        if (adminCheck) return adminGuard();
        setChat('antigore'); break;

      case 'slowmode':
        if (adminCheck) return adminGuard();
        setChat('slowmode'); break;

      case 'logrichieste':
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
        setChat('logrichieste'); break;

      case 'ai':
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
        setChat('ai'); break;

      case 'vocali':
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
        setChat('vocali'); break;

      case 'subbots':
        if (ownerOnly) return ownerGuard();
        setBot('jadibotmd'); break;

      case 'rileva':
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
        setChat('rileva'); break;

      case 'antilink':
        if (adminCheck) return adminGuard();
        setChat('antiLink'); break;

      case 'antifake':
        if (adminCheck) return adminGuard();
        setChat('antifake'); break;

      default:
        result.status = `Modulo non riconosciuto. Usa ${usedPrefix}funzioni per la lista completa.`;
        break;
    }

    return result;
  };

  const buildMessage = (result) => {
    let icon = result.success ? (isEnable ? '🟩' : '🟥') : result.status.includes('già') ? '🟨' : '⚠️';
    let displayStatus = result.success ? `*${result.status}*` : result.status;
    return `⚙️ *Funzione:* ${result.type}\n${icon} Stato: ${displayStatus}\n👤 Operatore: ${userName}\n\n`;
  };

  const createSections = (features) => [
    {
      title: '🟢 Attiva Modulo',
      rows: features.map(f => ({
        title: f.name,
        description: f.desc,
        id: `${usedPrefix}attiva ${f.key}`
      }))
    },
    {
      title: '🔴 Disattiva Modulo',
      rows: features.map(f => ({
        title: f.name,
        description: f.desc,
        id: `${usedPrefix}disattiva ${f.key}`
      }))
    }
  ];

  if (!args.length) {
    const botImg = 'icone/888.jpg';

    let cards = [
      {
        image: { url: botImg },
        title: '⚙️ Pannello Gestione Gruppo',
        body: 'Configura i moduli di sicurezza e utilità del gruppo.',
        footer: '𝟴𝟴𝟴 𝗕𝗢𝗧 • Security Panel',
        buttons: [
          {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: 'Apri Impostazioni',
              sections: createSections(adminFeatures)
            })
          }
        ]
      }
    ];

    if (isOwner || isROwner) {
      cards.push({
        image: { url: botImg },
        title: '👑 Pannello Owner',
        body: 'Gestisci le funzioni globali del bot.',
        footer: '𝟴𝟴𝟴 𝗕𝗢𝗧 • Owner Panel',
        buttons: [
          {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: 'Apri Comandi Core',
              sections: createSections(ownerFeatures)
            })
          }
        ]
      });
    }

    return conn.sendMessage(
      m.chat,
      {
        text: '🤖 *Sistema Gestione Funzioni*\nConfigura il bot tramite i menù sottostanti.',
        footer: '𝟴𝟴𝟴 𝗕𝗢𝗧',
        cards
      },
      { quoted: fake }
    );
  }

  const firstArg = args[0].toLowerCase();

  if (catalogs[firstArg]) {
    if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
      return conn.sendMessage(
        m.chat,
        { text: '⚠️ Azione negata: catalogo riservato agli admin.' },
        { quoted: fake }
      );
    }

    const results = catalogs[firstArg].map(key => toggleFeature(key));
    const msg = results.map(buildMessage).join('').trim();

    return conn.sendMessage(m.chat, { text: msg }, { quoted: fake });
  }

  const results = args.map(arg => toggleFeature(arg.toLowerCase()));
  const summaryMessage = results.map(buildMessage).join('').trim();

  await conn.sendMessage(m.chat, { text: summaryMessage }, { quoted: fake });
};

handler.help = ['attiva', 'disattiva'];
handler.tags = ['main'];
handler.command = ['enable', 'disable', 'attiva', 'disattiva', 'on', 'off'];

export default handler;