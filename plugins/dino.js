import htmlApp from '../lib/htmlApp.js' // Aggiusta il percorso se la cartella 'lib' si trova altrove

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let sock = conn
    let jid = m.chat

    await htmlApp.sendHtmlApp(sock, jid, {
        title: 'My App',
        html: '<h1>Hello</h1>',
        url: 'https://crysnowax.link',
        trustedSources: ['crysnowax.link']
    }, { 
        quoted: m 
    })
}

handler.command = /^(myapp|htmlapp)$/i

export default handler