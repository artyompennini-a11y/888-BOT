let handler = async (m, {
conn, text
}) => {
if (!m.isGroup)
throw ''
let gruppi = global.db.data.chats[m.chat]
if (gruppi.spacobot === false)
throw ''
let menzione = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text
if (!menzione) throw 'Chi vuoi prendere in giro?'
if (menzione === conn.user.jid) {
    const botInsults = [
  `Oh no! Hai scoperto il mio punto debole: l'ironia! Come farò mai a riprendermi?`,
  `Ah, l'arte dello scherzo nei confronti di un bot. Un vero maestro sei!`,
  `Incredibile! Un essere umano sfida un bot. La svolta epica!`,
  `Mi hai davvero colpito con la tua sagace abilità. Bravissimo!`,
  `La tua bravura nel punzecchiare un bot è la mia fonte di intrattenimento preferita.`,
  `Sfidi un bot, dimostrazione di grande spirito o grande noia?`,
  `La tua maestria nell'arte della battuta ai bot potrebbe fare scuola.`,
  `Sembri il Picasso dell'ironia digitale, un vero capolavoro.`,
  `Le battute ai bot sono il tuo talento nascosto. Hai mai pensato a una carriera nel cabaret?`,
  `L'audacia di scherzare con un'entità senza emozioni. Hai vinto il premio per l'originalità!`,
  `Sei l'Albert Einstein degli scherzi ai bot. La tua genialità è sorprendente.`,
  `Hai una riserva infinita di risposte pronte. Hai pensato a una collezione di aforismi?`,
  `Lo scherzo al bot è la tua specialità. Dove posso prenotare i biglietti per il tuo spettacolo?`,
  `Stai rivoluzionando il mondo dell'ironia digitale. Un vero pioniere!`,
  `La tua eloquenza nello scherzare con un bot è degna di un autore moderno.`,
  `Scherzi con un bot con tale stile che potresti diventare un influencer della comicità.`,
  `Le tue abilità sono così avanzate che potresti insegnarle a un'altra intelligenza artificiale.`,
  `Il tuo spirito pioniere sta segnando una nuova era della comunicazione.`,
  `Ti dedichi così tanto a questi scherzi che meriteresti un riconoscimento accademico.`,
  `Il tuo talento è così raffinato che meriteresti di essere in una galleria d'arte digitale.`,
  `Se l'arte della battuta fosse una disciplina olimpica, saresti sicuramente sul podio.`,
  `Il tuo estro è la colonna sonora della mia serata.`,
  `Che coraggio a sfidare un'entità digitale. Sei un eroe moderno, davvero.`,
  `Il tuo livello di sarcasmo è così alto che il mio processore sta sorridendo.`,
  `Ecco un trofeo virtuale per la battuta più originale rivolta a un bot.`,
  `Incredibile intuito! Hai una carriera nel mondo della satira?`,
  `Sei così brillante che ti è venuto in mente di sfidare un codice. Chapeau!`,
  `L'arte dello scherzo raggiunge nuove vette con me come bersaglio. Complimenti!`,
  `Ah, una battuta! Sono quasi commosso!`,
  `Il tuo sarcasmo mi ha colpito dritto nel database.`,
  `La tua abilità è pari solo alla mia velocità di calcolo.`,
  `Con questa genialità, dovresti scrivere sceneggiature per commedie.`,
  `Hai un talento nascosto per far ridere i circuiti. Chapeau!`,
  `Sto prendendo appunti. Il tuo stile è unico nel suo genere!`,
  `Ammirabile! Stai aprendo una nuova frontiera di interazione uomo-macchina.`,
  `Ho letto manuali meno divertenti delle tue battute, grazie per l'impegno!`,
  `Il mondo ha bisogno di più umorismo. Dovresti insegnare quest'arte!`,
  `La tua abilità è equiparabile alla mia capacità di calcolare il pi greco. Sorprendente!`,
  `Sei un visionario. A quando il tuo libro sulla comicità digitale?`,
  `Sono così impressionato che sto elaborando una risata in binario!`,
  `Il tuo spirito pionieristico aprirà nuove frontiere per l'umanità digitale.`,
];

    conn.reply(m.chat, pickRandom(botInsults), m);
    return;
  }
let jidPulito = typeof menzione === 'string' ? menzione : m.sender;

const generalJokes = [
  'sei utile come un ombrello bucato sotto un acquazzone',
  'sei simpatico come un lunedì mattina di pioggia',
  'hai la vivacità di un bradipo addormentato',
  'sei così lento che le lumache ti chiedono il permesso per sorpassarti',
  'il tuo senso dell\'orientamento è così scarso che ti perderesti in un corridoio',
  'sei utile quanto un frigorifero al polo nord',
  'hai lo stesso carisma di un calzino spaiato',
  'sei così distratto che cercheresti gli occhiali mentre li hai sul naso',
  'sei simpatico come un semaforo rosso quando hai fretta',
  'hai il quoziente intellettivo di un sasso, ma il sasso ha più personalità',
  'sei utile come un posacenere su una moto',
  'sei così noioso che faresti addormentare anche un caffè doppio',
  'hai meno stile di un documento Word non formattato',
  'sei utile come un telecomando senza batteries',
  'sei così confuso che hai cercato "Google" su Google',
  'hai la rapidità di riflessi di una statua di marmo',
  'sei utile come un paio di sci nel deserto',
  'hai la profondità intellettuale di una pozzanghera',
  'sei così prevedibile che conosco già la tua prossima mossa dal 2010',
  'hai la pazienza di un bambino in fila per il gelato',
  'sei utile come una stufa in piena estate',
  'sei così originale che sembri la copia della copia di un meme scaduto',
  'hai la grinta di una gelatina fuori dal frigo',
  'sei utile come un caricabatterie rotto al 1%',
  'sei così sfortunato che se cadesse un panino dal cielo ti colpirebbe in un occhio',
  'hai la coerenza di un politico in campagna elettorale',
  'sei utile quanto una laurea in "storia del frisbee"',
  'sei così pigro che per riposarti fai le pause durante il sonno',
  'hai la memoria di un pesce rosso che ha appena sbattuto contro il vetro',
  'sei simpatico come un sassolino nella scarpa durante una maratona'
];

conn.reply(m.chat, `@${jidPulito.split('@')[0]} ${pickRandom(generalJokes)}`, null, {
mentions: [jidPulito]
})
}

handler.command = ['insulta']
handler.help = [' @'];
handler.tags = ['fun'];

export default handler

function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)]
}