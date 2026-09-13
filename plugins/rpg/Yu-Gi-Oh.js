import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const YGOAPI    = "https://db.ygoprodeck.com/api/v7/cardinfo.php"
const YGORANDOM = "https://db.ygoprodeck.com/api/v7/randomcard.php"
const DB_PATH   = path.join(process.cwd(), 'data', 'yugioh.json')
const COOLDOWN  = 5 * 60 * 1000

const ATTRIBUTI = {
  DARK:   "🌑 Oscurità",
  LIGHT:  "✨ Luce",
  FIRE:   "🔥 Fuoco",
  WATER:  "💧 Acqua",
  EARTH:  "🌍 Terra",
  WIND:   "🌪️ Vento",
  DIVINE: "⚡ Divino",
}

const TIPI_CARTA = {
  "Normal Monster":       "👾 Mostro Normale",
  "Effect Monster":       "⚡ Mostro Effetto",
  "Fusion Monster":       "🔀 Fusione",
  "Ritual Monster":       "🌙 Rituale",
  "Synchro Monster":      "💠 Sincro",
  "Xyz Monster":          "🌀 XYZ",
  "Link Monster":         "🔗 Link",
  "Pendulum Monster":     "⏳ Pendulum",
  "Spell Card":           "📗 Magia",
  "Trap Card":            "📕 Trappola",
  "Skill Card":           "🃏 Abilità",
  "Token":                "🪙 Gettone",
}

function getRarita(atk) {
  if (atk === null || atk === undefined) return { stars: "★★★☆☆", label: "Rara" }
  if (atk >= 3000) return { stars: "★★★★★", label: "Leggendaria" }
  if (atk >= 2500) return { stars: "★★★★☆", label: "Ultra Rara" }
  if (atk >= 2000) return { stars: "★★★☆☆", label: "Rara" }
  if (atk >= 1500) return { stars: "★★☆☆☆", label: "Non Comune" }
  return { stars: "★☆☆☆☆", label: "Comune" }
}

function statBar(val, max = 5000) {
  if (val === null || val === undefined || val === "?") return "░░░░░░░░░░  N/A"
  const filled = Math.round((Number(val) / max) * 10)
  return "█".repeat(Math.min(filled, 10)) + "░".repeat(Math.max(10 - filled, 0)) + `  ${val}`
}

function padId(id) {
  return String(id).padStart(8, "0")
}

function trunc(str, len) {
  if (!str) return ""
  return str.length > len ? str.slice(0, len - 1) + "…" : str
}

let yugiohSaveLock = null

async function loadDB() {
  while (yugiohSaveLock) await new Promise(r => setTimeout(r, 10))

  try {
    if (!fsSync.existsSync(DB_PATH)) {
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
      await fs.writeFile(DB_PATH, JSON.stringify({}))
    }
    const data = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

async function saveDB(db) {
  yugiohSaveLock = true
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2))
  } finally {
    yugiohSaveLock = false
  }
}

function getUser(db, userId) {
  if (!db[userId]) db[userId] = { collezione: {}, ultimaPesca: 0 }
  return db[userId]
}

async function fetchRandom() {
  const res = await fetch(YGORANDOM)
  if (!res.ok) throw new Error("err")
  return await res.json()
}

async function fetchById(id) {
  const res = await fetch(`${YGOAPI}?id=${id}`)
  if (!res.ok) throw new Error("not_found")
  const data = await res.json()
  if (data.error || !data.data?.length) throw new Error("not_found")
  return data.data[0]
}

function buildCard(card, dataPesca = null) {
  const atk     = card.atk ?? null
  const def     = card.def ?? null
  const livello = card.level ? "⭐".repeat(Math.min(card.level, 12)) : null
  const rarita  = getRarita(atk)
  const attr    = ATTRIBUTI[card.attribute] || `🔹 ${card.attribute || "N/A"}`
  const tipo    = TIPI_CARTA[card.type] || `🃏 ${card.type}`
  const nome    = trunc(card.name?.toUpperCase(), 26)
  const desc    = trunc(card.desc, 120)

  let stats = ""
  if (atk !== null || def !== null) {
    stats = `
⚔️ ATK: ${statBar(atk)}
🛡️ DEF: ${statBar(def)}
`
  }

  return `
🎴 *YUGIOH CARD 888*
ID: #${padId(card.id)}

🃏 Nome: ${nome}
📗 Tipo: ${tipo}
✨ Attributo: ${attr}
⭐ Rarità: ${rarita.stars} ${rarita.label}

${livello ? `Livello: ${livello}\n` : ""}

📜 Descrizione:
${desc}

${stats}

${dataPesca ? `📅 Pescata il: ${dataPesca}` : ""}
🌐 ygoprodeck.com
`.trim()
}

let handler = async (m, { conn, args, command }) => {
  const userId = m.sender
  const db     = await loadDB()
  const utente = getUser(db, userId)

  // ───────────────────────────────
  // 🎴 PESCA — 888
  // ───────────────────────────────
  if (command === 'pesca') {
    const now = Date.now()
    const remaining = COOLDOWN - (now - utente.ultimaPesca)

    if (remaining > 0) {
      const min = Math.ceil(remaining / 60000)
      return m.reply(`
⏳ *Cooldown attivo*
Puoi pescare di nuovo tra *${min} minuti*.
`.trim())
    }

    let card
    try {
      card = await fetchRandom()
    } catch {
      return m.reply(`
❌ *Errore pesca*
Impossibile pescare la carta.
Riprova più tardi.
`.trim())
    }

    const already = !!utente.collezione[card.id]
    const dataP   = new Date().toLocaleDateString('it-IT')

    utente.collezione[card.id] = {
      id: card.id,
      name: card.name,
      type: card.type,
      attribute: card.attribute || null,
      atk: card.atk ?? null,
      def: card.def ?? null,
      level: card.level || null,
      desc: card.desc,
      imageUrl: card.card_images?.[0]?.image_url || null,
      pescata: dataP,
    }

    utente.ultimaPesca = now
    await saveDB(db)

    const totale = Object.keys(utente.collezione).length
    const carta  = buildCard(card, dataP)
    const suffix = already
      ? `♻️ Hai già questa carta!`
      : `🎴 Hai pescato *${card.name.toUpperCase()}*!`

    const caption = `${carta}\n\n${suffix}\n📦 Carte nella tua collezione: *${totale}*`

    const imgUrl = card.card_images?.[0]?.image_url
    if (imgUrl) {
      try {
        const imgRes = await fetch(imgUrl)
        const buffer = Buffer.from(await imgRes.arrayBuffer())
        await conn.sendMessage(m.chat, { image: buffer, caption }, { quoted: m })
        return
      } catch {}
    }

    return conn.sendMessage(m.chat, { text: caption }, { quoted: m })
  }

  // ───────────────────────────────
  // 📦 COLLEZIONE — 888
  // ───────────────────────────────
  if (command === 'collezione') {
    const lista = Object.values(utente.collezione)

    if (!lista.length)
      return m.reply(`
📭 *Nessuna carta*
Non hai ancora pescato nulla.
Usa *.pesca* per iniziare.
`.trim())

    lista.sort((a, b) => a.name.localeCompare(b.name))

    const righe = lista.map(c => {
      const tipo   = TIPI_CARTA[c.type] || "🃏"
      const rarita = getRarita(c.atk)
      return `${tipo.split(" ")[0]} *${c.name.toUpperCase()}* — ${rarita.stars}`
    })

    return m.reply(`
🎴 *Collezione Yu‑Gi‑Oh 888*
Carte totali: *${lista.length}*

${righe.join("\n")}
`.trim())
  }

  // ───────────────────────────────
  // 🔍 YUGIOH <nome> — 888
  // ───────────────────────────────
  if (command === 'yugioh') {
    if (!args[0])
      return m.reply(`
📖 *Uso comando*
.yugioh <nome carta>
Esempio: .yugioh Dark Magician

Puoi vedere solo le carte che hai pescato.
`.trim())

    const query = args.join(" ").toLowerCase()
    const trovata = Object.values(utente.collezione).find(c =>
      c.name.toLowerCase() === query || String(c.id) === query
    )

    if (!trovata)
      return m.reply(`
❌ *Carta non trovata*
Non hai pescato *${query.toUpperCase()}*.
`.trim())

    let card
    try {
      card = await fetchById(trovata.id)
    } catch {
      return m.reply(`
❌ *Errore dati*
Impossibile caricare la carta.
`.trim())
    }

    const carta   = buildCard(card, trovata.pescata)
    const imgUrl  = card.card_images?.[0]?.image_url

    if (imgUrl) {
      try {
        const imgRes = await fetch(imgUrl)
        const buffer = Buffer.from(await imgRes.arrayBuffer())
        await conn.sendMessage(m.chat, { image: buffer, caption: carta }, { quoted: m })
        return
      } catch {}
    }

    return conn.sendMessage(m.chat, { text: carta }, { quoted: m })
  }
}

handler.help    = ["yugioh <nome>", "pesca", "collezione"]
handler.tags    = ["fun", "game"]
handler.command = ["yugioh", "pesca", "collezione"]

export default handler