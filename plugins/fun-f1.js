const F1_API_KEY = "c9d9e589b3mshc7eecec96ccc03ep126bb1jsnbd4082441abd"
const F1_API_HOST = "api-formula-1.p.rapidapi.com"

async function fetchF1(endpoint) {
  try {
    const res = await fetch(`https://api-formula-1.p.rapidapi.com/${endpoint}`, {
      headers: {
        "x-rapidapi-key": F1_API_KEY,
        "x-rapidapi-host": F1_API_HOST
      }
    })
    return await res.json()
  } catch (e) { return null }
}

function getFlagEmoji(country) {
  const flags = {
    "bahrain": "🇧🇭", "saudi arabia": "🇸🇦", "australia": "🇦🇺", "japan": "🇯🇵",
    "china": "🇨🇳", "miami": "🇺🇸", "usa": "🇺🇸", "united states": "🇺🇸",
    "italy": "🇮🇹", "monaco": "🇲🇨", "canada": "🇨🇦", "spain": "🇪🇸",
    "austria": "🇦🇹", "uk": "🇬🇧", "great britain": "🇬🇧", "hungary": "🇭🇺",
    "belgium": "🇧🇪", "netherlands": "🇳🇱", "singapore": "🇸🇬", "azerbaijan": "🇦🇿",
    "mexico": "🇲🇽", "brazil": "🇧🇷", "las vegas": "🇺🇸", "qatar": "🇶🇦",
    "abu dhabi": "🇦🇪", "germany": "🇩🇪", "france": "🇫🇷", "portugal": "🇵🇹",
    "turkey": "🇹🇷", "russia": "🇷🇺"
  }
  if (!country) return "🏁"
  const key = country.toLowerCase()
  for (let k of Object.keys(flags)) {
    if (key.includes(k)) return flags[k]
  }
  return "🏁"
}

function getTeamEmoji(team) {
  if (!team) return "🚗"
  const t = team.toLowerCase()
  if (t.includes("ferrari")) return "🔴"
  if (t.includes("mercedes")) return "⬛"
  if (t.includes("red bull")) return "🔵"
  if (t.includes("mclaren")) return "🟠"
  if (t.includes("alpine")) return "🔵"
  if (t.includes("aston")) return "🟢"
  if (t.includes("williams")) return "🔵"
  if (t.includes("haas")) return "⚪"
  if (t.includes("alfa") || t.includes("sauber") || t.includes("kick")) return "🔴"
  if (t.includes("racing bulls") || t.includes("rb ") || t.includes("toro")) return "🔵"
  return "🚗"
}

function formatDate(dateStr) {
  if (!dateStr) return "N/D"
  const d = new Date(dateStr)
  return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

function formatDateTime(dateStr) {
  if (!dateStr) return "N/D"
  const d = new Date(dateStr)
  return d.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" })
}

let handler = async (m, { conn, args }) => {
  const chat = m.chat
  const cmd = args[0]?.toLowerCase()

  // ───────────────────────────────
  // 🔥 PROSSIMA GARA — 888
  // ───────────────────────────────
  if (!cmd || cmd === "prossima") {
    await m.reply("🏎💨 *Ricerca prossima gara F1...*")

    const data = await fetchF1("races?season=current&type=race")
    if (!data?.response?.length)
      return m.reply("╭━━━〔 ❌ *ERRORE DATI* 〕━━━┈\n┃ Impossibile recuperare le gare.\n╰━━━━━━━━━━━━━━━━━━┈")

    const now = new Date()
    const prossima = data.response.find(r => new Date(r.date) >= now)
    if (!prossima)
      return m.reply("╭━━━〔 ❌ *NESSUNA GARA* 〕━━━┈\n┃ Non ci sono gare in programma.\n╰━━━━━━━━━━━━━━━━━━┈")

    const flag = getFlagEmoji(prossima.competition?.location?.country)
    const circuito = prossima.circuit?.name || "N/D"
    const city = prossima.competition?.location?.city || ""
    const country = prossima.competition?.location?.country || ""
    const gara = prossima.competition?.name || prossima.name || "N/D"
    const round = prossima.round || "?"
    const dataGara = formatDate(prossima.date)

    let sessioni = ""
    if (prossima.sessions) {
      const s = prossima.sessions
      if (s.fp1) sessioni += `┃ 🔧 *FP1:* ${formatDateTime(s.fp1)}\n`
      if (s.fp2) sessioni += `┃ 🔧 *FP2:* ${formatDateTime(s.fp2)}\n`
      if (s.fp3) sessioni += `┃ 🔧 *FP3:* ${formatDateTime(s.fp3)}\n`
      if (s.sprint_qualifying) sessioni += `┃ ⚡ *Sprint Quali:* ${formatDateTime(s.sprint_qualifying)}\n`
      if (s.sprint) sessioni += `┃ ⚡ *Sprint:* ${formatDateTime(s.sprint)}\n`
      if (s.qualifying) sessioni += `┃ 🏁 *Qualifiche:* ${formatDateTime(s.qualifying)}\n`
      if (s.race) sessioni += `┃ 🏆 *Gara:* ${formatDateTime(s.race)}\n`
    }

    return conn.sendMessage(chat, { text:
`╭━━━〔 🏎 *PROSSIMA GARA F1* 〕━━━┈
┃ ${flag} *${gara}*
┃ 📍 Round ${round} — ${city}, ${country}
┃━━━━━━━━━━━━━━━━━━
┃ 🏟 Circuito: *${circuito}*
┃ 📅 ${dataGara}
┃━━━━━━━━━━━━━━━━━━
${sessioni}┃━━━━━━━━━━━━━━━━━━
┃ 📅 *.f1 calendario*
┃ 🏆 *.f1 classifica*
┃ 🏭 *.f1 costruttori*
┃ 🏁 *.f1 ultima*
╰━━━━━━━━━━━━━━━━━━┈` }, { quoted: m })
  }

  // ───────────────────────────────
  // 🔥 CALENDARIO — 888
  // ───────────────────────────────
  if (cmd === "calendario") {
    await m.reply("📅 *Caricamento calendario F1...*")

    const data = await fetchF1("races?season=current&type=race")
    if (!data?.response?.length)
      return m.reply("❌ Errore nel recuperare il calendario.")

    const now = new Date()
    let testo =
`╭━━━〔 📅 *CALENDARIO F1 ${new Date().getFullYear()}* 〕━━━┈\n`

    for (let race of data.response) {
      const flag = getFlagEmoji(race.competition?.location?.country)
      const nome = race.competition?.name || race.name || "N/D"
      const data_gara = new Date(race.date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })
      const passata = new Date(race.date) < now
      const stato = passata ? "✅" : "🔜"
      testo += `┃ ${stato} *R${race.round}* ${flag} ${nome} — ${data_gara}\n`
    }

    testo += `╰━━━━━━━━━━━━━━━━━━┈`
    return conn.sendMessage(chat, { text: testo }, { quoted: m })
  }

  // ───────────────────────────────
  // 🔥 CLASSIFICA PILOTI — 888
  // ───────────────────────────────
  if (cmd === "classifica") {
    await m.reply("🏆 *Caricamento classifica piloti...*")

    const data = await fetchF1("rankings/drivers?season=current")
    if (!data?.response?.length)
      return m.reply("❌ Errore nel recuperare la classifica.")

    let testo =
`╭━━━〔 🏆 *MONDIALE PILOTI* 〕━━━┈\n`

    for (let d of data.response.slice(0, 20)) {
      const pos = d.position
      const nome = `${d.driver?.name?.firstname || ""} ${d.driver?.name?.lastname || ""}`.trim()
      const team = d.team?.name || ""
      const punti = d.points || 0
      const wins = d.wins || 0
      const teamEmoji = getTeamEmoji(team)
      const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `${pos}.`
      testo += `┃ ${medal} *${nome}*\n┃    ${teamEmoji} ${team} — *${punti} pts* 🏆${wins}\n`
    }

    testo += `╰━━━━━━━━━━━━━━━━━━┈`
    return conn.sendMessage(chat, { text: testo }, { quoted: m })
  }

  // ───────────────────────────────
  // 🔥 CLASSIFICA COSTRUTTORI — 888
  // ───────────────────────────────
  if (cmd === "costruttori") {
    await m.reply("🏭 *Caricamento classifica costruttori...*")

    const data = await fetchF1("rankings/teams?season=current")
    if (!data?.response?.length)
      return m.reply("❌ Errore nel recuperare la classifica.")

    let testo =
`╭━━━〔 🏭 *MONDIALE COSTRUTTORI* 〕━━━┈\n`

    for (let t of data.response) {
      const pos = t.position
      const team = t.team?.name || "N/D"
      const punti = t.points || 0
      const wins = t.wins || 0
      const teamEmoji = getTeamEmoji(team)
      const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `${pos}.`
      testo += `┃ ${medal} ${teamEmoji} *${team}*\n┃    *${punti} pts* 🏆${wins}\n`
    }

    testo += `╰━━━━━━━━━━━━━━━━━━┈`
    return conn.sendMessage(chat, { text: testo }, { quoted: m })
  }

  // ───────────────────────────────
  // 🔥 ULTIMA GARA — 888
  // ───────────────────────────────
  if (cmd === "ultima") {
    await m.reply("🏁 *Caricamento risultati ultima gara...*")

    const data = await fetchF1("races?season=current&type=race")
    if (!data?.response?.length) return m.reply("❌ Errore.")

    const now = new Date()
    const passate = data.response.filter(r => new Date(r.date) < now)
    if (!passate.length) return m.reply("❌ Nessuna gara disputata.")

    const ultima = passate[passate.length - 1]
    const risultati = await fetchF1(`rankings/races?race=${ultima.id}`)

    const flag = getFlagEmoji(ultima.competition?.location?.country)
    const nomeGara = ultima.competition?.name || ultima.name || "N/D"

    let testo =
`╭━━━〔 🏁 *RISULTATI ULTIMA GARA* 〕━━━┈
┃ ${flag} *${nomeGara}*
┃━━━━━━━━━━━━━━━━━━\n`

    if (risultati?.response?.length) {
      for (let r of risultati.response.slice(0, 10)) {
        const pos = r.position
        const nome = `${r.driver?.name?.firstname || ""} ${r.driver?.name?.lastname || ""}`.trim()
        const team = r.team?.name || ""
        const tempo = r.time?.time || r.time?.behind || ""
        const teamEmoji = getTeamEmoji(team)
        const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `${pos}.`
        const punti = r.points ? `+${r.points}pts` : ""
        testo += `┃ ${medal} *${nome}*\n┃    ${teamEmoji} ${team} ${tempo} ${punti}\n`
      }
    } else {
      testo += `┃ Risultati non disponibili.\n`
    }

    testo += `╰━━━━━━━━━━━━━━━━━━┈`
    return conn.sendMessage(chat, { text: testo }, { quoted: m })
  }

  // ───────────────────────────────
  // 🔥 PILOTI — 888
  // ───────────────────────────────
  if (cmd === "piloti") {
    await m.reply("🧑‍✈️ *Caricamento piloti stagione...*")

    const data = await fetchF1("drivers?season=current")
    if (!data?.response?.length) return m.reply("❌ Errore.")

    let testo =
`╭━━━〔 🧑‍✈️ *PILOTI ${new Date().getFullYear()}* 〕━━━┈\n`

    const sorted = data.response.sort((a, b) =>
      (a.teams?.[0]?.team?.name || "").localeCompare(b.teams?.[0]?.team?.name || "")
    )

    let currentTeam = ""

    for (let p of sorted) {
      const nome = `${p.name?.firstname || ""} ${p.name?.lastname || ""}`.trim()
      const team = p.teams?.[0]?.team?.name || "N/D"
      const numero = p.number || "?"
      const naz = getFlagEmoji(p.nationality)
      const teamEmoji = getTeamEmoji(team)

      if (team !== currentTeam) {
        currentTeam = team
        testo += `┃\n┃ ${teamEmoji} *${team}*\n`
      }

      testo += `┃  #${numero} ${naz} ${nome}\n`
    }

    testo += `╰━━━━━━━━━━━━━━━━━━┈`
    return conn.sendMessage(chat, { text: testo }, { quoted: m })
  }

  // ───────────────────────────────
  // 🔥 MENU F1 — 888
  // ───────────────────────────────
  return m.reply(
`╭━━━〔 🏎 *COMANDI F1 888* 〕━━━┈
┃ *.f1* → prossima gara
┃ *.f1 calendario* → stagione completa
┃ *.f1 classifica* → Mondiale Piloti
┃ *.f1 costruttori* → Mondiale Team
┃ *.f1 ultima* → risultati ultima gara
┃ *.f1 piloti* → piloti stagione
╰━━━━━━━━━━━━━━━━━━┈`)
}

handler.command = ["f1"]
export default handler