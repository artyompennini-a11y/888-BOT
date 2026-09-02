import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Lettura fresca del DB a ogni comando (per non perdere i salvataggi del plugin cur)
const loadDB = () => {
  let db = { users: {}, favorites: {} };
  if (fs.existsSync(DB_PATH)) {
    try {
      const fileData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      db = {
        users: fileData.users || {},
        favorites: fileData.favorites || {}
      };
    } catch (e) {
      console.error('[curlike] Errore nel caricamento del database, resetto...', e);
    }
  }
  return db;
};

const handler = async (m, { conn }) => {
  const db = loadDB();

  // Target: chi menziona/quota, altrimenti chi manda il comando
  let targetId =
    m.mentionedJid?.[0] ||
    (m.quoted && !m.quoted.fromMe ? m.quoted.sender : null) ||
    m.sender;

  const favorites = db.favorites[targetId] || [];
  const targetUser = db.users[targetId];

  if (!favorites.length) {
    const tip = targetId === m.sender
      ? `\n\n👉 Aggiungi canzoni premendo il bottone *❤️ Metti nei preferiti* sotto una card \`.cur\``
      : '';
    return conn.sendMessage(m.chat, {
      text: `❤️ *Nessun brano nei preferiti*${targetId === m.sender ? '' : ` di ${targetUser || 'questo utente'}`}${tip}`
    }, { quoted: m });
  }

  // Mostra al massimo 10 preferiti (i più recenti)
  const list = favorites.slice().reverse().slice(0, 10);

  const medals = ['🥇', '🥈', '🥉'];
  const lines = list.map((f, i) => {
    const n = i + 1;
    const medal = i < 3 ? medals[i] : `${n}.`;
    return `${medal} *${f.song}*\n   └ ${f.artist}`;
  }).join('\n\n');

  const who = targetId === m.sender ? 'i tuoi preferiti' : `i preferiti di ${targetUser || targetId.split('@')[0]}`;
  const more = favorites.length > 10 ? `\n\n… e altri ${favorites.length - 10} brani` : '';

  const text = [
    `❤️ *${who[0].toUpperCase() + who.slice(1)}* • Last.fm`,
    '',
    `📊 Totale: ${favorites.length} brani`,
    '',
    lines,
    more,
    '',
    `💬 Aggiungi altri con il bottone *❤️* sotto una card \`.cur\``
  ].join('\n');

  return conn.sendMessage(m.chat, { text }, { quoted: m });
};

handler.command = ['curlike', 'preferiti', 'mypre'];
handler.tags = ['fun'];
handler.group = true;

export default handler;