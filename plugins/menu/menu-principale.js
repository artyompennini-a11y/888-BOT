import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MENU_SECTIONS = [
  {
    title: 'MENU PRINCIPALE',
    video: 'menu-funzioni.mp4',
    image: 'settings.png',
    rows: [
      { title: '⚙️ 𝐅𝐮𝐧𝐳𝐢𝐨𝐧𝐢', command: 'funzioni' },
      { title: '🛡️ 𝐌𝐨𝐝𝐞𝐫𝐚𝐭𝐨𝐫𝐢', command: 'mods' },
      { title: '👑 𝐀𝐝𝐦𝐢𝐧', command: 'admin' },
    ],
  },
  {
    title: 'GIOCHI, RPG E AUDIO',
    video: 'menu-giochi.mp4',
    image: 'pokemon_battle.png',
    rows: [
      { title: '🎮 𝐆𝐢𝐨𝐜𝐡𝐢', command: 'giochi' },
      { title: '🎰 𝐑𝐏𝐆', command: 'rpg' },
      { title: '🎵 𝐀𝐮𝐝𝐢𝐨', command: 'menuaudio' },
    ],
  },
  {
    title: 'STATS E OWNER',
    video: 'menu-stats.mp4',
    image: 'admin.png',
    rows: [
      { title: '📊 𝐒𝐭𝐚𝐭𝐬', command: 'modstats' },
      { title: '🔐 𝐎𝐰𝐧𝐞𝐫', command: 'owner' },
    ],
  },
];

const handler = async (m, { conn, usedPrefix = '.' }) => {
  const botName = global.db?.data?.nomedelbot || '𝟴𝟴𝟴 BOT';
  const botVersion = global.db?.data?.version || '1.5';
  const menuText = `⚡ *${botName}*\n*VERSIONE*: ${botVersion}\n\n🛡️ *Staff & Moderatori:* ${usedPrefix}mods\n\n📂 *Scorri il carosello e scegli una categoria.*`;
  const mediaDir = path.join(__dirname, '..', '..', 'media');
  const iconsDir = path.join(__dirname, '..', '..', 'icone');
  const cards = MENU_SECTIONS.map(section => ({
    ...(fs.existsSync(path.join(mediaDir, section.video))
      ? { video: fs.readFileSync(path.join(mediaDir, section.video)) }
      : { image: fs.readFileSync(path.join(iconsDir, section.image)) }),
    title: section.title,
    text: section.rows.map(({ title, command }) => `${title}\n${usedPrefix}${command}`).join('\n\n'),
    footer: botName,
    buttons: section.rows.map(({ title, command }) => ({
    buttonId: `${usedPrefix}${command}`,
    buttonText: { displayText: title },
    type: 1
    }))
  }));
  const textFallback = `${menuText}\n\n${MENU_SECTIONS.map(({ title, rows }) =>
    `📂 *${title}*\n${rows.map(({ title: rowTitle, command }) => `• ${rowTitle}: ${usedPrefix}${command}`).join('\n')}`
  ).join('\n\n')}`;

  try {
    return await conn.sendMessage(m.chat, {
      text: menuText,
      footer: botName,
      cards
    }, { quoted: m });
  } catch (error) {
    console.warn(`[MENU] Carosello non inviato: ${error.message}`);
    return conn.sendMessage(m.chat, { text: textFallback }, { quoted: m });
  }
};

handler.help = ['menu'];
handler.tags = ['menu'];
handler.command = /^(menu|comandi|commands|help)$/i;

export default handler;