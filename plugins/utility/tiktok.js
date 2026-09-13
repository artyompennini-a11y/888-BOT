const RAPID_KEY = "c9d9e589b3mshc7eecec96ccc03ep126bb1jsnbd4082441abd"
const TIK_HOST = "tiktok-api23.p.rapidapi.com"

async function fetchTik(endpoint) {
  try {
    const res = await fetch(`https://${TIK_HOST}/${endpoint}`, {
      headers: {
        "x-rapidapi-key": RAPID_KEY,
        "x-rapidapi-host": TIK_HOST
      }
    })
    return await res.json()
  } catch { return null }
}

function formatNum(n) {
  if (!n) return "0"
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B"
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K"
  return n.toString()
}

let handler = async (m, { conn, args }) => {
  const chat = m.chat
  const cmd = args[0]?.toLowerCase()

  // MENU
  if (!cmd) {
    return m.reply(
      `🎵 *Comandi TikTok*\n` +
      `• .tiktok profilo @utente\n` +
      `• .tiktok video [link]\n` +
      `• .tiktok stats [link]`
    )
  }

  // PROFILO
  if (cmd === "profilo") {
    const username = args[1]?.replace("@", "")
    if (!username) return m.reply("❌ Specifica un utente.\nEs: .tiktok profilo @charlidamelio")

    await m.reply(`🔍 Cerco il profilo @${username}...`)

    const data = await fetchTik(`api/user/info?uniqueId=${username}`)
    if (!data || data.statusCode !== 0) return m.reply("❌ Utente non trovato.")

    const user = data.userInfo?.user
    const stats = data.userInfo?.stats
    if (!user) return m.reply("❌ Errore nel recuperare il profilo.")

    const nickname = user.nickname || username
    const bio = user.signature || "Nessuna bio"
    const verified = user.verified ? "✅ Verificato" : ""
    const privato = user.privateAccount ? "🔒 Account privato" : "🌍 Account pubblico"
    const followers = formatNum(stats?.followerCount)
    const following = formatNum(stats?.followingCount)
    const likes = formatNum(stats?.heartCount)
    const video = formatNum(stats?.videoCount)
    const region = user.region || "N/D"

    const testo =
      `🎵 *Profilo TikTok*\n` +
      `👤 ${nickname} ${verified}\n` +
      `🔗 @${user.uniqueId}\n` +
      `${privato}\n` +
      `🌍 ${region}\n\n` +
      `👥 Follower: ${followers}\n` +
      `➡️ Following: ${following}\n` +
      `❤️ Like totali: ${likes}\n` +
      `🎬 Video: ${video}\n\n` +
      `📝 Bio:\n${bio}`

    if (user.avatarLarger) {
      await conn.sendMessage(chat, {
        image: { url: user.avatarLarger },
        caption: testo
      }, { quoted: m })
    } else {
      await conn.sendMessage(chat, { text: testo }, { quoted: m })
    }
    return
  }

  // VIDEO
  if (cmd === "video") {
    const url = args[1]
    if (!url || !url.includes("tiktok.com")) {
      return m.reply("❌ Manda un link TikTok valido.\nEs: .tiktok video https://tiktok.com/@...")
    }

    await m.reply("⬇️ Scarico il video...")

    const data = await fetchTik(`api/download?url=${encodeURIComponent(url)}&hd=1`)
    if (!data || data.statusCode !== 0) return m.reply("❌ Errore nel scaricare il video.")

    const video = data.data
    if (!video) return m.reply("❌ Video non trovato.")

    const title = video.title || "Video TikTok"
    const author = video.author?.nickname || "N/D"
    const likes = formatNum(video.diggCount)
    const views = formatNum(video.playCount)
    const comments = formatNum(video.commentCount)
    const shares = formatNum(video.shareCount)

    const videoUrl = video.hdplay || video.play || video.wmplay
    if (!videoUrl) return m.reply("❌ Link video non disponibile.")

    await conn.sendMessage(chat, {
      video: { url: videoUrl },
      caption:
        `🎵 *${title}*\n` +
        `👤 ${author}\n\n` +
        `▶️ Views: ${views}\n` +
        `❤️ Like: ${likes}\n` +
        `💬 Commenti: ${comments}\n` +
        `↗️ Condivisioni: ${shares}`
    }, { quoted: m })
    return
  }

  // STATISTICHE
  if (cmd === "stats") {
    const url = args[1]
    if (!url || !url.includes("tiktok.com")) {
      return m.reply("❌ Manda un link TikTok valido.\nEs: .tiktok stats https://tiktok.com/@...")
    }

    await m.reply("📊 Recupero le statistiche...")

    const data = await fetchTik(`api/download?url=${encodeURIComponent(url)}&hd=0`)
    if (!data || data.statusCode !== 0) return m.reply("❌ Errore nel recuperare le statistiche.")

    const video = data.data
    if (!video) return m.reply("❌ Video non trovato.")

    const title = video.title || "N/D"
    const author = video.author?.nickname || "N/D"
    const authorUser = video.author?.uniqueId || "N/D"
    const likes = formatNum(video.diggCount)
    const views = formatNum(video.playCount)
    const comments = formatNum(video.commentCount)
    const shares = formatNum(video.shareCount)
    const saves = formatNum(video.collectCount)
    const duration = video.duration ? `${video.duration}s` : "N/D"
    const musica = video.music?.title || "N/D"
    const musicaAutore = video.music?.author || "N/D"
    const cover = video.cover || video.origin_cover

    const testo =
      `📊 *Statistiche Video*\n` +
      `🎬 ${title}\n` +
      `👤 ${author} (@${authorUser})\n\n` +
      `▶️ Views: ${views}\n` +
      `❤️ Like: ${likes}\n` +
      `💬 Commenti: ${comments}\n` +
      `↗️ Condivisioni: ${shares}\n` +
      `🔖 Salvati: ${saves}\n` +
      `⏱ Durata: ${duration}\n\n` +
      `🎵 ${musica}\n` +
      `🎤 ${musicaAutore}`

    if (cover) {
      await conn.sendMessage(chat, {
        image: { url: cover },
        caption: testo
      }, { quoted: m })
    } else {
      await conn.sendMessage(chat, { text: testo }, { quoted: m })
    }
    return
  }

  // HELP
  return m.reply(
    `🎵 *Comandi TikTok*\n` +
    `• .tiktok profilo @utente\n` +
    `• .tiktok video [link]\n` +
    `• .tiktok stats [link]`
  )
}

handler.command = ["tiktok"]
export default handler