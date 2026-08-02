import fs from 'fs';

let handler = async (m, { conn, text, args, command, usedPrefix }) => {

    let user = global.db.data.users[m.sender] ||= {};

    user.rpg ||= {
        livello: 1,
        exp: 0,
        hp: 100,
        hpMax: 100,
        monete: 50,
        classe: null,
        arma: 'Dito spezzato',
        danno: 5
    };

    let rpg = user.rpg;

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


    if (!rpg.classe) {

        if (input.includes('guerriero')) {

            rpg.classe = 'Guerriero';
            rpg.hpMax = 150;
            rpg.hp = 150;
            rpg.arma = 'Spada di Legno';
            rpg.danno = 15;

        } else if (input.includes('mago')) {

            rpg.classe = 'Mago';
            rpg.hpMax = 80;
            rpg.hp = 80;
            rpg.arma = 'Bastone Vecchio';
            rpg.danno = 25;

        } else if (input.includes('ladro')) {

            rpg.classe = 'Ladro';
            rpg.hpMax = 100;
            rpg.hp = 100;
            rpg.arma = 'Pugnale Arrugginito';
            rpg.danno = 20;

        } else {

            return conn.sendMessage(
                m.chat,
                {
                    text:
`🗡️ *BENVENUTO NELL'AVVENTURA!* 🛡️

Scegli la tua classe per iniziare:`,
                    footer: '𝟴𝟴𝟴 𝗕𝗢𝗧',
                    buttons: [
                        {
                            buttonId: `${usedPrefix}${command} guerriero`,
                            buttonText: {
                                displayText: '⚔️ Guerriero'
                            },
                            type: 1
                        },
                        {
                            buttonId: `${usedPrefix}${command} mago`,
                            buttonText: {
                                displayText: '🪄 Mago'
                            },
                            type: 1
                        },
                        {
                            buttonId: `${usedPrefix}${command} ladro`,
                            buttonText: {
                                displayText: '🗡️ Ladro'
                            },
                            type: 1
                        }
                    ],
                    headerType: 1
                },
                {
                    quoted: m
                }
            );
        }


        return conn.sendMessage(
            m.chat,
            {
                text:
`🎉 Ti sei unito alla Gilda degli Avventurieri!

🎭 Classe scelta: *${rpg.classe}*

Usa:
${usedPrefix}${command}

per iniziare la tua avventura.`
            },
            {
                quoted:m
            }
        );
    }


    if (rpg.hp <= 0) {

        rpg.hp = Math.floor(rpg.hpMax / 2);

        return conn.sendMessage(
            m.chat,
            {
                text:
`💀 Sei stato sconfitto!

Un guaritore ti ha riportato in vita.

❤️ HP recuperati: ${rpg.hp}`
            },
            {
                quoted:m
            }
        );
    }


    const armi = [
        {
            nome:'Katana Affilata',
            danno:35
        },
        {
            nome:'Scettro Arcano',
            danno:45
        },
        {
            nome:'Daga dell\'Ombra',
            danno:30
        }
    ];


    let eventi = [

        {
            titolo:'👾 *ATTACCO MOSTRO!*',
            run(){

                let danno = Math.floor(Math.random()*20)+5;
                let exp = 40 + (rpg.livello*5);
                let soldi = Math.floor(Math.random()*30)+10;

                rpg.hp = Math.max(0,rpg.hp-danno);
                rpg.exp += exp;
                rpg.monete += soldi;

                return `
Hai sconfitto un Goblin!

🩸 Danno ricevuto: -${danno} HP
✨ Esperienza: +${exp}
💰 Monete: +${soldi}`;
            }
        },


        {
            titolo:'📦 *BAULE DEL TESORO*',
            run(){

                if(Math.random()<0.3){

                    let arma = armi[Math.floor(Math.random()*armi.length)];

                    if(arma.danno > rpg.danno){

                        rpg.arma = arma.nome;
                        rpg.danno = arma.danno;

                        return `
Hai trovato una nuova arma!

⚔️ ${arma.nome}
💥 Danno: ${arma.danno}`;
                    }
                }


                rpg.monete += 80;

                return `
Hai trovato un tesoro!

💰 +80 monete`;
            }
        },


        {
            titolo:'⚠️ *TRAPPOLA!*',
            run(){

                rpg.hp = Math.max(0,rpg.hp-25);

                return `
Sei caduto in una trappola!

🩸 -25 HP`;
            }
        },


        {
            titolo:'🏛️ *SANTUARIO ANTICO*',
            run(){

                let cura = 40;

                rpg.hp = Math.min(
                    rpg.hpMax,
                    rpg.hp + cura
                );

                return `
Una luce divina ti cura!

❤️ +${cura} HP`;
            }
        }
    ];


    let evento =
        eventi[Math.floor(Math.random()*eventi.length)];


    let risultato = evento.run();


    let levelUp = '';

    let expNecessaria = rpg.livello * 100;


    if(rpg.exp >= expNecessaria){

        rpg.livello++;
        rpg.exp -= expNecessaria;
        rpg.hpMax += 20;
        rpg.hp = rpg.hpMax;
        rpg.danno += 5;

        levelUp =
`\n\n🎉 *LEVEL UP!*

Nuovo livello: ${rpg.livello}`;
    }


    let risposta =
`${evento.titolo}

@${m.sender.split('@')[0]}

${risultato}
${levelUp}

────────────

🎭 Classe: ${rpg.classe}
🎖️ Livello: ${rpg.livello}

❤️ HP: ${rpg.hp}/${rpg.hpMax}

⚔️ Arma: ${rpg.arma}
💥 Danno: ${rpg.danno}

💰 Monete: ${rpg.monete}
✨ XP: ${rpg.exp}/${rpg.livello*100}`;


    await conn.sendMessage(
        m.chat,
        {
            text: risposta,
            mentions:[m.sender]
        },
        {
            quoted:m
        }
    );
};


handler.help = ['avventura'];
handler.tags = ['game'];
handler.command = /^(avventura|esplora|rpg)$/i;

export default handler;