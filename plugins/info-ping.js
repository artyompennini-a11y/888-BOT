import speed from 'performance-now';
import os from 'os';
import dns from 'dns';
import { fetchLatestBaileysVersion } from '@realvare/baileys';

const toMathematicalAlphanumericSymbols = number => {
  const map = {
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '.': '.'
  };
  return number.toString().split('').map(d => map[d] || d).join('');
};

const clockString = ms => {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${days.toString().padStart(2, '0')}g ${hours.toString().padStart(2, '0')}o ${minutes.toString().padStart(2, '0')}m`;
};

let handler = async (m, { conn, usedPrefix }) => {
  // 🔥 LATENZA
  const start = speed();
  try {
    await conn.readMessages([m.key]);
  } catch {}
  const end = speed();
  const latency = (end - start).toFixed(2);
  const speedWithFont = toMathematicalAlphanumericSymbols(latency);

  // 🔥 UPTIME
  const uptime = clockString(process.uptime() * 1000);

  // 🔥 STATO CONNESSIONE (PATCHATO)
  let connectionStatus = 'N/D';
  try {
    const state = conn?.ev?.connectionState;
    if (state === 'open') connectionStatus = '🟢 Connesso';
    else if (state === 'connecting') connectionStatus = '🟡 Connessione…';
    else if (state === 'close') connectionStatus = '🔴 Disconnesso';
    else connectionStatus = `⚪ Stato: ${state || 'sconosciuto'}`;
  } catch {
    connectionStatus = 'N/D';
  }

  // 🔥 RAM
  const memory = process.memoryUsage();
  const ramUsed = (memory.heapUsed / 1024 / 1024).toFixed(1);
  const ramTotal = (memory.heapTotal / 1024 / 1024).toFixed(1);

  // 🔥 CPU
  let cpuInfo = 'N/D';
  try {
    const cpus = os.cpus();
    if (Array.isArray(cpus) && cpus.length > 0) {
      const model = cpus[0]?.model?.trim();
      const speedCpu = cpus[0]?.speed;
      cpuInfo =
        (model && model.length > 0)
          ? model
          : (speedCpu ? `CPU @ ${speedCpu}MHz` : 'CPU rilevata ma senza modello');
    }
  } catch {
    cpuInfo = 'N/D';
  }

  // 🔥 DNS Ping con timeout
  let dnsPing = 'N/D';
  try {
    const dnsStart = speed();
    await Promise.race([
      new Promise(resolve => dns.lookup('google.com', () => resolve())),
      new Promise(resolve => setTimeout(resolve, 500))
    ]);
    dnsPing = (speed() - dnsStart).toFixed(2);
  } catch {}

  // 🔧 Versione Baileys protetta
  let baileysVersion = 'N/D';
  try {
    const { version } = await fetchLatestBaileysVersion();
    baileysVersion = version.join('.');
  } catch {}

  // 🔥 OUTPUT
  const info = `
╭━━━〔 🏓 *PONG* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* ${connectionStatus}
┃━━━━━━━━━━━━━━━━━━
┃ 🚀 *Risposta:* ${speedWithFont} ms
┃ 🌐 *DNS Ping:* ${dnsPing} ms
┃ ⏳ *Uptime:* ${uptime}
┃ 🔧 *Baileys:* v${baileysVersion}
┃ 💾 *RAM:* ${ramUsed}MB / ${ramTotal}MB
┃ 🖥️ *CPU:* ${cpuInfo}
╰━━━━━━━━━━━━━━━━━━┈`.trim();

  const buttons = [
    { buttonId: `${usedPrefix}ping`, buttonText: { displayText: '📡 RICALCOLA PING' }, type: 1 },
    { buttonId: `${usedPrefix}menu`, buttonText: { displayText: '📋 MENU' }, type: 1 },
    { buttonId: `${usedPrefix}status`, buttonText: { displayText: '⚙️ STATO SISTEMA' }, type: 1 }
  ];

  await conn.sendMessage(m.chat, {
    text: info,
    footer: '888 Bot • Sistema di diagnostica avanzato',
    buttons,
    headerType: 1
  }, { quoted: m });
};

handler.help = ['ping'];
handler.tags = ['info'];
handler.command = /^(ping)$/i;

export default handler;
