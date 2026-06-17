import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const USERS_FILE = path.join(__dirname, '..', 'lastfm_users.json')
const LIKES_FILE = path.join(__dirname, '..', 'song_likes.json')

if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '{}', 'utf8')
if (!fs.existsSync(LIKES_FILE)) fs.writeFileSync(LIKES_FILE, '{}', 'utf8')

const cache = new Map()

const CACHE_DURATION = 300000
const RECENT_TRACK_CACHE_DURATION = 30000

const LASTFM_API_KEY = '36f859a1fc4121e7f0e931806507d5f9'

function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')
}

function loadLikes() {
  return JSON.parse(fs.readFileSync(LIKES_FILE, 'utf8'))
}

function saveLikes(likes) {
  fs.writeFileSync(LIKES_FILE, JSON.stringify(likes, null, 2), 'utf8')
}

function getLastfmUsername(userId) {
  return loadUsers()[userId] || null
}

function setLastfmUsername(userId, username) {
  const users = loadUsers()
  users[userId] = username
  saveUsers(users)
}

function getSongLikes(songId) {
  const likes = loadLikes()
  const songData = likes[songId]

  if (!songData) return 0

  return songData.likes || 0
}

function addSongLike(songId, userId) {
  const likes = loadLikes()

  if (!likes[songId]) {
    likes[songId] = {
      likes: 0,
      likedBy: []
    }
  }

  const songData = likes[songId]

  if (!songData.likedBy) songData.likedBy = []

  if (songData.likedBy.includes(userId)) {
    return {
      success: false,
      alreadyLiked: true,
      total: songData.likes
    }
  }

  songData.likes++
  songData.likedBy.push(userId)

  saveLikes(likes)

  return {
    success: true,
    alreadyLiked: false,
    total: songData.likes
  }
}

function getUserLikesReceived(userId) {
  const users = loadUsers()
  const userLastfm = users[userId]

  if (!userLastfm) return 0

  const likes = loadLikes()

  let totalLikesReceived = 0

  for (const songId in likes) {
    const parts = songId.split('_')

    if (
      parts.length > 0 &&
      parts[0].toLowerCase() === userLastfm.toLowerCase()
    ) {
      totalLikesReceived += likes[songId].likes || 0
    }
  }

  return totalLikesReceived
}

function getUsernameFromId(userId) {
  const users = loadUsers()
  return users[userId] || null
}

function getIdFromUsername(username) {
  const users = loadUsers()

  for (const [id, user] of Object.entries(users)) {
    if (user.toLowerCase() === username.toLowerCase()) {
      return id
    }
  }

  return null
}

function generateSongId(username, artist, track) {
  return `${username}_${artist}_${track}`
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
}

function invalidateRecentCache(username) {
  const recentUrl =
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${LASTFM_API_KEY}&format=json&limit=1`

  cache.delete(recentUrl)

  const historyUrl =
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${LASTFM_API_KEY}&format=json&limit=10`

  cache.delete(historyUrl)
}

async function fetchWithCache(
  url,
  cacheDuration = CACHE_DURATION
) {
  const now = Date.now()

  const cached = cache.get(url)

  if (cached && now - cached.timestamp < cacheDuration) {
    return cached.data
  }

  try {
    const res = await fetch(url)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const json = await res.json()

    cache.set(url, {
      data: json,
      timestamp: now
    })

    return json

  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

async function getUserInfo(username) {
  const url =
    `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${LASTFM_API_KEY}&format=json`

  const data = await fetchWithCache(url)

  return data?.user
}

async function getTrackInfo(username, artist, track) {
  const url =
    `https://ws.audioscrobbler.com/2.0/?method=track.getinfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&username=${username}&format=json`

  const data = await fetchWithCache(url)

  return data?.track
}

async function getRecentTrack(username) {
  const url =
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${LASTFM_API_KEY}&format=json&limit=1`

  const data = await fetchWithCache(
    url,
    RECENT_TRACK_CACHE_DURATION
  )

  return data?.recenttracks?.track?.[0]
}

async function getRecentTracks(username, limit = 10) {
  const url =
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${LASTFM_API_KEY}&format=json&limit=${limit}`

  const data = await fetchWithCache(
    url,
    RECENT_TRACK_CACHE_DURATION
  )

  return data?.recenttracks?.track || []
}

const handler = async (
  m,
  {
    conn,
    usedPrefix,
    text,
    command
  }
) => {

  if (command === 'setuser') {

    const username = text.trim()

    if (!username) {
      return conn.sendMessage(m.chat, {
        text: `❌ Usa: ${usedPrefix}setuser <username>`
      })
    }

    setLastfmUsername(m.sender, username)

    return conn.sendMessage(m.chat, {
      text: `✅ Username *${username}* salvato!`
    })
  }

  if (command === 'like') {

    const targetUser =
      m.mentionedJid?.[0] || text.trim()

    if (!targetUser && !text) {
      return conn.sendMessage(m.chat, {
        text:
`❌ Specifica l'utente!

Esempio:
• ${usedPrefix}like @utente
• ${usedPrefix}like username`
      })
    }

    let targetUsername
    let targetUserId

    if (targetUser.includes('@')) {

      targetUserId = targetUser

      targetUsername =
        getUsernameFromId(targetUserId)

      if (!targetUsername) {
        return conn.sendMessage(m.chat, {
          text:
`❌ L'utente menzionato non ha registrato un username Last.fm!

Digli di usare ${usedPrefix}setuser`
        })
      }

    } else {

      targetUsername = targetUser

      targetUserId =
        getIdFromUsername(targetUsername)

      if (!targetUserId) {
        return conn.sendMessage(m.chat, {
          text:
`❌ Nessun utente trovato con username *${targetUsername}*`
        })
      }
    }

    invalidateRecentCache(targetUsername)

    const track =
      await getRecentTrack(targetUsername)

    if (!track) {
      return conn.sendMessage(m.chat, {
        text: '❌ Nessuna traccia trovata.'
      })
    }

    const artist =
      track.artist?.['#text'] || 'unknown'

    const songName =
      track.name || 'unknown'

    const songId =
      generateSongId(
        targetUsername,
        artist,
        songName
      )

    const result =
      addSongLike(songId, m.sender)

    if (result.alreadyLiked) {
      return conn.sendMessage(m.chat, {
        text:
`❌ Hai già messo like a "${songName}" di ${targetUsername}!`
      })
    }

    const targetName =
      getUsernameFromId(targetUserId) ||
      targetUsername

    return conn.sendMessage(m.chat, {
      text:
`🔥 Hai messo fuoco a *${songName}* di ${targetName}!`
    })
  }

  if (command === 'mylikes') {

    const user =
      getLastfmUsername(m.sender)

    if (!user) {
      return conn.sendMessage(m.chat, {
        text:
`❌ Registrati con ${usedPrefix}setuser <username>`
      })
    }

    const likesReceived =
      getUserLikesReceived(m.sender)

    return conn.sendMessage(m.chat, {
      text:
`📊 *Statistiche Like* di *${user}*

❤️ Likes ricevuti totali: ${likesReceived}

Usa ${usedPrefix}like @utente per mettere like alla canzone di qualcuno!`
    })
  }

  const user =
    getLastfmUsername(m.sender)

  if (!user) {
    return conn.sendMessage(m.chat, {
      text:
`❌ Registrati con ${usedPrefix}setuser <username>`
    })
  }

  if (command === 'cur') {

    invalidateRecentCache(user)

    const track =
      await getRecentTrack(user)

    if (!track) {
      return conn.sendMessage(m.chat, {
        text: '❌ Nessuna traccia trovata.'
      })
    }

    const nowPlaying =
      track['@attr']?.nowplaying === 'true'

    const artist =
      track.artist?.['#text'] ||
      'Artista sconosciuto'

    const title =
      track.name ||
      'Brano sconosciuto'

    const album =
      track.album?.['#text'] ||
      'Album sconosciuto'

    const image =
      track.image?.find(
        img => img.size === 'extralarge'
      )?.['#text'] || null

    const info =
      await getTrackInfo(
        user,
        artist,
        title
      )

    const userInfo =
      await getUserInfo(user)

    const likesReceived =
      getUserLikesReceived(m.sender)

    const caption =
`
🎧 ${nowPlaying ? 'In riproduzione' : 'Ultimo brano'} di ${user}

🎵 ${title}
🎤 ${artist}
💿 ${album}

▶️ Ascolti Personali: ${info?.userplaycount || 0}
🌍 Ascolti Globali: ${info?.playcount || 0}
📊 Ascolti Totali: ${userInfo?.playcount || 0}
🔥 Likes ricevuti totali: ${likesReceived}
`.trim()

    const buttons = [
      {
        buttonId: `${usedPrefix}like ${user}`,
        buttonText: {
          displayText: '🔥 Like'
        },
        type: 1
      },
      {
        buttonId: `${usedPrefix}cronologia`,
        buttonText: {
          displayText: '📜 Cronologia'
        },
        type: 1
      },
      {
        buttonId: `${usedPrefix}play ${title} ${artist}`,
        buttonText: {
          displayText: '▶️ Play'
        },
        type: 1
      }
    ]

    if (image) {

      await conn.sendMessage(
        m.chat,
        {
          image: { url: image },
          caption,
          footer: `Last.fm • ${user}`,
          buttons,
          headerType: 4
        },
        { quoted: m }
      )

    } else {

      await conn.sendMessage(
        m.chat,
        {
          text: caption,
          footer: `Last.fm • ${user}`,
          buttons,
          headerType: 1
        },
        { quoted: m }
      )
    }

    return
  }

  if (command === 'cronologia') {

    invalidateRecentCache(user)

    const tracks =
      await getRecentTracks(user, 10)

    if (!tracks.length) {
      return conn.sendMessage(m.chat, {
        text: '❌ Nessuna cronologia trovata.'
      })
    }

    const trackList =
      tracks.map((track, i) => {

        const nowPlaying =
          track['@attr']?.nowplaying === 'true'

        const icon =
          nowPlaying
            ? '▶️'
            : `${i + 1}.`

        const time =
          track.date
            ? new Date(
                track.date['#text']
              ).toLocaleTimeString(
                'it-IT',
                {
                  hour: '2-digit',
                  minute: '2-digit'
                }
              )
            : ''

        return `${icon} ${track.name}
🎤 ${track.artist['#text']}
${time ? `🕐 ${time}` : ''}`

      }).join('\n\n')

    const buttons = [
      {
        buttonId: `${usedPrefix}cur`,
        buttonText: {
          displayText: '🎧 Corrente'
        },
        type: 1
      }
    ]

    await conn.sendMessage(
      m.chat,
      {
        text:
`📜 Cronologia di ${user}

${trackList}`,
        footer: 'Ultime 10 tracce',
        buttons,
        headerType: 1
      },
      { quoted: m }
    )

    return
  }

  if (command === 'refresh') {

    invalidateRecentCache(user)

    return conn.sendMessage(m.chat, {
      text:
`🔄 Cache per ${user} aggiornata!`
    })
  }
}

handler.command = [
  'setuser',
  'cur',
  'like',
  'cronologia',
  'mylikes',
  'refresh'
]

handler.group = true
handler.tags = ['lastfm']

export default handler
