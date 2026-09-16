const playAgainButtons = () => [{
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({ display_text: '🏳️ Nuova Partita', id: `.bandiera` })
}];

let handler = async (m, { conn, args, participants, isAdmin, isBotAdmin, usedPrefix, command }) => {

    let frasi = [
        `🏳️ *Indovina la bandiera*`,
        `🌍 *Geografia 888*`,
        `🎯 *Riconosci la nazione*`,
        `🧠 *Test di geografia*`,
        `🏁 *Quiz bandiere 888*`,
        `📚 *Vediamo quanto sei preparato*`,
        `🔍 *Indovina la nazione*`,
    ];

    // SKIP — 888
    if (m.text?.toLowerCase() === '.skipbandiera') {
        if (!m.isGroup)
            return m.reply(`❌ *Comando non disponibile*\nQuesto comando funziona solo nei gruppi.`);

        if (!global.bandieraGame?.[m.chat])
            return m.reply(`❌ *Nessuna partita*\nNon c’è nessuna partita attiva.`);

        if (!isAdmin && !m.fromMe)
            return m.reply(`⚠️ *Accesso negato*\nSolo gli admin possono interrompere la partita.`);

        clearTimeout(global.bandieraGame[m.chat].timeout);

        let skipText =
`🛑 *Partita interrotta*
━━━━━━━━━━━━━━━━━━
La bandiera era:
➜ *${global.bandieraGame[m.chat].rispostaOriginale}*`;

        await conn.sendMessage(m.chat, {
            text: skipText,
            interactiveButtons: playAgainButtons()
        }, { quoted: m });

        delete global.bandieraGame[m.chat];
        return;
    }

    // Partita già attiva
    if (global.bandieraGame?.[m.chat]) {
        return m.reply(
`⚠️ *Partita in corso*
C’è già una partita attiva!
Rispondi prima che scada il tempo.`
        );
    }

    // Cooldown
    const cooldownKey = `bandiera_${m.chat}`;
    const lastGame = global.cooldowns?.[cooldownKey] || 0;
    const now = Date.now();
    const cooldownTime = 5000;

    if (now - lastGame < cooldownTime) {
        const remainingTime = Math.ceil((cooldownTime - (now - lastGame)) / 1000);
        return m.reply(
`⏳ *Attendi*
Puoi iniziare una nuova partita tra:
➜ *${remainingTime} secondi*`
        );
    }

    global.cooldowns = global.cooldowns || {};
    global.cooldowns[cooldownKey] = now;

    // Lista bandiere
    let bandiere = [
        { url: 'https://flagcdn.com/w320/it.png', nome: 'Italia' },
        { url: 'https://flagcdn.com/w320/fr.png', nome: 'Francia' },
        { url: 'https://flagcdn.com/w320/de.png', nome: 'Germania' },
        { url: 'https://flagcdn.com/w320/gb.png', nome: 'Regno Unito' },
        { url: 'https://flagcdn.com/w320/es.png', nome: 'Spagna' },
        { url: 'https://flagcdn.com/w320/se.png', nome: 'Svezia' },
        { url: 'https://flagcdn.com/w320/no.png', nome: 'Norvegia' },
        { url: 'https://flagcdn.com/w320/fi.png', nome: 'Finlandia' },
        { url: 'https://flagcdn.com/w320/dk.png', nome: 'Danimarca' },
        { url: 'https://flagcdn.com/w320/pl.png', nome: 'Polonia' },
        { url: 'https://flagcdn.com/w320/pt.png', nome: 'Portogallo' },
        { url: 'https://flagcdn.com/w320/gr.png', nome: 'Grecia' },
        { url: 'https://flagcdn.com/w320/ch.png', nome: 'Svizzera' },
        { url: 'https://flagcdn.com/w320/at.png', nome: 'Austria' },
        { url: 'https://flagcdn.com/w320/be.png', nome: 'Belgio' },
        { url: 'https://flagcdn.com/w320/nl.png', nome: 'Paesi Bassi' },
        { url: 'https://flagcdn.com/w320/ua.png', nome: 'Ucraina' },
        { url: 'https://flagcdn.com/w320/us.png', nome: 'Stati Uniti' },
        { url: 'https://flagcdn.com/w320/jp.png', nome: 'Giappone' },
        { url: 'https://flagcdn.com/w320/br.png', nome: 'Brasile' },
        { url: 'https://flagcdn.com/w320/za.png', nome: 'Sudafrica' },
    ];

    let scelta = bandiere[Math.floor(Math.random() * bandiere.length)];
    let frase = frasi[Math.floor(Math.random() * frasi.length)];

    // Avvio partita — 888
    try {
        let startCaption =
`${frase}
━━━━━━━━━━━━━━━━━━
Rispondi con il nome della nazione.
⏱️ Tempo disponibile: *30 secondi*
Rispondi a questo messaggio!`;

        let msg = await conn.sendMessage(m.chat, {
            image: { url: scelta.url },
            caption: startCaption
        }, { quoted: m });

        global.bandieraGame = global.bandieraGame || {};
        global.bandieraGame[m.chat] = {
            id: msg.key.id,
            risposta: scelta.nome.toLowerCase(),
            rispostaOriginale: scelta.nome,
            tentativi: {},
            suggerito: false,
            startTime: Date.now(),
            timeout: setTimeout(async () => {

                if (global.bandieraGame?.[m.chat]) {
                    let timeoutText =
`⏰ *Tempo scaduto*
━━━━━━━━━━━━━━━━━━
La risposta corretta era:
➜ *${scelta.nome}*
Ritenta con una nuova partita!`;

                    await conn.sendMessage(m.chat, {
                        text: timeoutText,
                        interactiveButtons: playAgainButtons()
                    }, { quoted: msg });

                    delete global.bandieraGame[m.chat];
                }

            }, 30000)
        };

    } catch (error) {
        console.error('Errore nel gioco bandiere:', error);
        m.reply(
`❌ *Errore*
Errore inatteso durante l’avvio.
Riprova tra qualche secondo.`
        );
    }
};

// Normalizzazione
function normalizeString(str) {
    return str
        ?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim() || '';
}

function calculateSimilarity(str1, str2) {
    const words1 = str1.split(' ').filter(w => w.length > 1);
    const words2 = str2.split(' ').filter(w => w.length > 1);
    if (!words1.length || !words2.length) return 0;

    const matches = words1.filter(word =>
        words2.some(w2 => w2.includes(word) || word.includes(w2))
    );

    return matches.length / Math.max(words1.length, words2.length);
}

function isAnswerCorrect(userAnswer, correctAnswer) {
    if (userAnswer.length < 2) return false;
    const similarityScore = calculateSimilarity(userAnswer, correctAnswer);

    return (
        userAnswer === correctAnswer ||
        similarityScore >= 0.8 ||
        (correctAnswer.includes(userAnswer) && userAnswer.length > correctAnswer.length * 0.5)
    );
}

// Gestione risposte — 888
handler.before = async (m, { conn }) => {
    const chat = m.chat;
    const game = global.bandieraGame?.[chat];

    if (!game || !m.quoted || m.quoted.id !== game.id || m.key.fromMe) return;

    const userAnswer = normalizeString(m.text || '');
    const correctAnswer = normalizeString(game.risposta);

    if (!userAnswer || userAnswer.length < 2) return;

    const similarityScore = calculateSimilarity(userAnswer, correctAnswer);

    // Risposta corretta
    if (isAnswerCorrect(userAnswer, correctAnswer)) {
        clearTimeout(game.timeout);

        const timeTaken = Math.round((Date.now() - game.startTime) / 1000);

        let congratsMessage =
`🎉 *Risposta corretta*
━━━━━━━━━━━━━━━━━━
Nazione: *${game.rispostaOriginale}*
Tempo impiegato: *${timeTaken}s*`;

        await conn.sendMessage(chat, {
            text: congratsMessage,
            interactiveButtons: playAgainButtons()
        }, { quoted: m });

        delete global.bandieraGame[chat];
        return;
    }

    // Suggerimento
    if (similarityScore >= 0.6 && !game.suggerito) {
        game.suggerito = true;
        return conn.reply(chat,
`👀 *Ci sei quasi*
La tua risposta è molto vicina!`, m);
    }

    // Tentativi
    game.tentativi[m.sender] = (game.tentativi[m.sender] || 0) + 1;
    const tentativiRimasti = 3 - game.tentativi[m.sender];

    if (tentativiRimasti <= 0) {
        let failText =
`❌ *Tentativi esauriti*
Hai sbagliato 3 volte.
Attendi la fine del round.`;

        await conn.sendMessage(chat, {
            text: failText,
            interactiveButtons: playAgainButtons()
        }, { quoted: m });

        delete global.bandieraGame[chat];
        return;
    }

    // Suggerimento lettera
    if (tentativiRimasti === 1) {
        const primaLettera = game.rispostaOriginale[0].toUpperCase();
        const numeroLettere = game.rispostaOriginale.length;

        return conn.reply(chat,
`💡 *Suggerimento*
Inizia con: *${primaLettera}*
Lunghezza: *${numeroLettere} lettere*`, m);
    }

    // Risposta errata
    return conn.reply(chat,
`❌ *Risposta errata*
Tentativi rimasti: *${tentativiRimasti}*
Pensa bene prima di rispondere.`, m);
};

handler.help = ['bandiera'];
handler.tags = ['fun'];
handler.command = /^(bandiera|skipbandiera)$/i;
handler.group = true;

export default handler;