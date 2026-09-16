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

  let isEnable = /true|enable|attiva|(turn)?on|1/.test(command);
  if (/disable|disattiva|off|0/.test(command)) isEnable = false;

  global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {};
  global.db.data.users[m.sender] = global.db.data.users[m.sender] || {};
  let chat = global.db.data.chats[m.chat];
  let user = global.db.data.users[m.sender];
  let bot = global.db.data.settings[conn.user.jid] || {};

  const catalogs = {
    security: ['antilink','antiporno','modoadmin','antispam','antimedia','antitoxic','antibot','antivoip','antioneview','antitrava','slowmode','antinuke'],
    protezione: ['antispam','antitoxic','antibot','antivoip','antioneview','antitrava'],
    media: ['antimedia','antiporno','antigore'],
    full: ['antilink','antiporno','antigore','antispam','antitoxic','antibot','antivoip','antioneview','antimedia','antilinktg','antilinkig','antilinktiktok','modoadmin','antitrava','slowmode','antinuke']
  };

  const adminFeatures = [
    { key: 'welcome', name: 'Welcome', desc: 'Messaggio di benvenuto' },
    { key: 'antinuke', name: 'AntiNuke', desc: 'Protezione totale del gruppo' },
    { key: 'antimedia', name: 'AntiMedia', desc: 'Blocca media a rischio' },
    { key: 'goodbye', name: 'Addio', desc: 'Messaggio di addio' },
    { key: 'antispam', name: 'Antispam', desc: 'Blocca spam' },
    { key: 'antitrava', name: 'AntiTrava', desc: 'Blocca messaggi trava' },
    { key: 'antitoxic', name: 'Antitossici', desc: 'Rileva insulti' },
    { key: 'antibot', name: 'Antibot', desc: 'Blocca bot indesiderati' },
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
    const groupGuard = () => { result.status = 'Questo comando è disponibile solo nei gruppi.'; };
    const adminGuard = () => { result.status = 'Azione consentita solo agli amministratori.'; };
    const ownerGuard = () => { result.status = 'Azione riservata al proprietario.'; };

    const lowerKey = type ? type.toLowerCase() : null;
    const key = (() => {
      const catalogKey = catalogs[lowerKey];
      return catalogKey ? catalogKey : [lowerKey].filter(Boolean);
    })();

    const setChatField = (k) => {
      const field = k.toLowerCase();
      if (chat[field] === isEnable) {
        result.status = isEnable ? 'già attivo.' : 'già disattivato.';
        return;
      }
      chat[field] = isEnable;
      result.status = isEnable ? 'ATTIVATO' : 'DISATTIVATO';
      result.success = true;
    };

    const setBotField = (k) => {
      const field = k.toLowerCase();
      if (bot[field] === isEnable) {
        result.status = isEnable ? 'già attivo.' : 'già disattivato.';
        return;
      }
      bot[field] = isEnable;
      result.status = isEnable ? 'ATTIVATO' : 'DISATTIVATO';
      result.success = true;
    };

    const guardChecks = {
      welcome: () => {
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
      },
      goodbye: () => {
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
      },
      antinuke: () => {
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
      },
      antiprivato: () => {
        if (ownerOnly) return ownerGuard();
      },
      antilinkig: () => {
        if (adminCheck) return adminGuard();
      },
      antilinktg: () => {
        if (adminCheck) return adminGuard();
      },
      antilinktiktok: () => {
        if (adminCheck) return adminGuard();
      },
      read: () => {
        if (ownerOnly) return ownerGuard();
      },
      anticall: () => {
        if (ownerOnly) return ownerGuard();
      },
      soloCreatore: () => {
        if (ownerOnly) return ownerGuard();
      },
      modoadmin: () => {
        if (adminCheck) return adminGuard();
      },
      antimedia: () => {
        if (!m.isGroup) return groupGuard();
        if (adminCheck) return adminGuard();
      },
      antibot: () => {
        if (adminCheck) return adminGuard();
      },
      antivoip: () => {
        if (adminCheck) return adminGuard();
      },
      antitoxic: () => {
        if (adminCheck) return adminGuard();
      },
      antioneview: () => {
        if (adminCheck) return adminGuard();
      },
      reaction: () => {
        if (adminCheck) return adminGuard();
      },
      bestemmiometro: () => {
        if (adminCheck) return adminGuard();
      },
      antispam: () => {
        if (adminCheck) return adminGuard();
      },
      antitrava: () => {
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
      },
      antiporno: () => {
        if (adminCheck) return adminGuard();
      },
      antigore: () => {
        if (adminCheck) return adminGuard();
      },
      slowmode: () => {
        if (adminCheck) return adminGuard();
      },
      logrichieste: () => {
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
      },
      ai: () => {
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
      },
      vocali: () => {
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
      },
      subbots: () => {
        if (ownerOnly) return ownerGuard();
      },
      jadibotmd: () => {
        if (ownerOnly) return ownerGuard();
      },
      rileva: () => {
        if (!m.isGroup && !isOwner) return groupGuard();
        if (adminCheck) return adminGuard();
      },
      antilink: () => {
        if (adminCheck) return adminGuard();
      },
      antifake: () => {
        if (adminCheck) return adminGuard();
      }
    };

    const handlerMap = {
      welcome: () => setChatField('welcome'),
      benvenuto: () => setChatField('welcome'),
      goodbye: () => setChatField('goodbye'),
      addio: () => setChatField('goodbye'),
      antinuke: () => setChatField('antinuke'),
      antiprivato: () => setBotField('antiprivato'),
      antilinkig: () => setChatField('antilinkig'),
      antilinktg: () => setChatField('antilinktg'),
      antilinktiktok: () => setChatField('antilinktiktok'),
      read: () => setBotField('read'),
      anticall: () => setBotField('anticall'),
      soloCreatore: () => setBotField('soloCreatore'),
      modoadmin: () => setChatField('modoadmin'),
      antimedia: () => setChatField('antimedia'),
      antibot: () => setChatField('antibot'),
      antiBot: () => setChatField('antibot'),
      antivoip: () => setChatField('antivoip'),
      antitoxic: () => setChatField('antitoxic'),
      antioneview: () => setChatField('antioneview'),
      reaction: () => setChatField('reaction'),
      bestemmiometro: () => setChatField('bestemmiometro'),
      antispam: () => setChatField('antispam'),
      antitrava: () => setChatField('antitrava'),
      antiporno: () => setChatField('antiporno'),
      antigore: () => setChatField('antigore'),
      slowmode: () => setChatField('slowmode'),
      logrichieste: () => setChatField('logrichieste'),
      ai: () => setChatField('ai'),
      vocali: () => setChatField('vocali'),
      subbots: () => setBotField('jadibotmd'),
      jadibotmd: () => setBotField('jadibotmd'),
      jadibotmd: () => setBotField('jadibotmd'),
      rileva: () => setChatField('rileva'),
      antilink: () => setChatField('antilink'),
      antiLink: () => setChatField('antilink'),
      antifake: () => setChatField('antifake')
    };

    const lowerType = type ? type.toLowerCase() : null;
    const normalizedKey = lowerType || null;

    if (!normalizedKey) {
      result.status = `Modulo non riconosciuto. Usa ${usedPrefix}funzioni per la lista completa.`;
      return result;
    }

    const guard = guardChecks[normalizedKey];
    if (guard) {
      const guardResult = guard();
      if (guardResult) return result;
    }

    const handler = handlerMap[normalizedKey] || handlerMap[type];
    if (!handler) {
      result.status = `Modulo non riconosciuto. Usa ${usedPrefix}funzioni per la lista completa.`;
      return result;
    }

    handler();
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
handler.lowercaseOnly = true;

export default handler;