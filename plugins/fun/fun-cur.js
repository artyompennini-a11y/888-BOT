import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import yts from 'yt-search';
import { makeCard, sendImage } from '../info/lastfm-card.js';

const DB_PATH = path.join(process.cwd(), 'db.json');

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

const formatFavoriteList = (userId, label) => {
  const favorites = getFavorites(userId);
  if (!favorites.length) {
    return `❤️ *Nessun brano nei preferiti*${label ? ` di ${label}` : ''}.\n\n👉 Aggiungine uno premendo il bottone *❤️ Preferito* sotto una card.`;
  }

  const list = favorites
    .slice()
    .reverse()
    .slice(0, 8)
    .map((item, index) => `${index + 1}. *${item.song}* — *${item.artist}*`)
    .join('\n');

  const extra = favorites.length > 8 ? `\n\n… e altri ${favorites.length - 8} brani` : '';
  return `❤️ *Preferiti${label ? ` di ${label}` : ''}*\n\n${list}${extra}`;
};

const LASTFM_API_KEY = '36f859a1fc4121e7f0e931806507d5f9';

const execPromise = (cmd) => new Promise((resolve, reject) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) return reject(error);
    resolve({ stdout, stderr });
  });
});

async function downloadAudioFromQuery(query) {
  try {
    const search = await yts(query);
    const vid = search?.videos?.[0];
    if (!vid) return null;

    const tmpDir = os.tmpdir();
    const fileName = `cur_audio_${Date.now()}`;
    const outputPath = path.join(tmpDir, `${fileName}.mp3`);

    await execPromise(`yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${vid.url}"`);

    if (!fs.existsSync(outputPath)) return null;

    const buffer = fs.readFileSync(outputPath);
    fs.unlinkSync(outputPath);

    return {
      buffer,
      title: vid.title,
      url: vid.url
    };
  } catch (e) {
    console.error('[cur-download] errore:', e.message);
    return null;
  }
}

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

const formatCount = (n) => {
  const num = parseInt(n, 10) || 0;
  if (num >= 1e6) return `${(num / 1e6).toFixed(num >= 1e7 ? 0 : 1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(num >= 1e5 ? 0 : 1)}k`;
  return String(num);
};

const handler = async (m, { conn, args, usedPrefix, text, command }) => {

  if (command === 'setuser') {
    const username = (text || '').trim();
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

  if (command === 'curlike' || command === 'preferiti' || command === 'mypre') {
    const targetId = m.quoted && !m.quoted.fromMe
      ? m.quoted.sender
      : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender);

    const targetUsername = db.users[targetId];
    return conn.sendMessage(m.chat, {
      text: formatFavoriteList(targetId, targetId === m.sender ? '' : (targetUsername || targetId.split('@')[0]))
    }, { quoted: m });
  }

  if (command === 'scarica' || command === 'download' || command === 'downloadaudio') {
    const query = (text || '').trim() || (m.quoted?.text ? m.quoted.text : '');
    if (!query) {
      return conn.sendMessage(m.chat, {
        text: `❌ Usa: ${usedPrefix}${command} <titolo brano>`
      }, { quoted: m });
    }

    const result = await downloadAudioFromQuery(query);
    if (!result) {
      return conn.sendMessage(m.chat, {
        text: '❌ Nessun risultato trovato per il download audio.'
      }, { quoted: m });
    }

    return conn.sendMessage(m.chat, {
      audio: result.buffer,
      mimetype: 'audio/mpeg',
      fileName: `${(result.title || 'audio').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`,
      caption: `🎵 *Download audio*\n${result.title}`
    }, { quoted: m });
  }

  const user = db.users[m.sender];
  if (!user) {
    return conn.sendMessage(m.chat, {
      text: `⚠️ Usa prima \`${usedPrefix}setuser <username>\` per collegare il tuo account Last.fm.`
    }, { quoted: m });
  }

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

    const [trackInfo, artistInfo] = await Promise.all([
      getTrackInfo(artistName, songTitle, user),
      getArtistInfo(artistName)
    ]);

    const playCount      = trackInfo?.playcount      || 0;
    const listeners      = trackInfo?.listeners      || 0;
    const userPlayCount  = trackInfo?.userplaycount  || 0;
    const artListeners   = artistInfo?.stats?.listeners  || 0;
    const artPlaycount   = artistInfo?.stats?.playcount  || 0;

    const caption = `🎧 *Now Playing*
${songTitle}
${artistName}`.trim();

    await conn.sendMessage(
      m.chat,
      {
        image: imageBuffer,
        caption,
        interactiveButtons: [
          {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
              display_text: '💜 Mi piace',
              id: `.like ${m.sender}`
            })
          },
          {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
              display_text: '🔥 Fuoco',
              id: `.fuoco ${m.sender}`
            })
          },
          {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
              display_text: '🎵 Scarica audio',
              id: `.scarica ${searchQuery}`
            })
          }
        ]
      },
      { quoted: m }
    );

    return;
  }

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

handler.command = ['setuser', 'profilo', 'cur', 'stats', 'fuoco', 'like', 'curlike', 'preferiti', 'mypre', 'scarica', 'download', 'downloadaudio'];
handler.tags = ['fun'];
handler.group = true;

export default handler;
