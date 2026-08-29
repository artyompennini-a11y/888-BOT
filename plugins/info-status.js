import os from 'os';

let handler = async (m, { conn }) => {

  // 🔥 STATO CONNESSIONE PATCHATO
  let connectionStatus = "N/D";
  try {
    const state = conn?.ev?.connectionState;

    if (state === 'open') connectionStatus = "🟢 Connesso";
    else if (state === 'connecting') connectionStatus = "🟡 Connessione…";
    else if (state === 'close') connectionStatus = "🔴 Disconnesso";
    else connectionStatus = `⚪ Stato: ${state || 'sconosciuto'}`;
  } catch {
    connectionStatus = "N/D";
  }

  // 🔥 RAM
  const memory = process.memoryUsage();
  const ramUsed = (memory.heapUsed / 1024 / 1024).toFixed(1);
  const ramTotal = (memory.heapTotal / 1024 / 1024).toFixed(1);

  // 🔥 CPU
  let cpuInfo = "N/D";
  try {
    const cpu = os.cpus()?.[0];
    cpuInfo = cpu?.model?.trim() || "N/D";
  } catch {
    cpuInfo = "N/D";
  }

  // 🔥 UPTIME
  const uptimeSeconds = process.uptime().toFixed(0);

  // 🔥 OUTPUT
  const info = `
╭━━━〔 ⚙️ *STATO SISTEMA* 〕━━━┈
┃ *Connessione:* ${connectionStatus}
┃ *RAM:* ${ramUsed}MB / ${ramTotal}MB
┃ *CPU:* ${cpuInfo}
┃ *Uptime:* ${uptimeSeconds}s
╰━━━━━━━━━━━━━━━━━━┈`.trim();

  await conn.sendMessage(m.chat, { text: info }, { quoted: m });
};

handler.help = ['status'];
handler.tags = ['info'];
handler.command = /^(status)$/i;

export default handler;
