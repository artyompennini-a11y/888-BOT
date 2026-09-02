import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { makeCard, sendImage } from './lastfm-card.js';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Inizializzazione sicura del database separando utenti, fuoco e preferiti
let db = { users: {}, likes: {}, favorites: {} };
if (fs.existsSync(DB_PATH)) {
  try {
    const fileData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    db = {
      users: fileData.users || {},
      likes: fileData.likes || {},
      favorites: fileData.favorites || {}
    };
  } catch (e) {
    console.error('Errore nel caricamento del database Last.fm, resetto...', e);
  }
}

function saveDB() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

const invalidateRecentCache = (username) => {}; 
const generateSongId = (username, artist, song) =>
  `${username}_${artist}_${song}`.toLowerCase().replace(/\s+/g, '');

const addSongLike = (songId, sender) => {
  if (!db.likes[songId]) db.likes[songId] = [];
  if (db.likes[songId].includes(sender)) return { alreadyLiked: true };
  db.likes[songId].push(sender);
  saveDB();
  return { alreadyLiked: false };
};

// ❤️ PREFERITI: aggiunge una canzone ai preferiti dell'utente
const addFavorite = (userId, artist, song) => {
  if (!db.favorites[userId]) db.favorites[userId] = [];
  const dup = db.favorites[userId].some(
    (f) => f.artist.toLowerCase() === artist.toLowerCase() && f.song.toLowerCase() === song.toLowerCase()
  );
  if (dup) return { alreadyFav: true };
  db.favorites[userId].push({ artist, song, at: Date.now() });
  saveDB();
  return { alreadyFav: false };
};

const getFavorites = (userId) => db.favorites[userId] || [];

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

/**
 * Dettagli globali del brano (quante volte è stato ascoltato, da chi e da te).
 */
async function getTrackInfo(artist, track, username) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&username=${encodeURIComponent(username || '')}&api_key=${LASTFM_API_KEY}&format=json&autocorrect=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.track || null;
  } catch {
    return null;
  }
}

/**
 * Statistiche globali dell'artista (ascoltatori mensili + ascolti totali).
 */
async function getArtistInfo(artist) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json&autocorrect=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.artist || null;
  } catch {
    return null;
  }
}

// Formatta i numeroni in maniera leggibile (1.2M, 340k, 567)
const formatCount = (n) => {
  const num = parseInt(n, 10) || 0;
  if (num >= 1e6) return `${(num / 1e6).toFixed(num >= 1e7 ? 0 : 1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(num >= 1e5 ? 0 : 1)}k`;
  return String(num);
};

const handler = async (m, { conn, args, usedPrefix, text, command }) => {

  // COMANDO: SETUSER
  if (command === 'setuser') {
    const username = text.trim();
    if (!username) {
      return conn.sendMessage(m.chat, {
        text: `❌ Usa il comando così: ${usedPrefix + command} <username>`
      }, { quoted: m });
    }
    db.users[m.sender] = username;
    saveDB();
    return conn.sendMessage(m.chat, {
      text: `✅ Username Last.fm impostato su *${username}*`
    }, { quoted: m });
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
      return conn.sendMessage(m.chat, {
        text: '❌ Nessun brano trovato o utente inesistente su Last.fm.'
      }, { quoted: m });
    }

    let imageBuffer;
    try {
      imageBuffer = await makeCard(track, user);
    } catch (e) {
      console.error('[cur] makeCard error:', e.message);
      return conn.sendMessage(m.chat, {
        text: '❌ Errore nella generazione della card grafica.'
      }, { quoted: m });
    }

    const songTitle = track.name || 'Traccia sconosciuta';
    const artistName = track.artist?.['#text'] || 'Artista sconosciuto';
    const searchQuery = `${songTitle} ${artistName}`;

    // 🌐 Link di ascolto su YouTube e Spotify
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`;

    // 📊 Statistiche di ascolto (Last.fm)
    const [trackInfo, artistInfo] = await Promise.all([
      getTrackInfo(artistName, songTitle, user),
      getArtistInfo(artistName)
    ]);

    const playCount      = trackInfo?.playcount      || 0; // quante volte è stata ascoltata la canzone
    const listeners      = trackInfo?.listeners      || 0; // da quante persone
    const userPlayCount  = trackInfo?.userplaycount  || 0; // quante volte la ascolti tu
    const artListeners   = artistInfo?.stats?.listeners  || 0; // ascoltatori mensili dell'artista
    const artPlaycount   = artistInfo?.stats?.playcount  || 0; // ascolti totali dell'artista

    // 🖼️ Copertina dell'album per la preview esterna
    const albumArt =
      track.image?.find(i => i.size === 'extralarge')?.['#text'] ||
      track.image?.find(i => i.size === 'large')?.['#text'] ||
      'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';

    // 🎛️ Card esterna immersiva (spunto da gp-aperto.js)
    const externalAdReply = {
      title: songTitle,
      body: `${artistName} • 🎧 ${user} • 𝟴𝟴𝟴 𝗕𝗢𝗧`,
      thumbnailUrl: albumArt,
      sourceUrl: youtubeUrl,
      mediaType: 1,
      renderLargerThumbnail: true
    };

    const caption = [
      `🎧 *Now Playing* • ${user}`,
      '',
      `🎵 *Brano:* ${songTitle}`,
      `👤 *Artista:* ${artistName}`,
      '',
      `╭─ 📊 *Quanto è ascoltata* ─╮`,
      `│ 🔥 ${formatCount(playCount)} ascolti totali`,
      `│ 👥 ${formatCount(listeners)} ascoltatori`,
      `│ 🎤 ${formatCount(artListeners)} ascoltatori/mese per ${artistName}`,
      `│ 💿 ${formatCount(artPlaycount)} ascolti in carriera dell'artista`,
      `│ 💫 Tu l'hai ascoltata ${formatCount(userPlayCount)} volte`,
      `╰──────────────────────╯`,
      '',
      `💬 Collegala a Last.fm e usa ` + '`' + `${usedPrefix}setuser <username>` + '`' + ` per la tua!`,
      `🎬 *Premi un pulsante qui sotto per ascoltarla o dargli fuoco 🔥*`
    ].join('\n');

    // 🔘 Pulsanti native: QUICK_REPLY (Like ❤️ + Fuoco 🔥) + CTA_URL (YouTube/Spotify)
    const buttons = [
      ['❤️ Metti nei preferiti', `.like ${m.sender}`],
      ['🔥 Fuoco (non mi piace)', `.fuoco ${m.sender}`]
    ];
    const urls = [
      ['▶️ Ascolta su YouTube', youtubeUrl],
      ['🎧 Ascolta su Spotify', spotifyUrl]
    ];
    const footer = ' 𝟴𝟴𝟴 𝗕𝗢𝗧 - Now Playing';

    try {
      await conn.sendNCarousel(m.chat, caption, footer, imageBuffer, buttons, null, urls, null, m);
    } catch (err) {
      console.error('[cur] sendNCarousel fallito, mando immagine semplice:', err.message);
      try {
        await sendImage(conn, m, imageBuffer, caption, [], { externalAdReply });
      } catch (err2) {
        await conn.sendMessage(m.chat, {
          image: imageBuffer,
          caption: caption
        }, { quoted: m });
      }
    }
    return;
  }

  // COMANDO: TOP / STATS
  if (command === 'top' || command === 'stats') {
    const artists = await getTopArtists(user);
    if (!artists || !artists.length) {
      return conn.sendMessage(m.chat, {
        text: '❌ Nessun dato trovato per gli ultimi 7 giorni.'
      }, { quoted: m });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const topList = artists
      .map((a, i) =>
        `${medals[i]} *${a.name}*\n📊 ${a.playcount} scrobble${parseInt(a.playcount) > 1 ? 's' : ''}`
      )
      .join('\n\n');

    return conn.sendMessage(m.chat, {
      text: `🏆 *Top artisti di ${user}* (ultimi 7 giorni)\n\n${topList}`
    }, { quoted: m });
  }

  // COMANDO: LIKE ❤️ — mette la canzone nei TUOI preferiti
  if (command === 'like') {
    let targetUserId =
      m.quoted && !m.quoted.fromMe
        ? m.quoted.sender
        : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null);

    if (!targetUserId && args[0]) {
      const parsedArg = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      if (db.users[parsedArg]) {
        targetUserId = parsedArg;
      }
    }

    // Di default salvi la canzone che stai ascoltando tu
    targetUserId = targetUserId || m.sender;

    const targetUsername = db.users[targetUserId];
    if (!targetUsername) {
      return conn.sendMessage(m.chat, {
        text: '❌ Quell\'utente non ha ancora registrato un account Last.fm.'
      }, { quoted: m });
    }

    const track = await getRecentTrack(targetUsername);
    if (!track) {
      return conn.sendMessage(m.chat, {
        text: '❌ Impossibile recuperare l\'ultimo brano dell\'utente.'
      }, { quoted: m });
    }

    const artist = track.artist?.['#text'] || 'Unknown';
    const songName = track.name || 'Unknown';

    const result = addFavorite(m.sender, artist, songName);

    if (result.alreadyFav) {
      return conn.sendMessage(m.chat, {
        text: `❤️ *${songName}* di *${artist}* è già tra i tuoi preferiti!`
      }, { quoted: m });
    }

    return conn.sendMessage(m.chat, {
      text: `❤️ Aggiunto *${songName}* di *${artist}* ai tuoi preferiti!\n📋 Guardali con ${usedPrefix}curlike`
    }, { quoted: m });
  }

  // COMANDO: FUOCO 🔥 — SOLO gli altri possono dare fuoco alla musica (non mi piace)
  if (command === 'fuoco') {
    let targetUserId =
      m.quoted && !m.quoted.fromMe
        ? m.quoted.sender
        : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null);

    if (!targetUserId && args[0]) {
      const parsedArg = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      if (db.users[parsedArg]) {
        targetUserId = parsedArg;
      }
    }

    if (!targetUserId) {
      return conn.sendMessage(m.chat, {
        text: '⚠️ Devi premere il bottone sotto la card, rispondere al messaggio di un utente o menzionarlo per dargli fuoco 🔥!'
      }, { quoted: m });
    }

    const targetUsername = db.users[targetUserId];
    if (!targetUsername) {
      return conn.sendMessage(m.chat, {
        text: '❌ Questo utente non ha ancora registrato un account Last.fm.'
      }, { quoted: m });
    }

    if (m.sender === targetUserId) {
      return conn.sendMessage(m.chat, {
        text: '🔥 Non puoi mettere a fuoco la tua stessa musica!'
      }, { quoted: m });
    }

    invalidateRecentCache(targetUsername);
    const track = await getRecentTrack(targetUsername);
    if (!track) {
      return conn.sendMessage(m.chat, {
        text: '❌ Impossibile recuperare i dettagli dell\'ultimo brano dell\'utente.'
      }, { quoted: m });
    }

    const artist = track.artist?.['#text'] || 'Unknown';
    const songName = track.name || 'Unknown';

    const songId = generateSongId(targetUsername, artist, songName);
    const result = addSongLike(songId, m.sender);

    if (result.alreadyLiked) {
      return conn.sendMessage(m.chat, {
        text: `⚠️ Hai già messo fuoco a "${songName}" ascoltata da ${targetUsername}!`
      }, { quoted: m });
    }

    const targetName = getUsernameFromId(targetUserId);
    return conn.sendMessage(m.chat, {
      text: `🔥 Hai messo fuoco a *${songName}* di *${targetName}*!`
    }, { quoted: m });
  }
};

handler.command = ['setuser', 'profilo', 'cur', 'stats', 'fuoco', 'like'];
handler.tags = ['fun'];
handler.group = true;

export default handler;