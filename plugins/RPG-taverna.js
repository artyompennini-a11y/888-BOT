let handler = async (m, { conn, text, command }) => {
    // 🔍 INTERCETTAZIONE DELLA RISPOSTA AI SONDAGGI / BOTTONI NATIVI
    let inputUser = text ? text.toLowerCase().trim() : '';

    // Se l'utente risponde tramite un sondaggio/bottone nativo
    if (m.message?.pollUpdateMessage) {
        // La gestione del poll update viene intercettata dal listener dei sondaggi
        return;
    }

    // Inizializza i dati dell'utente nel database
    let user = global.db.data.users[m.sender];
    if (!user) {
        user = global.db.data.users[m.sender] = {};
    }

    // Default valori RPG
    user.rpg = user.rpg || {
        livello: 1,
        exp: 0,
        hp: 100,
        hpMax: 100,
        monete: 50,
        classe: null,
        arma: 'Dito spezzato',
        danno: 5
    };

    const rpg = user.rpg;

    // 1. SCELTA DELLA CLASSE
    if (!rpg.classe) {
        if (inputUser.includes('guerriero')) {
            rpg.classe = 'Guerriero';
            rpg.hpMax = 150;
            rpg.hp = 150;
            rpg.arma = 'Spada di Legno';
            rpg.danno = 15;
        } else if (inputUser.includes('mago')) {
            rpg.classe = 'Mago';
            rpg.hpMax = 80;
            rpg.hp = 80;
            rpg.arma = 'Bastone Vecchio';
            rpg.danno = 25;
        } else if (inputUser.includes('ladro')) {
            rpg.classe = 'Ladro';
            rpg.hpMax = 100;
            rpg.hp = 100;
            rpg.arma = 'Pugnale Arrugginito';
            rpg.danno = 20;
        } else {
            // INVIO DEL SONDAGGIO COME "BOTTONI" (Funziona su tutte le versioni)
            return await conn.sendMessage(m.chat, {
                poll: {
                    name: "🗡️ *BENVENUTO NELL'AVVENTURA!*\nNon hai ancora una classe. Clicca un'opzione qui sotto per scegliere:",
                    values: [
                        `.${command} guerriero`,
                        `.${command} mago`,
                        `.${command} ladro`
                    ],
                    selectableCount: 1
                }
            }, { quoted: m });
        }

        return await conn.sendMessage(m.chat, {
            text: `🎉 Ti sei iscritto alla Gilda degli Avventurieri come *${rpg.classe}*!\nUsa di nuovo *.${command}* per partire in missione.`
        }, { quoted: m });
    }

    // Controllo morte/riposo
    if (rpg.hp <= 0) {
        if (Math.random() < 0.5) {
            rpg.hp = Math.floor(rpg.hpMax * 0.5);
            return await conn.sendMessage(m.chat, {
                text: `💀 Eri svenuto! Un chierico di passaggio ti ha rianimato. Ora hai *${rpg.hp} HP*.`
            }, { quoted: m });
        } else {
            return await conn.sendMessage(m.chat, {
                text: `💀 Sei troppo debole per combattere! Usa *.riposa* prima di tornare in avventura.`
            }, { quoted: m });
        }
    }

    // 2. SISTEMA DI EVENTI CASUALI
    const armiTrovabili = [
        { nome: 'Katana affilata', danno: 35 },
        { nome: 'Scettro Arcano', danno: 45 },
        { nome: 'Daga dell\'Ombra', danno: 30 }
    ];

    const eventi = [
        {
            titolo: "👾 *ATTACCO DI UN MOSTRO!*",
            azione: (u) => {
                const dannoSubito = Math.floor(Math.random() * 20) + 5;
                const guadagnoExp = 40 + (u.livello * 5);
                const guadagnoMonete = Math.floor(Math.random() * 30) + 10;

                u.hp = Math.max(0, u.hp - dannoSubito);
                u.exp += guadagnoExp;
                u.monete += guadagnoMonete;

                return `Hai sconfitto un *Goblin selvaggio* con il tuo/a _${u.arma}_\n` +
                       `🩸 Danni subiti: -${dannoSubito} HP\n` +
                       `✨ XP ottenuti: +${guadagnoExp}\n` +
                       `💰 Monete trovate: +${guadagnoMonete}`;
            }
        },
        {
            titolo: "📦 *BAULE DEL TESORO*",
            azione: (u) => {
                if (Math.random() < 0.3) {
                    const nuovaArma = armiTrovabili[Math.floor(Math.random() * armiTrovabili.length)];
                    if (nuovaArma.danno > u.danno) {
                        u.arma = nuovaArma.nome;
                        u.danno = nuovaArma.danno;
                        return `Hai aperto un baule e trovato una nuova arma: *${nuovaArma.nome}* (Danno: ${nuovaArma.danno})! 🔥`;
                    }
                }
                const moneteExtra = 80;
                u.monete += moneteExtra;
                return `Hai trovato un vecchio baule pieno d'oro! +${moneteExtra} Monete 🪙`;
            }
        },
        {
            titolo: "⚠️ *TRAPPOLA SCATTATA!*",
            azione: (u) => {
                const dannoTrappola = 25;
                u.hp = Math.max(0, u.hp - dannoTrappola);
                return `Sei caduto in una fossa con spuntoni! Hai perso *${dannoTrappola} HP* 🩸`;
            }
        },
        {
            titolo: "🏛️ *SANTUARIO ANTICO*",
            azione: (u) => {
                const cura = 40;
                u.hp = Math.min(u.hpMax, u.hp + cura);
                return `Una luce divina ti avvolge. Hai recuperato *${cura} HP* ❤️`;
            }
        }
    ];

    const eventoScelto = eventi[Math.floor(Math.random() * eventi.length)];
    const risultato = eventoScelto.azione(rpg);

    // 3. CONTROLLO LEVEL UP
    let msgLevelUp = '';
    const expNecessaria = rpg.livello * 100;
    if (rpg.exp >= expNecessaria) {
        rpg.livello += 1;
        rpg.exp -= expNecessaria;
        rpg.hpMax += 20;
        rpg.hp = rpg.hpMax;
        rpg.danno += 5;
        msgLevelUp = `\n\n🎉 *LEVEL UP!* Sei salito al *Livello ${rpg.livello}*!`;
    }

    // 4. MESSAGGIO FINALE
    let risposta = `${eventoScelto.titolo}\n\n`;
    risposta += `@${m.sender.split('@')[0]}\n`;
    risposta += `${risultato}${msgLevelUp}\n\n`;
    risposta += `───────────────\n`;
    risposta += `🎭 *Classe:* ${rpg.classe} | 🎖️ *Livello:* ${rpg.livello}\n`;
    risposta += `❤️ *HP:* ${rpg.hp}/${rpg.hpMax} | ⚔️ *Arma:* ${rpg.arma} (${rpg.danno} DMG)\n`;
    risposta += `💰 *Monete:* ${rpg.monete} | ✨ *XP:* ${rpg.exp}/${rpg.livello * 100}`;

    await conn.sendMessage(m.chat, {
        text: risposta,
        mentions: [m.sender]
    }, { quoted: m });
};

handler.help = ['avventura'];
handler.tags = ['game'];
handler.command = /^(avventura|esplora|rpg)$/i;

export default handler;