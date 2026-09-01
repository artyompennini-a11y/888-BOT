let handler = async (m, { text }) => {

  if (!text)
    return m.reply(
`╭━━━〔 📱 *INSERISCI TELEFONO* 〕━━━┈
┃ Scrivi il modello del tuo telefono.
┃━━━━━━━━━━━━━━━━━━
┃ Esempio:
┃ ➜ .telefono iphone 13
╰━━━━━━━━━━━━━━━━━━┈`
    )

  let t = text.toLowerCase()

  let telefoniValidi = ["iphone", "samsung", "xiaomi", "huawei", "oppo", "realme"]
  let valido = telefoniValidi.some(v => t.includes(v))

  if (!valido) {
    return m.reply(
`╭━━━〔 ❌ *NON È UN TELEFONO* 〕━━━┈
┃ Inserisci un modello reale.
╰━━━━━━━━━━━━━━━━━━┈`
    )
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  const iphone = [
    "Hai speso uno stipendio intero per un telefono identico a quello dell’anno scorso.",
    "Vivi per le storie Instagram: se non posti, non è successo.",
    "La batteria è il tuo peggior nemico: il 20% è un countdown nucleare.",
    "Usi la parola 'ecosistema' per giustificare tutto.",
    "Ti senti superiore… senza motivo.",
    "Hai perso almeno un AirPods.",
    "Cambi iPhone ogni anno ma non sai cosa è cambiato.",
    "Rate infinite, telefono lucido.",
    "Spegni il telefono al 5% come se stessi salvando la tua vita.",
    "Se cade, piangi."
  ]

  const samsung = [
    "Sei il tecnico del gruppo che nessuno ha chiesto.",
    "Hai modificato impostazioni che nemmeno Samsung conosce.",
    "Il telefono può fare tutto… ma usi 3 app.",
    "Batteria infinita, ma lo carichi al 40%.",
    "Hai zoomato la luna almeno una volta.",
    "Leggi specifiche tecniche per divertimento.",
    "Litighi con gli utenti iPhone come fosse guerra.",
    "Ti senti hacker perché hai attivato le opzioni sviluppatore.",
    "Sai tutto del telefono, ma non rispondi ai messaggi.",
    "Ogni anno dici: 'questo è definitivo'. Non è vero."
  ]

  const xiaomi = [
    "Hai speso poco e lo dici a tutti.",
    "Hai visto 47 recensioni prima di comprarlo.",
    "Hai modificato qualcosa entro 24 ore.",
    "Il rapporto qualità/prezzo è la tua religione.",
    "Ti senti più intelligente degli altri.",
    "È veloce, ma ogni tanto fa cose strane.",
    "Le pubblicità nelle app ti hanno temprato.",
    "Sai più tu del telefono che chi lo ha progettato.",
    "Hai aspettato offerte, cashback… rispetto.",
    "Ogni aggiornamento è un salto nel vuoto."
  ]

  const huawei = [
    "Vivi senza Google: scelta di vita.",
    "Fai foto assurde, ma non puoi condividerle facilmente.",
    "Ogni app è una battaglia.",
    "Hai resilienza da guerriero.",
    "Ottimo telefono… in un universo parallelo.",
    "Installi apk strani come fosse normale.",
    "Hai workaround per tutto.",
    "Scelta coraggiosa… o complicata.",
    "Lo difendi anche quando non dovresti.",
    "Il Play Store è un ricordo lontano."
  ]

  const altri = [
    "Nessuno sa che telefono hai, nemmeno tu.",
    "Probabilmente lagga, ma ti sei abituato.",
    "Esiste ancora quel modello? Impressionante.",
    "Sembra uscito da un museo.",
    "L’hai preso in offerta o per disperazione.",
    "Funziona… nei giorni buoni.",
    "La batteria dura perché lo usi poco.",
    "Nome del modello impronunciabile.",
    "Supporto ufficiale? Mai sentito.",
    "È praticamente un reperto storico."
  ]

  let frase = ""

  if (t.includes("iphone")) frase = pickRandom(iphone)
  else if (t.includes("samsung")) frase = pickRandom(samsung)
  else if (t.includes("xiaomi")) frase = pickRandom(xiaomi)
  else if (t.includes("huawei")) frase = pickRandom(huawei)
  else frase = pickRandom(altri)

  let voto = Math.floor(Math.random() * 10) + 1

  let risposta =
`╭━━━〔 📱 *ANALISI TELEFONO* 〕━━━┈

📲 *Dispositivo*
➜ ${text}

🧠 *Profilo utente*
➜ ${frase}

📊 *Valutazione*
➜ ${voto}/10

╰━━━━━━━━━━━━━━━━━━┈
> 𝟴𝟴𝟴 𝗕𝗢𝗧`

  m.reply(risposta.trim())
}

handler.command = ['telefono']
export default handler