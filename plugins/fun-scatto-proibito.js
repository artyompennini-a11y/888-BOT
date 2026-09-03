// Plugin by Elixir, Punisher & 888 staff
import { importCanvas } from '../lib/canvas-fallback.js'
const SUBJECTS = [

  { e: '🦁', n: 'leone', al: [] },
  { e: '🐘', n: 'elefante', al: ['pachiderma'] },
  { e: '🐱', n: 'gatto', al: ['felino', 'micio'] },
  { e: '🐶', n: 'cane', al: ['cagnolino'] },
  { e: '🐺', n: 'lupo', al: ['lupetto'] },
  { e: '🦊', n: 'volpe', al: [] },
  { e: '🐻', n: 'orso', al: ['orsacchiotto'] },
  { e: '🐼', n: 'panda', al: [] },
  { e: '🐨', n: 'koala', al: [] },
  { e: '🐯', n: 'tigre', al: [] },
  { e: '🐆', n: 'leopardo', al: ['pantera'] },
  { e: '🦓', n: 'zebra', al: [] },
  { e: '🦒', n: 'giraffa', al: [] },
  { e: '🦏', n: 'rinoceronte', al: [] },
  { e: '🦛', n: 'ippopotamo', al: ['ippo'] },
  { e: '🐮', n: 'mucca', al: ['vacca'] },
  { e: '🐷', n: 'maiale', al: ['porco'] },
  { e: '🐸', n: 'rana', al: [] },
  { e: '🐢', n: 'tartaruga', al: ['testuggine'] },
  { e: '🐊', n: 'coccodrillo', al: [] },
  { e: '🦎', n: 'lucertola', al: ['geco'] },
  { e: '🐍', n: 'serpente', al: ['biscia'] },
  { e: '🦈', n: 'squalo', al: ['pescecane'] },
  { e: '🐬', n: 'delfino', al: [] },
  { e: '🐳', n: 'balena', al: ['capodoglio'] },
  { e: '🐙', n: 'polpo', al: ['piovra'] },
  { e: '🦀', n: 'granchio', al: [] },
  { e: '🦞', n: 'aragosta', al: [] },
  { e: '🐚', n: 'conchiglia', al: [] },
  { e: '🐌', n: 'lumaca', al: ['chiocciola'] },
  { e: '🦋', n: 'farfalla', al: [] },
  { e: '🐝', n: 'ape', al: ['vespa'] },
  { e: '🐞', n: 'coccinella', al: [] },
  { e: '🦂', n: 'scorpione', al: [] },
  { e: '🦘', n: 'canguro', al: [] },
  { e: '🦬', n: 'bisonte', al: [] },
  { e: '🦌', n: 'cervo', al: ['capriolo'] },
  { e: '🐐', n: 'capra', al: [] },
  { e: '🐑', n: 'pecora', al: ['agnello'] },
  { e: '🐓', n: 'gallo', al: [] },
  { e: '🐔', n: 'gallina', al: ['pollo'] },
  { e: '🦆', n: 'anatra', al: ['papera'] },
  { e: '🦉', n: 'gufo', al: ['civetta'] },
  { e: '🦅', n: 'aquila', al: [] },
  { e: '🦢', n: 'cigno', al: [] },
  { e: '🦩', n: 'fenicottero', al: [] },
  { e: '🦚', n: 'pavone', al: [] },
  { e: '🐧', n: 'pinguino', al: [] },
  { e: '🦔', n: 'riccio', al: [] },
  { e: '🐿️', n: 'scoiattolo', al: [] },
  { e: '🦝', n: 'procione', al: [] },
  { e: '🦥', n: 'bradipo', al: [] },
  { e: '🐫', n: 'cammello', al: ['dromedario'] },
  { e: '🐹', n: 'criceto', al: [] },
  { e: '🐰', n: 'coniglio', al: ['lepre'] },
  { e: '🐭', n: 'topo', al: ['topolino'] },
  { e: '🐦', n: 'uccello', al: ['passero'] },
  { e: '🦜', n: 'pappagallo', al: ['ara'] },
  { e: '🦇', n: 'pipistrello', al: [] },
  { e: '🐎', n: 'cavallo', al: ['corsiero'] },
  { e: '🐄', n: 'toro', al: ['manzo'] },
  { e: '🐃', n: 'bufalo', al: ['bisonte'] },
  { e: '🦭', n: 'foca', al: ['otaria'] },
  { e: '🦤', n: 'dodo', al: [] },

  { e: '🍕', n: 'pizza', al: [] },
  { e: '🍔', n: 'hamburger', al: ['burger'] },
  { e: '🍟', n: 'patatine', al: ['fritte'] },
  { e: '🌭', n: 'hot dog', al: ['wurstel'] },
  { e: '🥓', n: 'pancetta', al: ['bacon'] },
  { e: '🍗', n: 'pollo arrosto', al: ['coscia'] },
  { e: '🥖', n: 'baguette', al: ['pane'] },
  { e: '🥨', n: 'pretzel', al: [] },
  { e: '🧀', n: 'formaggio', al: ['cacio'] },
  { e: '🍳', n: 'uovo', al: ['uova'] },
  { e: '🥞', n: 'pancake', al: [] },
  { e: '🧇', n: 'waffle', al: [] },
  { e: '🍩', n: 'ciambella', al: ['donut'] },
  { e: '🍪', n: 'biscotto', al: [] },
  { e: '🎂', n: 'torta', al: [] },
  { e: '🍰', n: 'fetta di torta', al: [] },
  { e: '🧁', n: 'muffin', al: ['cupcake'] },
  { e: '🍫', n: 'cioccolato', al: ['cioccolata'] },
  { e: '🍬', n: 'caramella', al: [] },
  { e: '🍭', n: 'lecca lecca', al: [] },
  { e: '🍦', n: 'gelato', al: ['cono'] },
  { e: '🍧', n: 'sorbetto', al: ['granita'] },
  { e: '🍨', n: 'coppa gelato', al: ['sundae'] },
  { e: '🍿', n: 'popcorn', al: [] },
  { e: '🥜', n: 'arachidi', al: ['noccioline'] },
  { e: '🍯', n: 'miele', al: [] },
  { e: '🥛', n: 'latte', al: [] },
  { e: '🍵', n: 'tè', al: ['matcha'] },
  { e: '☕', n: 'caffè', al: [] },
  { e: '🧋', n: 'tè boba', al: ['bubble tea'] },
  { e: '🥤', n: 'bibita', al: ['soda'] },
  { e: '🧃', n: 'succo', al: [] },
  { e: '🍹', n: 'cocktail', al: ['bevanda'] },
  { e: '🥂', n: 'brindisi', al: ['champagne'] },
  { e: '🍺', n: 'birra', al: [] },
  { e: '🍷', n: 'vino', al: [] },
  { e: '🍾', n: 'spumante', al: ['champagne'] },
  { e: '🍴', n: 'posate', al: ['forchetta'] },
  { e: '🥄', n: 'cucchiaio', al: [] },
  { e: '🥢', n: 'bacchette', al: [] },
  { e: '🍽️', n: 'piatto', al: [] },
  { e: '🍳', n: 'padella', al: [] },
  { e: '🥫', n: 'scatoletta', al: ['lattina'] },
  { e: '🍶', n: 'sake', al: [] },

  { e: '🍎', n: 'mela', al: [] },
  { e: '🍏', n: 'mela verde', al: [] },
  { e: '🍐', n: 'pera', al: [] },
  { e: '🍊', n: 'arancia', al: [] },
  { e: '🍋', n: 'limone', al: [] },
  { e: '🍌', n: 'banana', al: [] },
  { e: '🍉', n: 'anguria', al: ['cocomero'] },
  { e: '🍇', n: 'uva', al: [] },
  { e: '🍓', n: 'fragola', al: [] },
  { e: '🫐', n: 'mirtillo', al: [] },
  { e: '🍒', n: 'ciliegie', al: [] },
  { e: '🍑', n: 'pesca', al: [] },
  { e: '🍍', n: 'ananas', al: [] },
  { e: '🥭', n: 'mango', al: [] },
  { e: '🥥', n: 'cocco', al: [] },
  { e: '🍈', n: 'melone', al: [] },
  { e: '🥝', n: 'kiwi', al: [] },
  { e: '🥑', n: 'avocado', al: [] },
  { e: '🍅', n: 'pomodoro', al: [] },
  { e: '🍆', n: 'melanzana', al: [] },
  { e: '🥦', n: 'broccolo', al: ['verdura'] },
  { e: '🥕', n: 'carota', al: [] },
  { e: '🌽', n: 'mais', al: ['granturco'] },
  { e: '🌶️', n: 'peperoncino', al: ['piccante'] },
  { e: '🫑', n: 'peperone', al: [] },
  { e: '🧄', n: 'aglio', al: [] },
  { e: '🧅', n: 'cipolla', al: [] },
  { e: '🥔', n: 'patata', al: [] },
  { e: '🍠', n: 'patata dolce', al: ['batata'] },

  { e: '✈️', n: 'aereo', al: ['velivolo'] },
  { e: '🚗', n: 'auto', al: ['macchina'] },
  { e: '🚕', n: 'taxi', al: [] },
  { e: '🚌', n: 'autobus', al: ['bus'] },
  { e: '🚜', n: 'trattore', al: [] },
  { e: '🏍️', n: 'moto', al: ['motocicletta'] },
  { e: '🚲', n: 'bicicletta', al: ['bici'] },
  { e: '🚂', n: 'treno', al: [] },
  { e: '🚁', n: 'elicottero', al: [] },
  { e: '🚀', n: 'razzo', al: ['astronave'] },
  { e: '🛸', n: 'ufo', al: ['disco volante'] },
  { e: '🚢', n: 'nave', al: ['piroscafo'] },
  { e: '🚤', n: 'motoscafo', al: [] },
  { e: '🛶', n: 'canoa', al: ['kayak'] },
  { e: '⛵', n: 'barca a vela', al: ['veliero'] },
  { e: '🛴', n: 'monopattino', al: [] },
  { e: '🚇', n: 'metropolitana', al: ['metro'] },
  { e: '🚉', n: 'stazione', al: ['binario'] },
  { e: '🛩️', n: 'aereo piccolo', al: ['cessna'] },

  { e: '🏰', n: 'castello', al: ['fortezza'] },
  { e: '🏯', n: 'castello giapponese', al: [] },
  { e: '🏠', n: 'casa', al: ['abitazione'] },
  { e: '🏢', n: 'grattacielo', al: ['palazzo'] },
  { e: '🏛️', n: 'tempio', al: ['colosseo'] },
  { e: '⛺', n: 'tenda', al: ['campeggio'] },
  { e: '🏆', n: 'trofeo', al: ['coppa'] },
  { e: '👑', n: 'corona', al: ['diadema'] },
  { e: '🎁', n: 'regalo', al: ['dono', 'pacco'] },
  { e: '🎲', n: 'dado', al: ['dadi'] },
  { e: '🔑', n: 'chiave', al: [] },
  { e: '🔒', n: 'lucchetto', al: ['catenaccio'] },
  { e: '💎', n: 'diamante', al: ['gemma'] },
  { e: '💰', n: 'soldi', al: ['denaro'] },
  { e: '💵', n: 'banconota', al: [] },
  { e: '🪙', n: 'moneta', al: [] },
  { e: '📱', n: 'telefono', al: ['smartphone'] },
  { e: '💻', n: 'computer', al: ['pc', 'portatile'] },
  { e: '⌨️', n: 'tastiera', al: [] },
  { e: '🖱️', n: 'mouse', al: [] },
  { e: '📺', n: 'televisione', al: ['tv'] },
  { e: '🎮', n: 'console', al: ['videogioco', 'playstation'] },
  { e: '🎧', n: 'cuffie', al: ['auricolari'] },
  { e: '📷', n: 'fotocamera', al: ['macchina fotografica'] },
  { e: '🎥', n: 'videocamera', al: [] },
  { e: '📚', n: 'libri', al: ['biblioteca'] },
  { e: '✏️', n: 'matita', al: [] },
  { e: '🖊️', n: 'penna', al: [] },
  { e: '⏰', n: 'sveglia', al: [] },
  { e: '⌚', n: 'orologio', al: [] },
  { e: '💡', n: 'lampadina', al: ['luce'] },
  { e: '🕯️', n: 'candela', al: [] },
  { e: '🧸', n: 'orsacchiotto', al: ['peluche'] },
  { e: '🎈', n: 'palloncino', al: [] },
  { e: '🎀', n: 'fiocco', al: [] },
  { e: '🪀', n: 'yo-yo', al: [] },
  { e: '🧩', n: 'puzzle', al: [] },
  { e: '♟️', n: 'scacchi', al: ['pedone'] },
  { e: '🎯', n: 'bersaglio', al: ['freccette'] },
  { e: '⚽', n: 'pallone', al: ['calcio'] },
  { e: '🏀', n: 'basket', al: ['pallacanestro'] },
  { e: '🎾', n: 'tennis', al: ['racchetta'] },
  { e: '🏈', n: 'football', al: ['nfl'] },
  { e: '⚾', n: 'baseball', al: [] },
  { e: '🏐', n: 'pallavolo', al: ['volley'] },
  { e: '🏉', n: 'rugby', al: [] },
  { e: '🏓', n: 'ping pong', al: ['tennistavolo'] },
  { e: '🥊', n: 'boxe', al: ['guantoni'] },
  { e: '🎳', n: 'bowling', al: ['birilli'] },

  { e: '🌙', n: 'luna', al: [] },
  { e: '☀️', n: 'sole', al: ['astro'] },
  { e: '⭐', n: 'stella', al: ['astro'] },
  { e: '🌈', n: 'arcobaleno', al: ['iride'] },
  { e: '☁️', n: 'nuvola', al: [] },
  { e: '🌧️', n: 'pioggia', al: ['temporale'] },
  { e: '⚡', n: 'fulmine', al: ['lampo'] },
  { e: '❄️', n: 'fiocco di neve', al: ['neve'] },
  { e: '🌴', n: 'palma', al: [] },
  { e: '🌲', n: 'pino', al: ['abete'] },
  { e: '🌳', n: 'albero', al: ['quercia'] },
  { e: '🌵', n: 'cactus', al: [] },
  { e: '🌸', n: 'fiore', al: ['fior di ciliegio'] },
  { e: '🌻', n: 'girasole', al: [] },
  { e: '🌷', n: 'tulipano', al: [] },
  { e: '🌹', n: 'rosa', al: [] },
  { e: '🍁', n: 'foglia d acero', al: ['foglia'] },
  { e: '🍄', n: 'fungo', al: ['funghino'] },
  { e: '🌊', n: 'onda', al: ['oceano'] },
  { e: '🌋', n: 'vulcano', al: ['eruzione'] },
  { e: '🏝️', n: 'isola', al: ['tropicale'] },
  { e: '⛰️', n: 'montagna', al: ['cima'] },
  { e: '🗻', n: 'fuji', al: ['monte'] },
  { e: '🏔️', n: 'vetta', al: [] },
  { e: '🏝️', n: 'spiaggia', al: ['mare'] },

  { e: '👻', n: 'fantasma', al: ['spirito'] },
  { e: '🤖', n: 'robot', al: ['android'] },
  { e: '🧙', n: 'mago', al: ['stregone'] },
  { e: '🧚', n: 'fata', al: ['fatina'] },
  { e: '🧛', n: 'vampiro', al: ['conte'] },
  { e: '🧟', n: 'zombie', al: ['non morto'] },
  { e: '🏴‍☠️', n: 'pirata', al: ['corsaro'] },
  { e: '🦄', n: 'unicorno', al: ['alicorno'] },
  { e: '🐉', n: 'drago', al: ['dragone'] },
  { e: '👽', n: 'alieno', al: ['extraterrestre'] },
  { e: '🎃', n: 'zucca', al: ['halloween'] },
  { e: '💀', n: 'teschio', al: ['scheletro'] },
  { e: '👁️', n: 'occhio', al: [] },
  { e: '👅', n: 'lingua', al: [] },
  { e: '🫀', n: 'cuore', al: ['organo'] },
  { e: '🧠', n: 'cervello', al: [] },
  { e: '🦴', n: 'osso', al: [] },
  { e: '👣', n: 'piedi', al: ['impronte'] },
  { e: '🕷️', n: 'ragno', al: ['tarantola'] },
  { e: '🦠', n: 'virus', al: ['batterio'] },
  { e: '🧿', n: 'portafortuna', al: ['amuleti'] },
  { e: '💍', n: 'anello', al: ['gioiello'] },
  { e: '🎩', n: 'cappello', al: ['cilindro'] },
  { e: '👓', n: 'occhiali', al: [] },
  { e: '🕶️', n: 'occhiali da sole', al: [] },
  { e: '🧤', n: 'guanti', al: [] },
  { e: '🧣', n: 'sciarpa', al: [] },
  { e: '👖', n: 'pantaloni', al: ['jeans'] },
  { e: '👕', n: 'maglietta', al: ['t-shirt'] },
  { e: '👗', n: 'vestito', al: ['abito'] },
  { e: '👟', n: 'scarpe', al: ['scarpa da ginnastica'] },
  { e: '👠', n: 'tacco', al: ['tacchi'] },
  { e: '👾', n: 'mostriciattolo', al: ['alieno pixel'] },
  { e: '🎭', n: 'maschera', al: ['teatro'] },
  { e: '🪄', n: 'bacchetta', al: ['varita'] },
  { e: '🗝️', n: 'chiave antica', al: [] },
  { e: '🧨', n: 'petardo', al: ['dinamite'] },
  { e: '💣', n: 'bomba', al: [] },
  { e: '🔫', n: 'pistola', al: ['arma'] },
  { e: '🏹', n: 'arco', al: ['freccia'] },
  { e: '🛡️', n: 'scudo', al: [] },
  { e: '⚔️', n: 'spada', al: ['lama'] },
  { e: '🪓', n: 'ascia', al: [] },
  { e: '🪃', n: 'boomerang', al: [] },
  { e: '⚓', n: 'ancora', al: ['nave'] },
  { e: '🗿', n: 'moai', al: ['statua'] },
  { e: '🛖', n: 'capanna', al: ['igloo'] },
  { e: '🏟️', n: 'stadio', al: ['campo'] },
  { e: '🎪', n: 'circo', al: ['tenda da circo'] },
  { e: '🎢', n: 'montagne russe', al: ['ottovolante'] },
  { e: '🎡', n: 'ruota panoramica', al: [] },
  { e: '🎠', n: 'giostra', al: ['cavallo gioco'] },
  { e: '🛍️', n: 'buste', al: ['shopping'] },
  { e: '💊', n: 'pillola', al: ['medicina'] },
  { e: '🩹', n: 'cerotto', al: [] },
  { e: '🧻', n: 'carta igienica', al: ['rotolo'] },
  { e: '🪣', n: 'secchio', al: [] },
  { e: '🧹', n: 'scopa', al: [] }
]
const MAX_REVEALS = 8            
const REVEAL_INTERVAL_MS = 18000 
const MIN_BET = 50               
const WIN_QUOTA = 0.60           
const REFUND_QUOTA = 0.90        
const PENALTY = 25               
const ZOOM_COST = 20             
const SIZE = 480                 

const games = {}                 

const norm = (t = '') =>
  String(t)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const getUser = (jid) => {
  global.db.data.users[jid] ??= { money: 0 }
  return global.db.data.users[jid]
}

const shortJid = (jid) => ((jid || '').split('@')[0] || jid)

function findSubject(txt) {
  const t = norm(txt)
  for (const s of SUBJECTS) {
    if (norm(s.n) === t) return s
    if ((s.al || []).some((a) => norm(a) === t)) return s
  }
  return null
}

function bonusFor(step) {
  return (MAX_REVEALS - Math.min(step, MAX_REVEALS)) * 40
}

async function renderImage(emoji, step) {
  const { createCanvas } = await importCanvas()
  const BIG = 640
  const prog = Math.max(0, Math.min(1, step / MAX_REVEALS))

  const big = createCanvas(BIG, BIG)
  const bctx = big.getContext('2d')
  bctx.clearRect(0, 0, BIG, BIG)
  bctx.textAlign = 'center'
  bctx.textBaseline = 'middle'
  bctx.shadowColor = 'rgba(0,0,0,0.30)'
  bctx.shadowBlur = 16
  bctx.font = `${Math.round(BIG * 0.82)}px sans-serif`
  bctx.fillText(emoji, BIG / 2, BIG / 2)
  bctx.shadowBlur = 0

  const cropW = Math.round(150 + (BIG - 150) * prog)
  const cropX = (BIG - cropW) / 2
  const cropY = (BIG - cropW) / 2

  const out = createCanvas(SIZE, SIZE)
  const ctx = out.getContext('2d')
  ctx.fillStyle = '#131318'
  ctx.fillRect(0, 0, SIZE, SIZE)

  if (prog < 1) {
    try { ctx.filter = `blur(${Math.round((1 - prog) * 6)}px)` } catch (e) { /* fallback */ }
    try { ctx.drawImage(big, cropX, cropY, cropW, cropW, 0, 0, SIZE, SIZE) } catch (e) { /* fallback */ }
    try { ctx.filter = 'none' } catch (e) { /* fallback */ }
  } else {

async function sendBoard(conn, chat, g, extraText) {
  const img = await renderImage(g.emoji, g.step)
  const pot = g.pot
  const bettors = Object.keys(g.bets || {}).length
  const winPot = Math.round(pot * WIN_QUOTA)
  const winNow = winPot + bonusFor(g.step)

  let cap =
`╭━━━〔 📸 *LO SCATTO PROIBITO* 〕━━━┈
┃ 🔎 Rivelazione: *${g.step}/${MAX_REVEALS}*
┃ 💰 Piatto: *${pot} 888COIN* (${bettors} giocatori)
┃ 🏆 Se indovini ORA: ~*${winNow} 888COIN*
╰━━━━━━━━━━━━━━━━━━┈`
  if (extraText) cap += `\n\n${extraText}`

  await conn.sendMessage(chat, {
    image: img,
    mimetype: 'image/jpeg',
    fileName: 'scatto.jpg',
    caption: cap
  })

  await conn.sendMessage(chat, {
    text:
`📸 *LO SCATTO PROIBITO*
💡 Indovina: .scatto <parola>
💵 Scommetti: .scatto p <somma>
⏭️ Rivela: .scatto zoom · 🛑 Stop: .scatto stop`,
    buttons: [
      { buttonId: `.scatto p ${MIN_BET}`, buttonText: { displayText: '💵 Punto 50 888COIN' }, type: 1 },
      { buttonId: `.scatto p 100`, buttonText: { displayText: '💶 Punto 100 888COIN' }, type: 1 },
      { buttonId: `.scatto zoom`, buttonText: { displayText: '⏭️ Rivela' }, type: 1 },
      { buttonId: `.scatto stop`, buttonText: { displayText: '🛑 Stop' }, type: 1 }
    ],
    headerType: 1
  })
}

async function doReveal(conn, chat) {
  const g = games[chat]
  if (!g || g.over) return
  g.step++
  if (g.step >= MAX_REVEALS + 1) {
    endRefund(conn, chat, 'Il soggetto si è rivelato per intero!')
    return
  }
  await sendBoard(conn, chat, g, `🧩 Nuovo pezzo rivelato (${g.step}/${MAX_REVEALS}).`)
}

function startTimer(conn, chat) {
  const g = games[chat]
  if (!g) return
  if (g.timer) clearInterval(g.timer)
  g.timer = setInterval(() => {
    const cur = games[chat]
    if (!cur || cur.over) { clearInterval(g.timer); return }
    doReveal(conn, chat).catch((e) => console.error('[scatto] timer:', e))
  }, REVEAL_INTERVAL_MS)
}

function endWin(conn, chat, winnerJid) {
  const g = games[chat]
  if (!g || g.over) return
  g.over = true
  if (g.timer) { clearInterval(g.timer); g.timer = null }

  const winPot = Math.round(g.pot * WIN_QUOTA)
  const bonus = bonusFor(g.step)
  const total = winPot + bonus
  const winnerUser = getUser(winnerJid)
  winnerUser.money = (winnerUser.money || 0) + total

  global.scattoWinners ||= []
  global.scattoWinners.unshift({ jid: winnerJid, win: total, name: g.name })
  if (global.scattoWinners.length > 30) global.scattoWinners.length = 30

  conn.sendMessage(chat, {
    text:
`╭━━━〔 🏆 *SCATTO RISOLTO!* 〕━━━┈
┃ 👤 Vincitore: *@${shortJid(winnerJid)}*
┃ 🖼️ Era: ${g.emoji} *${g.name}*
┃
┃ 💰 60% del piatto: +${winPot} 888COIN
┃ ⚡ Bonus velocità: +${bonus} 888COIN
┃ ➕ *Totale: +${total} 888COIN*
┃
┃ 📦 Piatto finale: ${g.pot} 888COIN
╰━━━━━━━━━━━━━━━━━━┈`,
    mentions: [winnerJid]
  }).catch(() => {})
  delete games[chat]
}

function endRefund(conn, chat, why) {
  const g = games[chat]
  if (!g || g.over) return
  g.over = true
  if (g.timer) { clearInterval(g.timer); g.timer = null }

  let refunded = 0
  for (const [jid, stake] of Object.entries(g.bets || {})) {
    const back = Math.floor(stake * REFUND_QUOTA)
    getUser(jid).money = (getUser(jid).money || 0) + back
    refunded += back
  }

  conn.sendMessage(chat, {
    text:
`╭━━━〔 🕗 *SCATTO TERMINATO* 〕━━━┈
┃ ${why}
┃ 🖼️ Il soggetto era: ${g.emoji} *${g.name}*
┃
┃ 💰 Piatto: ${g.pot} 888COIN
┃ ↩️ Restituito (90%): *${refunded} 888COIN*
┃ 🔻 Tassa banco: ~${g.pot - refunded} 888COIN
┃
┃ 📸 Usa .scatto per riprovare!
╰━━━━━━━━━━━━━━━━━━┈`
  }).catch(() => {})
  delete games[chat]
}
    ctx.drawImage(big, cropX, cropY, cropW, cropW, 0, 0, SIZE, SIZE)
  }

  ctx.strokeStyle = '#ffd24a'
  ctx.lineWidth = 5
  ctx.strokeRect(3, 3, SIZE - 6, SIZE - 6)

  return out.toBuffer('image/jpeg', { quality: 0.92 })
}

let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('❌ Questo gioco funziona solo nei gruppi.')

  const chat = m.chat
  const sender = m.sender
  const body = norm(m.text || '')
  const isScatto = /^\.scatto/.test(body)

  if (/^\.scattostat/.test(body)) {
    const wl = global.scattoWinners || []
    if (wl.length === 0) {
      return m.reply('📊 *Classifica SCATTO*\n\nNessun vincitore in questa sessione.')
    }
    const lines = wl
      .sort((a, b) => b.win - a.win)
      .slice(0, 10)
      .map((x, i) => `${i + 1}. @${shortJid(x.jid)} — +${x.win} 888COIN (${x.name})`)
    return m.reply(`📊 *TOP VINCITORI SCATTO*\n\n${lines.join('\n')}\n\n— 888 BOT —`)
  }

  if (!isScatto) return

  const args = body.replace(/^\.scatto/, '').trim().split(/\s+/).filter(Boolean)
  const game = games[chat]

  if (!game) {
    if (args.length > 0) {
      return m.reply('❌ Nessuna partita in corso. Scrivi *".scatto"* per avviarne una.')
    }
    const starter = getUser(sender)
    if ((starter.money || 0) < MIN_BET) {
      return m.reply(`❌ Ti servono almeno *${MIN_BET} 888COIN* per avviare una partita.`)
    }

    const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]
    starter.money -= MIN_BET

    games[chat] = {
      emoji: subject.e,
      name: subject.n,
      step: 0,
      pot: MIN_BET,
      bets: { [sender]: MIN_BET },
      starter: sender,
      over: false,
      timer: null,
      startedAt: Date.now()
    }
    await sendBoard(conn, chat, games[chat], '🎯 *Indovina subito* per il bonus massimo, o aggiungi al piatto!')
    startTimer(conn, chat)
    return
  }

  if (game.over) return

  if (args.length === 0) {
    return m.reply('📸 Partita in corso! Usa: .scatto <parola> · .scatto p <somma> · .scatto zoom · .scatto stop')
  }

  const first = args[0]

  const bareNum = /^\d+$/.test(first) ? parseInt(first, 10) : NaN
  if (first === 'p' || first === 'punto' || (Number.isFinite(bareNum) && bareNum >= MIN_BET)) {
    const amt = (first === 'p' || first === 'punto') ? parseInt(args[1], 10) : bareNum
    if (!amt || !Number.isFinite(amt) || amt < MIN_BET) {
      return m.reply(`❌ Puntata minima *${MIN_BET} 888COIN*.`)
    }
    const u = getUser(sender)
    if ((u.money || 0) < amt) {
      return m.reply(`❌ Hai solo *${u.money || 0} 888COIN* sul conto.`)
    }
    u.money -= amt
    game.bets[sender] = (game.bets[sender] || 0) + amt
    game.pot += amt
    await conn.sendMessage(chat, {
      text: `💵 @${shortJid(sender)} ha puntato *${amt} 888COIN*. Piatto: *${game.pot} 888COIN*`,
      mentions: [sender]
    })
    return
  }

  if (first === 'zoom' || first === 'rivela') {
    const u = getUser(sender)
    if ((u.money || 0) < ZOOM_COST) {
      return m.reply(`❌ Lo zoom costa *${ZOOM_COST} 888COIN* (hai ${u.money || 0} 888COIN).`)
    }
    u.money -= ZOOM_COST
    game.pot += ZOOM_COST
    game.bets[sender] = (game.bets[sender] || 0) + ZOOM_COST
    await conn.sendMessage(chat, { text: '⏭️ Rivela forzata! (+20 888COIN al piatto)' })
    await doReveal(conn, chat)
    return
  }
  if (first === 'stop' || first === 'abbandona') {
    return endRefund(conn, chat, 'Partita annullata.')
  }

  const guessWord = args.join(' ')
  if (findSubject(guessWord)) {
    return endWin(conn, chat, sender)
  }

  const u = getUser(sender)
  if ((u.money || 0) < PENALTY) {
    await conn.sendMessage(chat, {
      text: `❌ @${shortJid(sender)} ha sbagliato (non ha 25 888COIN per la penalità). Rivelo un pezzo…`,
      mentions: [sender]
    })
  } else {
    u.money -= PENALTY
    game.pot += PENALTY
    game.bets[sender] = (game.bets[sender] || 0) + PENALTY
    await conn.sendMessage(chat, {
      text: `❌ @${shortJid(sender)} ha sbagliato e paga *${PENALTY} 888COIN*! Rivelo un pezzo…`,
      mentions: [sender]
    })
  }
  await doReveal(conn, chat)
}

handler.command = /^scatto/i
handler.help = ['scatto', 'scattostat']
handler.tags = ['giochi']
handler.group = true

export default handler