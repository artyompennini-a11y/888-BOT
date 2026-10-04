import os from 'os';

let handler = async (m, { conn }) => {

  const memory = process.memoryUsage();
  const ramUsed = (memory.heapUsed / 1024 / 1024).toFixed(1);
  const ramTotal = (memory.heapTotal / 1024 / 1024).toFixed(1);

  let cpuInfo = "N/D";
  try {
    const cpu = os.cpus()?.[0];
    cpuInfo = cpu?.model?.trim() || "N/D";
  } catch {
    cpuInfo = "N/D";
  }

  const uptimeSeconds = process.uptime().toFixed(0);

  const info =
    `⚙️ *Stato Sistema*\n` +
    `• Connessione: 🟢 Ottima\n` +
    `• RAM: ${ramUsed}MB / ${ramTotal}MB\n` +
    `• CPU: ${cpuInfo}\n` +
    `• Uptime: ${uptimeSeconds}s`;

  await conn.sendMessage(m.chat, { text: info }, { quoted: m });
};

handler.help = ['status'];
handler.tags = ['info'];
handler.command = /^(status)$/i;

export default handler;