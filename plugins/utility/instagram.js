const RAPID_KEY = "c9d9e589b3mshc7eecec96ccc03ep126bb1jsnbd4082441abd"
const IG_HOST = "instagram120.p.rapidapi.com"

async function fetchIG(endpoint, body) {
  try {
    const res = await fetch(`https://${IG_HOST}/${endpoint}`, {
      method: "POST",
      headers: {
        "x-rapidapi-key": RAPID_KEY,
        "x-rapidapi-host": IG_HOST,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
    return await res.json()
  } catch {
    return null
  }
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

  if (!cmd) {
    return m.reply(
      `📸 *Comandi Instagram*\n` +
      `• .instagram profilo @utente\n` +
      `• .instagram post @utente\n` +
      `• .instagram storie @utente`
    )
  }

  // PROFILO — 888
  if (cmd === "profilo") {
    const username = args[1]?.replace("@", "")
    if (!username) return m.reply("❌ Specifica un utente.\nEsempio: .instagram profilo @cristiano")

    await m.reply(`🔍 Cerco il profilo @${username}...`)

    const data = await fetchIG("api/instagram/profile", { username })
    if (!data?.result) return m.reply("❌ Utente non trovato.")

    const u = data.result
    const nome = u.full_name || username
    const bio = u.biography || "Nessuna bio"
    const followers = formatNum(u.follower_count || u.edge_followed_by?.count)
    const following = formatNum(u.following_count || u.edge_follow?.count)
    const post = formatNum(u.media_count || u.edge_owner_to_timeline_media?.count)
    const verificato = u.is_verified ? "✅ Verificato" : ""
    const privato = u.is_private ? "🔒 Privato" : "🌍 Pubblico"
    const categoria = u.category || ""
    const sito = u.external_url ? `\n🌐 ${u.external_url}` : ""
    const avatar = u.profile_pic_url || u.hd_profile_pic_url_info?.url

    const testo =
      `📸 *Profilo Instagram*\n` +
      `👤 ${nome} ${verificato}\n` +
      `🔗 @${u.username || username}\n` +
      `${privato}${categoria ? `\n📌 ${categoria}` : ""}${sito}\n\n` +
      `👥 Follower: ${followers}\n` +
      `➡️ Following: ${following}\n` +
      `🖼 Post: ${post}\n\n` +
      `📝 Bio:\n${bio}`

    if (avatar) {
      await conn.sendMessage(chat, { image: { url: avatar }, caption: testo }, { quoted: m })
    } else {
      await conn.sendMessage(chat, { text: testo }, { quoted: m })
    }
    return
  }

  // POST — 888
  if (cmd === "post") {
    const username = args[1]?.replace("@", "")
    if (!username) return m.reply("❌ Specifica un utente.\nEsempio: .instagram post @cristiano")

    await m.reply(`🔍 Cerco i post di @${username}...`)

    const data = await fetchIG("api/instagram/posts", { username, maxId: "" })
    if (!data?.result?.edges?.length) return m.reply("❌ Nessun post trovato o profilo privato.")

    const posts = data.result.edges.slice(0, 6)

    let testo = `🖼 *Ultimi post di @${username}*\n`

    for (let i = 0; i < posts.length; i++) {
      const node = posts[i].node
      const caption = node.caption?.text?.slice(0, 80) || "Nessuna didascalia"
      const likes = formatNum(node.like_count || node.edge_media_preview_like?.count)
      const commenti = formatNum(node.comment_count || node.edge_media_to_comment?.count)
      const tipo = node.is_video ? "🎬 Video" :
                   node.__typename === "XDTGraphSidecar" ? "🖼 Carosello" : "🖼 Foto"
      const link = `https://instagram.com/p/${node.code}`

      testo +=
        `\n${i + 1}. ${tipo}\n` +
        `❤️ ${likes}   💬 ${commenti}\n` +
        `📝 ${caption.replace(/\n/g, " ")}...\n` +
        `🔗 ${link}\n`
    }

    const first = posts[0].node
    const img = first.thumbnail_src || first.display_url || first.image_versions2?.candidates?.[0]?.url

    if (img) {
      await conn.sendMessage(chat, { image: { url: img }, caption: testo }, { quoted: m })
    } else {
      await conn.sendMessage(chat, { text: testo }, { quoted: m })
    }
    return
  }

  // STORIE — 888
  if (cmd === "storie") {
    const username = args[1]?.replace("@", "")
    if (!username) return m.reply("❌ Specifica un utente.\nEsempio: .instagram storie @cristiano")

    await m.reply(`🔍 Cerco le storie di @${username}...`)

    const data = await fetchIG("api/instagram/stories", { username })
    if (!data?.result?.length) return m.reply(`❌ Nessuna storia attiva per @${username}.`)

    const storie = data.result

    await m.reply(
      `📖 *Storie attive*\n` +
      `👤 @${username}\n` +
      `📚 Totale: ${storie.length}\n` +
      `Le invio una per una...`
    )

    for (let i = 0; i < Math.min(storie.length, 10); i++) {
      const storia = storie[i]
      const isVideo = storia.video_versions?.length > 0
      const caption = `📖 Storia ${i + 1}/${storie.length} — @${username}`

      try {
        if (isVideo) {
          await conn.sendMessage(chat, { video: { url: storia.video_versions[0].url }, caption }, { quoted: m })
        } else {
          const imgUrl = storia.image_versions2?.candidates?.[0]?.url
          if (imgUrl) {
            await conn.sendMessage(chat, { image: { url: imgUrl }, caption }, { quoted: m })
          }
        }
        await new Promise(r => setTimeout(r, 700))
      } catch {}
    }
    return
  }

  return m.reply(
    `📸 *Comandi Instagram*\n` +
    `• .instagram profilo @utente\n` +
    `• .instagram post @utente\n` +
    `• .instagram storie @utente`
  )
}

handler.command = ["instagram"]
handler.before = async () => false
export default handler