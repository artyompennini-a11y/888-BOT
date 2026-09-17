const { default: makeWASocket } = require("888-BOT/baileys");

// Mappa per salvare le sessioni di gioco attive e i record degli utenti
const sessions = new Map();
const highScores = new Map();

// Ostacoli casuali per rendere il gioco dinamico
const OBSTACLES = ["🌵 Cactus", "🌵🌵 Doppio Cactus", "🦅 Pterodattilo", "🪨 Roccia"];

function getNextObstacle() {
    return OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
}

async function dinoPlugin(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const input = body.toLowerCase().trim();

    // 1. Avvio del gioco
    if (input === ".giochi" || input === ".dino") {
        if (sessions.has(from)) {
            await sock.sendMessage(from, { text: "⚠️ Hai già una partita in corso! Scrivi *salta* o *stop*." }, { quoted: msg });
            return;
        }

        const firstObstacle = getNextObstacle();
        sessions.set(from, { 
            score: 0, 
            currentObstacle: firstObstacle,
            user: sender 
        });

        const startText = `🦖 *DINO RUNNER* 🦖\n\n` +
                          `La corsa è iniziata!\n` +
                          `⚠️ *Ostacolo in arrivo:* ${firstObstacle}\n\n` +
                          `👉 Invia *salta* per schivarlo\n` +
                          `👉 Invia *stop* per terminare e salvare il punteggio`;

        await sock.sendMessage(from, { text: startText }, { quoted: msg });
        return;
    }

    // 2. Logica di gioco durante una sessione attiva
    if (sessions.has(from)) {
        const game = sessions.get(from);

        // Controllo se il messaggio proviene dal giocatore che ha avviato la partita
        if (game.user !== sender) return;

        if (input === "salta") {
            // Calcolo probabilità di impatto (20% di possibilità di Game Over a ogni salto)
            const crashed = Math.random() < 0.20;

            if (crashed) {
                const finalScore = game.score;
                const userBest = highScores.get(sender) || 0;
                let recordText = "";

                if (finalScore > userBest) {
                    highScores.set(sender, finalScore);
                    recordText = "\n🎉 *Nuovo Record Personale!*";
                }

                await sock.sendMessage(from, { 
                    text: `💥 *GAME OVER!* Hai urtato contro: ${game.currentObstacle}\n\n` +
                          `📊 Punteggio finale: *${finalScore}*${recordText}\n` +
                          `Ricomincia quando vuoi con *.dino*!` 
                }, { quoted: msg });

                sessions.delete(from);
            } else {
                game.score += 10;
                game.currentObstacle = getNextObstacle();

                await sock.sendMessage(from, { 
                    text: `🟩 Salto riuscito! (+10 pt)\n\n` +
                          `⚠️ *Prossimo ostacolo:* ${game.currentObstacle}\n` +
                          `📊 Punteggio attuale: *${game.score}*` 
                }, { quoted: msg });
            }

        } else if (input === "stop") {
            const finalScore = game.score;
            const userBest = highScores.get(sender) || 0;

            if (finalScore > userBest) {
                highScores.set(sender, finalScore);
            }

            await sock.sendMessage(from, { 
                text: `🛑 *Partita terminata!*\n\n` +
                      `📊 Punteggio finale: *${finalScore}*\n` +
                      `🏆 Tuo Record: *${highScores.get(sender)}*` 
            }, { quoted: msg });

            sessions.delete(from);
        }
    }
}

module.exports = { dinoPlugin };
