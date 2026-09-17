let handler = async (m, { conn, args }) => {
    const from = m.chat;
    const sender = m.sender;

    // Inizializzazione delle strutture dati globali
    if (!global.dinoSessions) global.dinoSessions = new Map();
    if (!global.dinoScores) global.dinoScores = new Map();

    const OBSTACLES = ["🌵 Cactus", "🌵🌵 Doppio Cactus", "🦅 Pterodattilo", "🪨 Roccia"];
    const getNextObstacle = () => OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];

    const action = args[0]?.toLowerCase();

    // 1. Gestione dei comandi durante una partita attiva (.dino salta / .dino stop)
    if (global.dinoSessions.has(from)) {
        const game = global.dinoSessions.get(from);

        // Risponde solo al giocatore che ha avviato la sessione
        if (game.user !== sender) return;

        if (action === "salta") {
            const crashed = Math.random() < 0.20; // 20% probabilità di Game Over

            if (crashed) {
                const finalScore = game.score;
                const userBest = global.dinoScores.get(sender) || 0;
                let recordText = "";

                if (finalScore > userBest) {
                    global.dinoScores.set(sender, finalScore);
                    recordText = "\n🎉 *Nuovo Record Personale!*";
                }

                await conn.sendMessage(from, { 
                    text: `💥 *GAME OVER!* Hai urtato contro: ${game.currentObstacle}\n\n` +
                          `📊 Punteggio finale: *${finalScore}*${recordText}\n\n` +
                          `Ricomincia quando vuoi con *.dino*` 
                }, { quoted: m });

                global.dinoSessions.delete(from);
            } else {
                game.score += 10;
                game.currentObstacle = getNextObstacle();

                await conn.sendMessage(from, { 
                    text: `🟩 *Salto riuscito!* (+10 pt)\n\n` +
                          `⚠️ *Prossimo ostacolo:* ${game.currentObstacle}\n` +
                          `📊 Punteggio attuale: *${game.score}*\n\n` +
                          `👉 Scrivi *.dino salta* o *.dino stop*` 
                }, { quoted: m });
            }
            return;

        } else if (action === "stop") {
            const finalScore = game.score;
            const userBest = global.dinoScores.get(sender) || 0;

            if (finalScore > userBest) {
                global.dinoScores.set(sender, finalScore);
            }

            await conn.sendMessage(from, { 
                text: `🛑 *Partita terminata!*\n\n` +
                      `📊 Punteggio finale: *${finalScore}*\n` +
                      `🏆 Tuo Record: *${global.dinoScores.get(sender)}*` 
            }, { quoted: m });

            global.dinoSessions.delete(from);
            return;
        }
    }

    // 2. Avvio di una nuova partita (digitando solo .dino)
    if (global.dinoSessions.has(from)) {
        return conn.sendMessage(from, { 
            text: "⚠️ Hai già una partita in corso!\nUsa *.dino salta* per saltare o *.dino stop* per uscire." 
        }, { quoted: m });
    }

    const firstObstacle = getNextObstacle();
    global.dinoSessions.set(from, { 
        score: 0, 
        currentObstacle: firstObstacle,
        user: sender 
    });

    const startText = `🦖 *DINO RUNNER* 🦖\n\n` +
                      `La corsa è iniziata!\n` +
                      `⚠️ *Ostacolo in arrivo:* ${firstObstacle}\n\n` +
                      `👉 Scrivi *.dino salta* per schivare\n` +
                      `👉 Scrivi *.dino stop* per terminare`;

    await conn.sendMessage(from, { text: startText }, { quoted: m });
};

handler.help = ['dino'];
handler.tags = ['fun', 'games'];
handler.command = /^(dino|dinorunner)$/i;

export default handler;
