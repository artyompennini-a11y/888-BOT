import htmlApp from '../lib/htmlApp.js' // Assicurati che il percorso verso il file della libreria sia corretto

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let sock = conn
    let jid = m.chat

    await htmlApp.sendHtmlApp(sock, jid, {
        title: 'La Mia App',
        html: '<h1>Ciao</h1><p>Risposta ricca Android</p>',
        url: 'https://crysnowax.link', // Il link del tuo pannello HTML
        trustedSources: ['crysnowax.link'], // Il dominio autorizzato (senza https://)
        status: 'Online 🟢', // Opzionale: mostra uno stato in plain text
        footer: 'Powered by 888-bot' // Opzionale: testo a piè di pagina
    }, { 
        quoted: m // Mantiene la citazione al messaggio dell'utente
    })
}

handler.command = /^(ciao)$/i

export default handler