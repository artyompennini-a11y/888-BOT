const playAgainButtons = () => [{
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({ display_text: '🏳️ Nuova Partita', id: `.bandiera` })
}];

let handler = async (m, { conn, args, participants, isAdmin, isBotAdmin, usedPrefix, command }) => {

    let frasi = [
        `╭━━━〔 🏳️ *INDOVINA LA BANDIERA* 〕━━━┈`,
        `╭━━━〔 🌍 *GEOGRAFIA 888* 〕━━━┈`,
        `╭━━━〔 🎯 *RICONOSCI LA NAZIONE* 〕━━━┈`,
        `╭━━━〔 🧠 *TEST DI GEOGRAFIA* 〕━━━┈`,
        `╭━━━〔 🏁 *QUIZ BANDIERE 888* 〕━━━┈`,
        `╭━━━〔 📚 *VEDIAMO QUANTO SEI PREPARATO* 〕━━━┈`,
        `╭━━━〔 🔍 *INDOVINA LA NAZIONE* 〕━━━┈`,
    ];

    // ───────────────────────────────
    // 🔥 COMANDO SKIP — 888
    // ───────────────────────────────
    if (m.text?.toLowerCase() === '.skipbandiera') {
        if (!m.isGroup)
            return m.reply(
`╭━━━〔 ❌ *COMANDO NON DISPONIBILE* 〕━━━┈
┃ Questo comando funziona solo nei gruppi.
╰━━━━━━━━━━━━━━━━━━┈`
            );

        if (!global.bandieraGame?.[m.chat])
            return m.reply(
`╭━━━〔 ❌ *NESSUNA PARTITA* 〕━━━┈
┃ Non c’è nessuna partita attiva.
╰━━━━━━━━━━━━━━━━━━┈`
            );

        if (!isAdmin && !m.fromMe)
            return m.reply(
`╭━━━〔 ⚠️ *ACCESSO NEGATO* 〕━━━┈
┃ Solo gli admin possono interrompere la partita.
╰━━━━━━━━━━━━━━━━━━┈`
            );

        clearTimeout(global.bandieraGame[m.chat].timeout);

        let skipText =
`╭━━━〔 🛑 *PARTITA INTERROTTA* 〕━━━┈
┃ La bandiera era:
┃ ➜ *${global.bandieraGame[m.chat].rispostaOriginale}*
╰━━━━━━━━━━━━━━━━━━┈`;

        await conn.sendMessage(m.chat, {
            text: skipText,
            footer: '𝟴𝟴𝟴 𝗕𝗢𝗧',
            interactiveButtons: playAgainButtons()
        }, { quoted: m });

        delete global.bandieraGame[m.chat];
        return;
    }

    // ───────────────────────────────
    // 🔥 PARTITA GIÀ ATTIVA — 888
    // ───────────────────────────────
    if (global.bandieraGame?.[m.chat]) {
        return m.reply(
`╭━━━〔 ⚠️ *PARTITA IN CORSO* 〕━━━┈
┃ C’è già una partita attiva!
┃ Rispondi prima che scada il tempo.
╰━━━━━━━━━━━━━━━━━━┈`
        );
    }

    // ───────────────────────────────
    // 🔥 COOLDOWN — 888
    // ───────────────────────────────
    const cooldownKey = `bandiera_${m.chat}`;
    const lastGame = global.cooldowns?.[cooldownKey] || 0;
    const now = Date.now();
    const cooldownTime = 5000;

    if (now - lastGame < cooldownTime) {
        const remainingTime = Math.ceil((cooldownTime - (now - lastGame)) / 1000);
        return m.reply(
`╭━━━〔 ⏳ *ATTENDI* 〕━━━┈
┃ Puoi iniziare una nuova partita tra:
┃ ➜ *${remainingTime} secondi*
╰━━━━━━━━━━━━━━━━━━┈`
        );
    }

    global.cooldowns = global.cooldowns || {};
    global.cooldowns[cooldownKey] = now;

    // ───────────────────────────────
    // 🔥 LISTA BANDIERE
    // ───────────────────────────────
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
        // … (resto invariato)
    ];

    let scelta = bandiere[Math.floor(Math.random() * bandiere.length)];
    let frase = frasi[Math.floor(Math.random() * frasi.length)];

    // ───────────────────────────────
    // 🔥 AVVIO PARTITA — 888
    // ───────────────────────────────
    try {
        let startCaption =
`${frase}
┃ Rispondi con il nome della nazione.
┃ ⏱️ Tempo disponibile: *30 secondi*
┃━━━━━━━━━━━━━━━━━━
┃ Rispondi a questo messaggio!
╰━━━━━━━━━━━━━━━━━━┈`;

        let msg = await conn.sendMessage(m.chat, {
            image: { url: scelta.url },
            caption: startCaption,
            footer: '𝟴𝟴𝟴 𝗕𝗢𝗧'
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
`╭━━━〔 ⏰ *TEMPO SCADUTO* 〕━━━┈
┃ La risposta corretta era:
┃ ➜ *${scelta.nome}*
┃ Ritenta con una nuova partita!
╰━━━━━━━━━━━━━━━━━━┈`;

                    await conn.sendMessage(m.chat, {
                        text: timeoutText,
                        footer: '𝟴𝟴𝟴 𝗕𝗢𝗧',
                        interactiveButtons: playAgainButtons()
                    }, { quoted: msg });

                    delete global.bandieraGame[m.chat];
                }

            }, 30000)
        };

    } catch (error) {
        console.error('Errore nel gioco bandiere:', error);
        m.reply(
`╭━━━〔 ❌ *ERRORE* 〕━━━┈
┃ Errore inatteso durante l’avvio.
┃ Riprova tra qualche secondo.
╰━━━━━━━━━━━━━━━━━━┈`
        );
    }
};

// ───────────────────────────────
// 🔥 FUNZIONI DI NORMALIZZAZIONE
// ───────────────────────────────
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

// ───────────────────────────────
// 🔥 GESTIONE RISPOSTE — 888
// ───────────────────────────────
handler.before = async (m, { conn, usedPrefix, command }) => {
    const chat = m.chat;
    const game = global.bandieraGame?.[chat];

    if (!game || !m.quoted || m.quoted.id !== game.id || m.key.fromMe) return;

    const userAnswer = normalizeString(m.text || '');
    const correctAnswer = normalizeString(game.risposta);

    if (!userAnswer || userAnswer.length < 2) return;

    const similarityScore = calculateSimilarity(userAnswer, correctAnswer);

    // ───────────────────────────────
    // 🔥 RISPOSTA CORRETTA — 888
    // ───────────────────────────────
    if (isAnswerCorrect(userAnswer, correctAnswer)) {
        clearTimeout(game.timeout);

        const timeTaken = Math.round((Date.now() - game.startTime) / 1000);

        let congratsMessage =
`╭━━━〔 🎉 *RISPOSTA CORRETTA* 〕━━━┈
┃ Nazione: *${game.rispostaOriginale}*
┃ Tempo impiegato: *${timeTaken}s*
╰━━━━━━━━━━━━━━━━━━┈`;

        await conn.sendMessage(chat, {
            text: congratsMessage,
            footer: '𝟴𝟴𝟴 𝗕𝗢𝗧',
            interactiveButtons: playAgainButtons()
        }, { quoted: m });

        delete global.bandieraGame[chat];
        return;
    }

    // ───────────────────────────────
    // 🔥 SUGGERIMENTO — 888
    // ───────────────────────────────
    if (similarityScore >= 0.6 && !game.suggerito) {
        game.suggerito = true;
        return conn.reply(chat,
`╭━━━〔 👀 *CI SEI QUASI* 〕━━━┈
┃ La tua risposta è molto vicina!
╰━━━━━━━━━━━━━━━━━━┈`, m);
    }

    // ───────────────────────────────
    // 🔥 TENTATIVI — 888
    // ───────────────────────────────
    game.tentativi[m.sender] = (game.tentativi[m.sender] || 0) + 1;
    const tentativiRimasti = 3 - game.tentativi[m.sender];

    if (tentativiRimasti <= 0) {
        let failText =
`╭━━━〔 ❌ *TENTATIVI ESAURITI* 〕━━━┈
┃ Hai sbagliato 3 volte.
┃ Attendi la fine del round.
╰━━━━━━━━━━━━━━━━━━┈`;

        await conn.sendMessage(chat, {
            text: failText,
            footer: '𝟴𝟴𝟴 𝗕𝗢𝗧',
            interactiveButtons: playAgainButtons()
        }, { quoted: m });

        delete global.bandieraGame[chat];
        return;
    }

    // ───────────────────────────────
    // 🔥 SUGGERIMENTO LETTERA — 888
    // ───────────────────────────────
    if (tentativiRimasti === 1) {
        const primaLettera = game.rispostaOriginale[0].toUpperCase();
        const numeroLettere = game.rispostaOriginale.length;

        return conn.reply(chat,
`╭━━━〔 💡 *SUGGERIMENTO* 〕━━━┈
┃ Inizia con: *${primaLettera}*
┃ Lunghezza: *${numeroLettere} lettere*
╰━━━━━━━━━━━━━━━━━━┈`, m);
    }

    // ───────────────────────────────
    // 🔥 RISPOSTA SBAGLIATA — 888
    // ───────────────────────────────
    return conn.reply(chat,
`╭━━━〔 ❌ *RISPOSTA ERRATA* 〕━━━┈
┃ Tentativi rimasti: *${tentativiRimasti}*
┃ Pensa bene prima di rispondere.
╰━━━━━━━━━━━━━━━━━━┈`, m);
};

handler.help = ['bandiera'];
handler.tags = ['fun'];
handler.command = /^(bandiera|skipbandiera)$/i;
handler.group = true;

export default handler;