import fs from 'fs/promises'
import path from 'path'

const POKEAPI = "https://pokeapi.co/api/v2/pokemon"
const TOTAL_POKEMON = 1025
const DB_PATH = path.join(process.cwd(), 'data', 'pokedex.json')
const MOSSE_NUM = ["①","②","③","④"]

const TIPI = {
  fire:{emoji:"🔥",ita:"FUOCO"},water:{emoji:"💧",ita:"ACQUA"},grass:{emoji:"🌿",ita:"ERBA"},
  electric:{emoji:"⚡",ita:"ELETTRO"},psychic:{emoji:"🔮",ita:"PSICO"},dragon:{emoji:"🐉",ita:"DRAGO"},
  ice:{emoji:"❄️",ita:"GHIACCIO"},fighting:{emoji:"🥊",ita:"LOTTA"},poison:{emoji:"☠️",ita:"VELENO"},
  ground:{emoji:"🌍",ita:"TERRA"},flying:{emoji:"🦅",ita:"VOLANTE"},bug:{emoji:"🐛",ita:"INSETTO"},
  rock:{emoji:"🪨",ita:"ROCCIA"},ghost:{emoji:"👻",ita:"SPETTRO"},dark:{emoji:"🌑",ita:"BUIO"},
  steel:{emoji:"⚙️",ita:"ACCIAIO"},fairy:{emoji:"✨",ita:"FOLLETTO"},normal:{emoji:"⭐",ita:"NORMALE"},
}

const pokemonCache = new Map()
let dbPromise = null

function getRarita(hp){
  if(hp>=120) return {stars:"★★★★★",label:"LEGGENDARIO"}
  if(hp>=100) return {stars:"★★★★☆",label:"ULTRA RARO"}
  if(hp>=80)  return {stars:"★★★☆☆",label:"RARO"}
  if(hp>=60)  return {stars:"★★☆☆☆",label:"NON COMUNE"}
  return {stars:"★☆☆☆☆",label:"COMUNE"}
}

function statBar(val,max=160){
  const filled=Math.min(10, Math.round((val/max)*10))
  return "█".repeat(filled)+"░".repeat(10-filled)+`  ${val}`
}

function padId(id){ return String(id).padStart(4,"0") }

function getTipoInfo(tipoName) {
  return TIPI[tipoName] || {emoji:"⭐",ita:tipoName.toUpperCase()}
}

async function loadDB(){
  if(dbPromise) return dbPromise
  dbPromise = (async () => {
    try {
      return JSON.parse(await fs.readFile(DB_PATH,'utf-8'))
    } catch {
      try {
        await fs.mkdir(path.dirname(DB_PATH),{recursive:true})
        await fs.writeFile(DB_PATH,'{}')
      } catch {}
      return {}
    }
  })()
  return dbPromise
}

async function saveDB(db){
  dbPromise = (async () => {
    try {
      await fs.mkdir(path.dirname(DB_PATH),{recursive:true})
      await fs.writeFile(DB_PATH,JSON.stringify(db,null,2))
    } catch {}
    return db
  })()
  await dbPromise
}

function getUserDex(db,userId){
  if(!db[userId]) db[userId]={catturati:{},ultimaCattura:0}
  return db[userId]
}

async function fetchPokemon(nameOrId){
  const key = String(nameOrId).toLowerCase()
  if(pokemonCache.has(key)) return pokemonCache.get(key)
  
  const res = await fetch(`${POKEAPI}/${key}`)
  if(!res.ok) throw new Error("not_found")
  const data = await res.json()
  
  const statMap = data.stats.reduce((acc,s) => {
    acc[s.stat.name] = s.base_stat
    return acc
  }, {})

  const shuffledMoves = []
  const movesLen = data.moves.length
  if(movesLen > 0){
    const indices = new Set()
    const targetSize = Math.min(4, movesLen)
    while(indices.size < targetSize){
      indices.add(Math.floor(Math.random() * movesLen))
    }
    for(const idx of indices){
      shuffledMoves.push(data.moves[idx].move.name.replace(/-/g," ").toUpperCase())
    }
  }

  const pokemon = {
    id:data.id,
    name:data.name,
    nameIT:data.name.toUpperCase(),
    hp:statMap["hp"]??50,
    atk:statMap["attack"]??50,
    def:statMap["defense"]??50,
    spatk:statMap["special-attack"]??50,
    spd:statMap["speed"]??50,
    types:data.types.map(t=>t.type.name),
    moves:shuffledMoves,
    artworkUrl:`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`,
  }

  pokemonCache.set(key, pokemon)
  return pokemon
}

function buildCard(poke,dataC=null){
  const rarita = getRarita(poke.hp)
  const tipo1 = getTipoInfo(poke.types[0])
  const tipo2 = poke.types[1] ? getTipoInfo(poke.types[1]) : null
  const tipoStr = tipo2
    ? `${tipo1.emoji} ${tipo1.ita} / ${tipo2.emoji} ${tipo2.ita}`
    : `${tipo1.emoji} ${tipo1.ita}`

  const movesStr = poke.moves.map((m,i)=>`• ${MOSSE_NUM[i]??'•'} ${m}`).join("\n")
  const dataRiga = dataC ? `\n📅 Catturato il: ${dataC}` : ""

  return `
🎴 *POKÉDEX CARD 888*
🆔 #${padId(poke.id)} — *${poke.nameIT}*
🔥 Tipo: ${tipoStr}
⭐ Rarità: ${rarita.stars} ${rarita.label}

📊 *Statistiche*
❤️ HP   ${statBar(poke.hp)}
⚔️ ATK  ${statBar(poke.atk)}
🛡️ DEF  ${statBar(poke.def)}
💥 SPA  ${statBar(poke.spatk)}
💨 VEL  ${statBar(poke.spd)}

⚡ *Mosse*
${movesStr}${dataRiga}
`.trim()
}

async function sendPokemonCard(conn, m, poke, dataC = null){
  const carta = buildCard(poke, dataC)
  try {
    const imgRes = await fetch(poke.artworkUrl)
    if(!imgRes.ok) throw new Error()
    const buffer = Buffer.from(await imgRes.arrayBuffer())
    await conn.sendMessage(m.chat, {image:buffer, caption:carta, mimetype:"image/png"}, {quoted:m})
  } catch {
    await conn.sendMessage(m.chat, {text:carta}, {quoted:m})
  }
}

function findPokemonInDex(catturati, query){
  const normalizedQuery = query.toLowerCase()
  return Object.values(catturati).find(p =>
    p.name.toLowerCase() === normalizedQuery || String(p.id) === normalizedQuery
  )
}

let handler = async(m,{conn,args,command}) => {
  const userId = m.sender
  const db = await loadDB()
  const utente = getUserDex(db, userId)

  if(command === 'cattura'){
    const ora = Date.now()
    const cooldown = 5*60*1000
    const rimanente = cooldown - (ora - utente.ultimaCattura)

    if(rimanente > 0){
      const minuti = Math.ceil(rimanente/60000)
      return m.reply(`
⏳ *COOLDOWN 888*
Attendi ancora *${minuti} minuto${minuti>1?'i':''}* prima di catturare un altro Pokémon.
`.trim())
    }

    const randomId = Math.floor(Math.random()*TOTAL_POKEMON)+1
    let poke
    try{ poke = await fetchPokemon(randomId) }
    catch{ return m.reply("❌ Errore nel trovare un Pokémon.") }

    const giaHai = !!utente.catturati[poke.id]
    const dataC = new Date().toLocaleDateString('it-IT')

    utente.catturati[poke.id] = {
      id:poke.id, name:poke.name, hp:poke.hp, atk:poke.atk, def:poke.def,
      spatk:poke.spatk, spd:poke.spd, types:poke.types, moves:poke.moves,
      catturato:dataC,
    }
    utente.ultimaCattura = ora
    await saveDB(db)

    const totale = Object.keys(utente.catturati).length
    const carta = buildCard(poke, dataC)
    const suffix = giaHai
      ? `♻️ Hai già *${poke.nameIT}* nel Pokédex!`
      : `🎉 Hai catturato *${poke.nameIT}*!`

    const caption = `${carta}\n\n${suffix}\n📦 Totale: *${totale}/${TOTAL_POKEMON}*`

    try {
      const imgRes = await fetch(poke.artworkUrl)
      if(!imgRes.ok) throw new Error()
      const buffer = Buffer.from(await imgRes.arrayBuffer())
      await conn.sendMessage(m.chat, {image:buffer, caption, mimetype:"image/png"}, {quoted:m})
    } catch {
      await conn.sendMessage(m.chat, {text:caption}, {quoted:m})
    }
    return
  }

  if(command === 'pokedex'){
    const lista = Object.values(utente.catturati)

    if(!lista.length){
      return m.reply(`
📭 *POKÉDEX VUOTO 888*
Non hai ancora catturato nessun Pokémon.
Usa *.cattura* per iniziare.
`.trim())
    }

    lista.sort((a,b) => a.id - b.id)

    const righe = lista.map(p => {
      const tipo1 = getTipoInfo(p.types[0])
      const rarita = getRarita(p.hp)
      return `${tipo1.emoji} #${padId(p.id)} *${p.name.toUpperCase()}* — ${rarita.stars}`
    })

    return m.reply(`
📖 *IL TUO POKÉDEX 888*
Totale: ${lista.length}/${TOTAL_POKEMON}

${righe.join("\n")}
`.trim())
  }

  if(command === 'pokemon'){
    if(!args?.[0]){
      return m.reply(`
📖 *USO COMANDO 888*
.pokemon <nome/id>
Puoi vedere solo Pokémon già catturati.
`.trim())
    }

    const query = args.join("-").toLowerCase()
    const trovato = findPokemonInDex(utente.catturati, query)

    if(!trovato){
      return m.reply(`
❌ *NON TROVATO 888*
Non hai ancora catturato *${query.toUpperCase()}*.
Usa *.cattura* per trovarlo.
`.trim())
    }

    const poke = {
      ...trovato,
      nameIT: trovato.name.toUpperCase(),
      artworkUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${trovato.id}.png`
    }

    await sendPokemonCard(conn, m, poke, trovato.catturato)
    return
  }
}

handler.help = ["pokemon <nome>","cattura","pokedex"]
handler.tags = ["fun","game"]
handler.command = ["pokemon1","cattura1","pokedex1"]

export default handler
