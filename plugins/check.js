// Plugin by Elixir, Punisher & 888 staff

let handler = async (m, { conn, text }) => {
  try {
    let who;
    let targetMsg = m;

    if (text) {
      let cleanedText = text.replace(/[@\s+-]/g, '');
      let number = cleanedText;
      if (!isNaN(number) && number.length >= 7 && number.length <= 15) {
        who = number + '@s.whatsapp.net';
        targetMsg = null;
      } else if (m.mentionedJid && m.mentionedJid[0]) {
        who = m.mentionedJid[0];
      }
    } else if (m.quoted) {
      who = m.quoted.sender;
      targetMsg = m.quoted;
    } else {
      who = m.sender;
    }

    if (!who) who = m.sender;
    await m.react('🔍');

    const tagUtente = who.replace(/@.+/, '');
    const userName = (await conn.getName(who)) || tagUtente;

    let scanData = {
      device: { os: 'Sconosciuto', client: 'Sconosciuto', isBusiness: false, isEmulator: false, isWeb: false, isDesktop: false },
      multiDevice: { linkedDevices: 0, hasWeb: false, hasDesktop: false, activeSessions: [] },
      account: { isBusiness: false, accountAge: null, activityScore: 0 },
      profile: { hasPhoto: false, hasBio: false, bio: null, bioLength: 0 },
      geo: { countryCode: null, country: null, prefix: null, timezone: null, language: null },
      message: { id: 'N/D', type: 'N/D', length: 0, formattedTime: null, encryption: null, mediaQuality: null },
      risk: { score: 0, level: 'low', factors: [] },
      fingerprint: null
    };

    if (targetMsg) {
      const rawMsg = targetMsg.vM || targetMsg;
      scanData.message.id = targetMsg.id || rawMsg.key?.id || 'N/D';
      if (scanData.message.id !== 'N/D') scanData.device = analyzeDeviceId(scanData.message.id, scanData.device);
      scanData.message.type = getMessageType(rawMsg);
      scanData.message.length = targetMsg.text?.length || targetMsg.caption?.length || JSON.stringify(rawMsg).length || 0;
      const timestamp = targetMsg.timestamp || rawMsg.messageTimestamp;
      if (timestamp) scanData.message.formattedTime = new Date(timestamp * 1000).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
      scanData.message.encryption = detectEncryption(rawMsg);
      scanData.message.mediaQuality = analyzeMediaQuality(rawMsg);
    }

    try { scanData.profile.hasPhoto = !!(await conn.profilePictureUrl(who, 'image')); } catch { scanData.profile.hasPhoto = false; }
    try { let s = await conn.fetchStatus(who); if (s?.status) { scanData.profile.hasBio = true; scanData.profile.bio = s.status; scanData.profile.bioLength = s.status.length; } } catch {}
    try { let chat = conn.chats?.[who]; if (chat) { scanData.account.isBusiness = chat.isBusiness || false; if (chat.isBusiness) scanData.device.client = 'business'; scanData.account.activityScore = Math.min(chat.msgs || 0, 100); } } catch {}

    scanData.geo = analyzePhoneNumber(tagUtente);
    scanData.account.accountAge = estimateAccountAge(scanData);
    scanData.multiDevice = await detectMultiDevice(conn, who, scanData);
    scanData.risk = calculateRiskScore(scanData);
    scanData.fingerprint = generateFingerprint(scanData);

    await conn.sendMessage(m.chat, { text: formatAdvancedReport(userName, tagUtente, scanData), mentions: [who] }, { quoted: m });
    await m.react('✅');
  } catch (error) {
    console.error(`[check] Errore critico:`, error);
    m.reply('`[!] Errore durante l\'estrazione dei dati.`');
    await m.react('❌');
  }
};

function analyzeMessageId(msgId, device) {
  if (!msgId || typeof msgId !== 'string') return device;
  if (/^[a-zA-Z]+-[a-fA-F0-9]+$/.test(msgId)) { device.os = 'unknown'; device.client = 'bot_emulator'; device.isEmulator = true; }
  else if (msgId.startsWith('false_') || msgId.startsWith('true_')) { device.os = 'web'; device.client = 'web'; device.isWeb = true; }
  else if (msgId.startsWith('3EB0') && msgId.length > 12) { device.os = 'android'; device.client = 'web'; device.isWeb = true; }
  else if (msgId.startsWith('3EB0')) { device.os = 'android'; device.client = 'android'; }
  else if (msgId.includes(':')) { device.os = 'desktop'; device.client = 'desktop'; device.isDesktop = true; }
  else if (/^[A-F0-9]{32}$/i.test(msgId)) { device.os = 'android'; device.client = 'android'; }
  else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msgId)) { device.os = 'ios'; device.client = 'ios'; }
  else if (/^[A-Z0-9]{20,25}$/i.test(msgId)) { device.os = 'ios'; device.client = 'ios'; }
  return device;
}

function getMessageType(rawMsg) {
  if (rawMsg.imageMessage) return 'Immagine 🖼️';
  if (rawMsg.videoMessage) return 'Video 🎥';
  if (rawMsg.audioMessage) return 'Audio 🎵';
  if (rawMsg.documentMessage) return 'Documento 📄';
  if (rawMsg.stickerMessage) return 'Sticker 🎨';
  if (rawMsg.contactMessage || rawMsg.contactsArrayMessage) return 'Contatto 📇';
  if (rawMsg.locationMessage) return 'Posizione 📍';
  if (rawMsg.pollCreationMessage || rawMsg.pollCreationMessageV2) return 'Sondaggio 📊';
  if (rawMsg.reactionMessage) return 'Reazione ❤️';
  if (rawMsg.liveLocationMessage) return 'Live Location 📡';
  if (rawMsg.productMessage) return 'Prodotto 🏷️';
  return 'Testo 📝';
}

function detectEncryption(rawMsg) {
  if (rawMsg.imageMessage?.fileSha256 || rawMsg.videoMessage?.fileSha256 || rawMsg.documentMessage?.fileSha256 || rawMsg.messageContextInfo?.messageSecret) return 'E2E ✅';
  return 'Standard';
}

function analyzeMediaQuality(rawMsg) {
  if (rawMsg.imageMessage) { let w = rawMsg.imageMessage.width || 0, h = rawMsg.imageMessage.height || 0; if (w >= 3840 || h >= 3840) return '4K 📸'; if (w >= 1920 || h >= 1920) return 'Full HD 📷'; if (w >= 1280 || h >= 1280) return 'HD 📷'; return 'Low 📷'; }
  if (rawMsg.videoMessage) { let w = rawMsg.videoMessage.width || 0, h = rawMsg.videoMessage.height || 0; if (w >= 3840 || h >= 3840) return '4K 🎬'; if (w >= 1920 || h >= 1920) return 'Full HD 🎥'; if (w >= 1280 || h >= 1280) return 'HD 🎥'; return 'SD 🎥'; }
  return null;
}

function analyzePhoneNumber(numero) {
  let geo = { countryCode: null, country: null, prefix: null, timezone: null, language: null };
  let prefixes = {
    '39': { country: 'Italia', code: 'IT', tz: 'Europe/Rome', lang: 'it' },
    '33': { country: 'Francia', code: 'FR', tz: 'Europe/Paris', lang: 'fr' },
    '34': { country: 'Spagna', code: 'ES', tz: 'Europe/Madrid', lang: 'es' },
    '49': { country: 'Germania', code: 'DE', tz: 'Europe/Berlin', lang: 'de' },
    '44': { country: 'Regno Unito', code: 'GB', tz: 'Europe/London', lang: 'en' },
    '1': { country: 'USA', code: 'US', tz: 'America/New_York', lang: 'en' },
    '351': { country: 'Portogallo', code: 'PT', tz: 'Europe/Lisbon', lang: 'pt' },
    '41': { country: 'Svizzera', code: 'CH', tz: 'Europe/Zurich', lang: 'de' },
    '32': { country: 'Belgio', code: 'BE', tz: 'Europe/Brussels', lang: 'nl' },
    '31': { country: 'Paesi Bassi', code: 'NL', tz: 'Europe/Amsterdam', lang: 'nl' },
    '43': { country: 'Austria', code: 'AT', tz: 'Europe/Vienna', lang: 'de' },
    '380': { country: 'Ucraina', code: 'UA', tz: 'Europe/Kiev', lang: 'uk' },
    '7': { country: 'Russia', code: 'RU', tz: 'Europe/Moscow', lang: 'ru' },
    '86': { country: 'Cina', code: 'CN', tz: 'Asia/Shanghai', lang: 'zh' },
    '81': { country: 'Giappone', code: 'JP', tz: 'Asia/Tokyo', lang: 'ja' },
    '82': { country: 'Corea del Sud', code: 'KR', tz: 'Asia/Seoul', lang: 'ko' },
    '91': { country: 'India', code: 'IN', tz: 'Asia/Kolkata', lang: 'hi' },
    '55': { country: 'Brasile', code: 'BR', tz: 'America/Sao_Paulo', lang: 'pt' },
    '52': { country: 'Messico', code: 'MX', tz: 'America/Mexico_City', lang: 'es' },
    '54': { country: 'Argentina', code: 'AR', tz: 'America/Argentina/Buenos_Aires', lang: 'es' },
    '56': { country: 'Cile', code: 'CL', tz: 'America/Santiago', lang: 'es' },
    '57': { country: 'Colombia', code: 'CO', tz: 'America/Bogota', lang: 'es' },
    '51': { country: 'Perù', code: 'PE', tz: 'America/Lima', lang: 'es' },
    '58': { country: 'Venezuela', code: 'VE', tz: 'America/Caracas', lang: 'es' },
    '61': { country: 'Australia', code: 'AU', tz: 'Australia/Sydney', lang: 'en' },
    '64': { country: 'Nuova Zelanda', code: 'NZ', tz: 'Pacific/Auckland', lang: 'en' },
    '20': { country: 'Egitto', code: 'EG', tz: 'Africa/Cairo', lang: 'ar' },
    '27': { country: 'Sudafrica', code: 'ZA', tz: 'Africa/Johannesburg', lang: 'en' },
    '234': { country: 'Nigeria', code: 'NG', tz: 'Africa/Lagos', lang: 'en' },
    '254': { country: 'Kenya', code: 'KE', tz: 'Africa/Nairobi', lang: 'sw' },
    '90': { country: 'Turchia', code: 'TR', tz: 'Europe/Istanbul', lang: 'tr' },
    '966': { country: 'Arabia Saudita', code: 'SA', tz: 'Asia/Riyadh', lang: 'ar' },
    '971': { country: 'EAU', code: 'AE', tz: 'Asia/Dubai', lang: 'ar' },
    '880': { country: 'Bangladesh', code: 'BD', tz: 'Asia/Dhaka', lang: 'bn' },
    '92': { country: 'Pakistan', code: 'PK', tz: 'Asia/Karachi', lang: 'ur' },
    '62': { country: 'Indonesia', code: 'ID', tz: 'Asia/Jakarta', lang: 'id' },
    '66': { country: 'Thailandia', code: 'TH', tz: 'Asia/Bangkok', lang: 'th' },
    '63': { country: 'Filippine', code: 'PH', tz: 'Asia/Manila', lang: 'tl' },
    '84': { country: 'Vietnam', code: 'VN', tz: 'Asia/Ho_Chi_Minh', lang: 'vi' },
    '65': { country: 'Singapore', code: 'SG', tz: 'Asia/Singapore', lang: 'en' },
    '60': { country: 'Malaysia', code: 'MY', tz: 'Asia/Kuala_Lumpur', lang: 'ms' },
    '852': { country: 'Hong Kong', code: 'HK', tz: 'Asia/Hong_Kong', lang: 'zh' },
    '886': { country: 'Taiwan', code: 'TW', tz: 'Asia/Taipei', lang: 'zh' },
    '353': { country: 'Irlanda', code: 'IE', tz: 'Europe/Dublin', lang: 'en' },
    '358': { country: 'Finlandia', code: 'FI', tz: 'Europe/Helsinki', lang: 'fi' },
    '46': { country: 'Svezia', code: 'SE', tz: 'Europe/Stockholm', lang: 'sv' },
    '47': { country: 'Norvegia', code: 'NO', tz: 'Europe/Oslo', lang: 'no' },
    '45': { country: 'Danimarca', code: 'DK', tz: 'Europe/Copenhagen', lang: 'da' },
    '48': { country: 'Polonia', code: 'PL', tz: 'Europe/Warsaw', lang: 'pl' },
    '420': { country: 'Rep. Ceca', code: 'CZ', tz: 'Europe/Prague', lang: 'cs' },
    '36': { country: 'Ungheria', code: 'HU', tz: 'Europe/Budapest', lang: 'hu' },
    '40': { country: 'Romania', code: 'RO', tz: 'Europe/Bucharest', lang: 'ro' },
    '359': { country: 'Bulgaria', code: 'BG', tz: 'Europe/Sofia', lang: 'bg' },
    '385': { country: 'Croazia', code: 'HR', tz: 'Europe/Zagreb', lang: 'hr' },
    '386': { country: 'Slovenia', code: 'SI', tz: 'Europe/Ljubljana', lang: 'sl' },
    '30': { country: 'Grecia', code: 'GR', tz: 'Europe/Athens', lang: 'el' },
    '356': { country: 'Malta', code: 'MT', tz: 'Europe/Malta', lang: 'mt' },
    '357': { country: 'Cipro', code: 'CY', tz: 'Asia/Nicosia', lang: 'el' }
  };
  for (let prefix of Object.keys(prefixes).sort((a, b) => b.length - a.length)) {
    if (numero.startsWith(prefix)) {
      geo.prefix = prefix;
      geo.country = prefixes[prefix].country;
      geo.countryCode = prefixes[prefix].code;
      geo.timezone = prefixes[prefix].tz;
      geo.language = prefixes[prefix].lang;
      break;
    }
  }
  return geo;
}

function estimateAccountAge(scanData) {
  let age = { estimate: 'sconosciuto', confidence: 'low', signals: [] };
  if (scanData.profile.bioLength > 50) age.signals.push('bio_estesa');
  if (scanData.account.activityScore > 50) age.signals.push('alta_attivita');
  if (scanData.profile.hasPhoto && scanData.profile.hasBio) age.signals.push('profilo_completo');
  if (age.signals.length >= 3) { age.estimate = 'vecchio'; age.confidence = 'medium'; }
  else if (age.signals.length >= 2) { age.estimate = 'medio'; age.confidence = 'medium'; }
  else if (age.signals.length >= 1) { age.estimate = 'recente'; age.confidence = 'low'; }
  else { age.estimate = 'molto_recente'; age.confidence = 'low'; }
  return age;
}

async function detectMultiDevice(conn, who, scanData) {
  let multiDevice = { linkedDevices: 1, hasWeb: false, hasDesktop: false, activeSessions: [] };
  if (scanData.device.isWeb) { multiDevice.hasWeb = true; multiDevice.linkedDevices++; multiDevice.activeSessions.push('web'); }
  if (scanData.device.isDesktop) { multiDevice.hasDesktop = true; multiDevice.linkedDevices++; multiDevice.activeSessions.push('desktop'); }
  try {
    let chat = conn.chats?.[who];
    if (chat?.presences) {
      let presences = Object.keys(chat.presences);
      if (presences.length > 1) multiDevice.linkedDevices = Math.max(multiDevice.linkedDevices, presences.length);
    }
  } catch {}
  return multiDevice;
}

function calculateRiskScore(scanData) {
  let risk = { score: 0, level: 'low', factors: [] };
  if (scanData.device.isEmulator) { risk.score += 40; risk.factors.push('emulatore_rilevato'); }
  if (!scanData.profile.hasPhoto) { risk.score += 15; risk.factors.push('nessuna_foto_profilo'); }
  if (!scanData.profile.hasBio) { risk.score += 10; risk.factors.push('nessuna_bio'); }
  if (scanData.account.accountAge?.estimate === 'molto_recente') { risk.score += 20; risk.factors.push('account_nuovo'); }
  if (scanData.multiDevice.linkedDevices > 2) { risk.score += 10; risk.factors.push('multi_device_sospetto'); }
  if (scanData.device.client === 'bot_emulator') { risk.score += 50; risk.factors.push('bot_emulator'); }
  if (risk.score >= 60) risk.level = 'high';
  else if (risk.score >= 30) risk.level = 'medium';
  else risk.level = 'low';
  return risk;
}

function generateFingerprint(scanData) {
  let fp = '';
  fp += scanData.device.os.substring(0, 2).toUpperCase();
  fp += scanData.device.client.substring(0, 2).toUpperCase();
  fp += scanData.geo.countryCode || 'XX';
  fp += scanData.profile.hasPhoto ? '1' : '0';
  fp += scanData.profile.hasBio ? '1' : '0';
  fp += scanData.account.isBusiness ? 'B' : 'P';
  return fp + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function formatAdvancedReport(userName, tagUtente, scanData) {
  let deviceIcon = '❓';
  let deviceName = 'Sconosciuto';
  switch (scanData.device.os) {
    case 'android': deviceIcon = '📱'; deviceName = 'Android'; break;
    case 'ios': deviceIcon = '🍎'; deviceName = 'iOS'; break;
    case 'web': deviceIcon = '💻'; deviceName = 'WhatsApp Web'; break;
    case 'desktop': deviceIcon = '🖥️'; deviceName = 'Desktop App'; break;
    case 'unknown': if (scanData.device.isEmulator) { deviceIcon = '🤖'; deviceName = 'Bot/Emulatore'; } break;
  }
  let riskIcon = scanData.risk.level === 'high' ? '🔴' : scanData.risk.level === 'medium' ? '🟡' : '🟢';
  let report = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🛡️ *888 ADVANCED DEVICE SCANNER*
┃ 📡 *ANALISI COMPLETA DISPOSITIVO*
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👤 *INFO UTENTE:*
┃ 📛 *Nome:* ${userName}
┃ 🎯 *Target:* @${tagUtente}
┃ 🌍 *Paese:* ${scanData.geo.country || 'N/D'} (+${scanData.geo.prefix || '??'})
┃ 🗣️ *Lingua:* ${scanData.geo.language?.toUpperCase() || 'N/D'}
┃ 🌐 *Timezone:* ${scanData.geo.timezone || 'N/D'}
╰━━━━━━━━━━━━━━━━━━━━━━━

${deviceIcon} *DISPOSITIVO RILEVATO:*
┃ 💻 *OS:* ${deviceName}
┃ 📲 *Client:* ${scanData.device.client}
┃ 🏢 *Tipo:* ${scanData.account.isBusiness ? 'Business' : 'Personale'}
┃ 🤖 *Emulatore:* ${scanData.device.isEmulator ? '⚠️ Rilevato' : 'No'}
╰━━━━━━━━━━━━━━━━━━━━━━━

📱 *MULTI-DEVICE:*
┃ 🔗 *Dispositivi collegati:* ${scanData.multiDevice.linkedDevices}
┃ 💻 *WhatsApp Web:* ${scanData.multiDevice.hasWeb ? '✅ Attivo' : '❌ No'}
┃ 🖥️ *Desktop:* ${scanData.multiDevice.hasDesktop ? '✅ Attivo' : '❌ No'}
┃ 📲 *Sessioni:* ${scanData.multiDevice.activeSessions.join(', ') || 'Mobile'}
╰━━━━━━━━━━━━━━━━━━━━━━━

📊 *ACCOUNT:*
┃ 📅 *Età stimata:* ${scanData.account.accountAge.estimate.replace('_', ' ')}
┃ 🎯 *Confidenza:* ${scanData.account.accountAge.confidence}
┃ 📈 *Activity Score:* ${scanData.account.activityScore}/100
╰━━━━━━━━━━━━━━━━━━━━━━━

🖼️ *PROFILO:*`;
  if (scanData.profile.hasPhoto) report += `\n┃ 📷 *Foto:* ✅ Presente`;
  else report += `\n┃ 📷 *Foto:* ❌ Assente`;
  if (scanData.profile.hasBio) {
    report += `\n┃ 📝 *Bio:* ${scanData.profile.bio.substring(0, 50)}${scanData.profile.bio.length > 50 ? '...' : ''}`;
    report += `\n┃ 📏 *Lunghezza bio:* ${scanData.profile.bioLength} caratteri`;
  } else {
    report += `\n┃ 📝 *Bio:* ❌ Nessuna`;
  }
  report += `
╰━━━━━━━━━━━━━━━━━━━━━━━

📦 *MESSAGGIO ANALIZZATO:*
┃ 🆔 *ID:* \`${scanData.message.id}\`
┃ 📋 *Tipo:* ${scanData.message.type}
┃ 📏 *Dimensione:* ${scanData.message.length} bytes
┃ 🕐 *Orario:* ${scanData.message.formattedTime || 'N/D'}
┃ 🔐 *Crittografia:* ${scanData.message.encryption}`;
  if (scanData.message.mediaQuality) report += `\n┃ 📸 *Qualità media:* ${scanData.message.mediaQuality}`;
  report += `
╰━━━━━━━━━━━━━━━━━━━━━━━

⚠️ *ANALISI RISCHIO:*
┃ ${riskIcon} *Livello:* ${scanData.risk.level.toUpperCase()}
┃ 📊 *Score:* ${scanData.risk.score}/100`;
  if (scanData.risk.factors.length > 0) report += `\n┃ 🔍 *Fattori:* ${scanData.risk.factors.join(', ')}`;
  report += `
╰━━━━━━━━━━━━━━━━━━━━━━━

🔐 *FINGERPRINT:* \`${scanData.fingerprint}\`
┃ _Identificativo unico dispositivo_

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *888 ADVANCED SCANNER v3.0*
_Analisi completata con successo_`;
  return report;
}

handler.help = ['check', 'device', 'scan'];
handler.tags = ['tools', 'security'];
handler.command = /^(check|device|scan)$/i;
handler.owner = false;

export default handler;