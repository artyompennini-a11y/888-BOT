import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { makeCard, sendImage } from './lastfm-card.js';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Inizializzazione sicura del database separando utenti e mi piace
let db = { users: {}, likes: {} };
if (fs.existsSync(DB_PATH)) {
  try {
    const fileData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    db = {
      users: fileData.users || {},
      likes: fileData.likes || {}
    };
  } catch (e) {
    console.error('Errore nel caricamento del database Last.fm, resetto...', e);
  }
}

function saveDB() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

const invalidateRecentCache = (username) => {}; 
const generateSongId = (username, artist, song) => `${username}_${artist}_${song}`.toLowerCase().replace(/\s+/g, '');

const addSongLike = (songId, sender) => {
  if (!db.likes[songId]) db.likes[songId] = [];
  if (db.likes[songId].includes(sender)) return { alreadyLiked: true };
  db.likes[songId].push(sender);
  saveDB();
  return { alreadyLiked: false };
};

const getUsernameFromId = (id) => db.users[id] || id;

const LASTFM_API_KEY = '36f859a1fc4121e7f0e931806507d5f9';

async function getRecentTrack(username) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.recenttracks?.track?.[0] || null;
  } catch {
    return null;
  }
}

async function getTopArtists(username) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${encodeURIComponent(username)}&api_key=${LASTFM_API_KEY}&format=json&period=7day&limit=3`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.topartists?.artist || null;
  } catch {
    return null;
  }
}

const handler = async (m, { conn, args, usedPrefix, text, command, groupMetadata }) => {

  // COMANDO: SETUSER
  if (command === 'setuser') {
    const username = text.trim();
    if (!username) {
      return conn.sendMessage(m.chat, { text: `❌ Usa il comando così: ${usedPrefix + command} <username>` }, { quoted: m });
    }
    db.users[m.sender] = username;
    saveDB();
    return conn.sendMessage(m.chat, { text: `✅ Username Last.fm impostato su *${username}*` }, { quoted: m });
  }

  // Controllo sessione utente registrato
  const user = db.users[m.sender];
  if (!user) {
    return conn.sendMessage(m.chat, {
      text: `⚠️ Usa prima \`${usedPrefix}setuser <username>\` per collegare il tuo account Last.fm.`
    }, { quoted: m });
  }

  // COMANDO: PROFILO / CUR
  if (command === 'profilo' || command === 'cur') {
    const track = await getRecentTrack(user);
    if (!track) {
      return conn.sendMessage(m.chat, { text: '❌ Nessun brano trovato o utente inesistente su Last.fm.' }, { quoted: m });
    }

    let imageBuffer;
    try {
      imageBuffer = await makeCard(track, user);
    } catch (e) {
      console.error('[cur] makeCard error:', e.message);
      return conn.sendMessage(m.chat, { text: '❌ Errore nella generazione della card grafica.' }, { quoted: m });
    }

    const songTitle = track.name || 'Traccia sconosciuta';
    const artistName = track.artist?.['#text'] || 'Artista sconosciuto';
    const searchQuery = `${songTitle} ${artistName}`;

    // Struttura bottoni standardizzata
    const buttons = [
      { buttonId: `.play ${searchQuery}`, buttonText: { displayText: `🎵 ${songTitle.substring(0, 18)}${songTitle.length > 18 ? '…' : ''}` }, type: 1 },
      { buttonId: `.salva ${searchQuery}`, buttonText: { displayText: '💾 Salva' }, type: 1 },
      { buttonId: `.fuoco ${m.sender}`, buttonText: { displayText: '🔥 Metti a fuoco' }, type: 1 }
    ];

    const caption = 
      `🎵 *Se vuoi farlo anche tu, registrati su Last.fm, collega Spotify e usa /setuser*\n\n` +
      `🎵 In ascolto: *${songTitle}*\n` +
      `👤 Artista: *${artistName}*`;

    try {
      await sendImage(conn, m, imageBuffer, caption, buttons);
    } catch (err) {
      // Fallback testuale se le funzioni del bot non supportano i pulsanti customizzati
      await conn.sendMessage(m.chat, { image: imageBuffer, caption: caption }, { quoted: m });
    }
    return;
  }

  // COMANDO: TOP / STATS
  if (command === 'top' || command === 'stats') {
    const artists = await getTopArtists(user);
    if (!artists || !artists.length) {
      return conn.sendMessage(m.chat, { text: '❌ Nessun dato trovato per gli ultimi 7 giorni.' }, { quoted: m });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const topList = artists
      .map((a, i) => `${medals[i]} *${a.name}*\n📊 ${a.playcount} scrobble${parseInt(a.playcount) > 1 ? 's' : ''}`)
      .join('\n\n');

    return conn.sendMessage(m.chat, {
      text: `🏆 *Top artisti di ${user}* (ultimi 7 giorni)\n\n${topList}`
    }, { quoted: m });
  }

  // COMANDO: FUOCO / LIKE
  if (command === 'fuoco' || command === 'like') {
    let targetUserId = m.quoted && !m.quoted.fromMe ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null);

    if (!targetUserId && args[0]) {
      const parsedArg = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      if (db.users[parsedArg]) {
        targetUserId = parsedArg;
      }
    }

    if (!targetUserId) {
      return conn.sendMessage(m.chat, { text: '⚠️ Devi premere il bottone sotto la card, rispondere al messaggio di un utente o menzionarlo per dargli fuoco 🔥!' }, { quoted: m });
    }

    const targetUsername = db.users[targetUserId];
    if (!targetUsername) {
      return conn.sendMessage(m.chat, { text: '❌ Questo utente non ha ancora registrato un account Last.fm.' }, { quoted: m });
    }

    if (m.sender === targetUserId) {
      return conn.sendMessage(m.chat, { text: '🔥 Non puoi mettere a fuoco la tua stessa musica!' }, { quoted: m });
    }

    invalidateRecentCache(targetUsername);
    const track = await getRecentTrack(targetUsername);
    if (!track) {
      return conn.sendMessage(m.chat, { text: '❌ Impossibile recuperare i dettagli dell\'ultimo brano dell\'utente.' }, { quoted: m });
    }

    const artist = track.artist?.['#text'] || 'Unknown';
    const songName = track.name || 'Unknown';

    const songId = generateSongId(targetUsername, artist, songName);
    const result = addSongLike(songId, m.sender);

    if (result.alreadyLiked) {
      return conn.sendMessage(m.chat, { text: `⚠️ Hai già messo fuoco a "${songName}" ascoltata da ${targetUsername}!` }, { quoted: m });
    }

    const targetName = getUsernameFromId(targetUserId);
    return conn.sendMessage(m.chat, { text: `🔥 Hai messo fuoco a *${songName}* di *${targetName}*!` }, { quoted: m });
  }
};

handler.command = ['setuser', 'profilo', 'cur', 'stats', 'top', 'fuoco', 'like'];
handler.tags    = ['fun'];
handler.group   = true;

export default handler;
