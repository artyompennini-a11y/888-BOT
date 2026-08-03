import fs from 'fs';

let handler = async (m, { conn, text, args, command, usedPrefix }) => {

    let user = global.db.data.users[m.sender] ||= {};

    user.avventura ||= {
        livello: 1,
        exp: 0,
        hp: 100,
        hpMax: 100,
        monete: 50,
        classe: null,
        arma: 'Dito spezzato',
        danno: 5
    };

    let avventura = user.avventura;

    let input = [
        text,
        args.join(' '),
        m.text,
        m.message?.conversation,
        m.message?.extendedTextMessage?.text,
        m.message?.buttonsResponseMessage?.selectedButtonId,
        m.message?.templateButtonReplyMessage?.selectedId,
        m.message?.listResponseMessage?.singleSelectReply?.selectedRowId
    ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

    // Selezione della classe
    if (!avventura.classe) {

        if (input.includes('guerriero')) {
            avventura.classe = 'Guerriero';
            avventura.hpMax = 150;
            avventura.hp = 150;
            avventura.arma = 'Spada di Legno';
            avventura.danno = 15;
        } else if (input.includes('mago')) {
            avventura.classe = 'Mago';
            avventura.hpMax = 80;
            avventura.hp = 80;
            avventura.arma = 'Bastone Vecchio';
            avventura.danno = 25;
        } else if (input.includes('ladro')) {
            avventura.classe = 'Ladro';
            avventura.hpMax = 100;
            avventura.hp = 100;
            avventura.arma = 'Pugnale Arrugginito';
            avventura.danno = 20;
        } else {
            return conn.sendMessage(
                m.chat,
                {
                    text: `🗡️ *BENVENUTO NELL'AVVENTURA!* 🛡️\n\nScegli la tua classe per iniziare:`,
                    footer: '𝟴𝟴𝟴 𝗕𝗢𝗧',
                    buttons: [
                        {
                            buttonId: `${usedPrefix}${command} guerriero`,
                            buttonText: { displayText: '⚔️ Guerriero' },
                            type: 1
                        },
                        {
                            buttonId: `${usedPrefix}${command} mago`,
                            buttonText: { displayText: '🪄 Mago' },
                            type: 1
                        },
                        {
                            buttonId: `${usedPrefix}${command} ladro`,
                            buttonText: { displayText: '🗡️ Ladro' },
                            type: 1
                        }
                    ],
                    headerType: 1
                },
                { quoted: m }
            );
        }

        return conn.sendMessage(
            m.chat,
            {
                text: `🎉 Ti sei unito alla Gilda degli Avventurieri!\n\n🎭 Classe scelta: *${avventura.classe}*\n\nUsa:\n${usedPrefix}${command}\n\nper iniziare la tua avventura.`
            },
            { quoted: m }
        );
    }

    // Gestione morte
    if (avventura.hp <= 0) {
        avventura.hp = Math.floor(avventura.hpMax / 2);

        return conn.sendMessage(
            m.chat,
            {
                text: `💀 Sei stato sconfitto!\n\nUn guaritore ti ha riportato in vita.\n\n❤️ HP recuperati: ${avventura.hp}`
            },
            { quoted: m }
        );
    }

    const armi = [
        { nome: 'Katana Affilata', danno: 35 },
        { nome: 'Scettro Arcano', danno: 45 },
        { nome: 'Daga dell\'Ombra', danno: 30 }
    ];

    let eventi = [
        {
            titolo: '👾 *ATTACCO MOSTRO!*',
            run() {
                let danno = Math.floor(Math.random() * 20) + 5;
                let exp = 40 + (avventura.livello * 5);
                let soldi = Math.floor(Math.random() * 30) + 10;

                avventura.hp = Math.max(0, avventura.hp - danno);
                avventura.exp += exp;
                avventura.monete += soldi;

                return `Hai sconfitto un Goblin!\n\n🩸 Danno ricevuto: -${danno} HP\n✨ Esperienza: +${exp}\n💰 Monete: +${soldi}`;
            }
        },
        {
            titolo: '📦 *BAULE DEL TESORO*',
            run() {
                if (Math.random() < 0.3) {
                    let arma = armi[Math.floor(Math.random() * armi.length)];

                    if (arma.danno > avventura.danno) {
                        avventura.arma = arma.nome;
                        avventura.danno = arma.danno;

                        return `Hai trovato una nuova arma!\n\n⚔️ ${arma.nome}\n💥 Danno: ${arma.danno}`;
                    }
                }

                avventura.monete += 80;
                return `Hai trovato un tesoro!\n\n💰 +80 monete`;
            }
        },
        {
            titolo: '⚠️ *TRAPPOLA!*',
            run() {
                avventura.hp = Math.max(0, avventura.hp - 25);
                return `Sei caduto in una trappola!\n\n🩸 -25 HP`;
            }
        },
        {
            titolo: '🏛️ *SANTUARIO ANTICO*',
            run() {
                let cura = 40;
                avventura.hp = Math.min(avventura.hpMax, avventura.hp + cura);
                return `Una luce divina ti cura!\n\n❤️ +${cura} HP`;
            }
        }
    ];

    let evento = eventi[Math.floor(Math.random() * eventi.length)];
    let risultato = evento.run();

    let levelUp = '';
    let expNecessaria = avventura.livello * 100;

    if (avventura.exp >= expNecessaria) {
        avventura.livello++;
        avventura.exp -= expNecessaria;
        avventura.hpMax += 20;
        avventura.hp = avventura.hpMax;
        avventura.danno += 5;

        levelUp = `\n\n🎉 *LEVEL UP!*\n\nNuovo livello: ${avventura.livello}`;
    }

    let risposta = `${evento.titolo}\n\n@${m.sender.split('@')[0]}\n\n${risultato}${levelUp}\n\n────────────\n\n🎭 Classe: ${avventura.classe}\n🎖️ Livello: ${avventura.livello}\n\n❤️ HP: ${avventura.hp}/${avventura.hpMax}\n\n⚔️ Arma: ${avventura.arma}\n💥 Danno: ${avventura.danno}\n\n💰 Monete: ${avventura.monete}\n✨ XP: ${avventura.exp}/${avventura.livello * 100}`;

    await conn.sendMessage(
        m.chat,
        {
            text: risposta,
            mentions: [m.sender]
        },
        { quoted: m }
    );
};

handler.help = ['avventura'];
handler.tags = ['game'];
handler.command = /^(avventura|esplora)$/i;

export default handler;