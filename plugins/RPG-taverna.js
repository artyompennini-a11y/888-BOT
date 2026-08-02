let handler = async (m, { conn, text, args, command }) => {
    if (!global.db?.data?.users) return;

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
    .toLowerCase()
    .trim();


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

Scegli la tua classe:

⚔️ Guerriero
🪄 Mago
🗡️ Ladro

Usa:
.${command} guerriero
.${command} mago
.${command} ladro`
                },
                { quoted:m }
            );
        }


        return conn.sendMessage(
            m.chat,
            {
                text:
`🎉 Sei entrato nella Gilda come *${rpg.classe}*!

Usa ancora:
.${command}

per iniziare l'avventura.`
            },
            { quoted:m }
        );
    }


    if (rpg.hp <= 0) {

        rpg.hp = Math.floor(rpg.hpMax / 2);

        return conn.sendMessage(
            m.chat,
            {
                text:
`💀 Sei stato rianimato!

❤️ HP ripristinati: ${rpg.hp}`
            },
            { quoted:m }
        );
    }


    const armi = [
        ["Katana Affilata",35],
        ["Scettro Arcano",45],
        ["Daga dell'Ombra",30]
    ];


    let eventi = [

        () => {

            let danno = Math.floor(Math.random()*20)+5;
            let xp = 40+(rpg.livello*5);
            let soldi = Math.floor(Math.random()*30)+10;

            rpg.hp=Math.max(0,rpg.hp-danno);
            rpg.exp+=xp;
            rpg.monete+=soldi;

            return `👾 Hai sconfitto un Goblin!

🩸-${danno} HP
✨+${xp} XP
💰+${soldi} monete`;
        },


        () => {

            if(Math.random()<0.3){

                let arma=armi[Math.floor(Math.random()*armi.length)];

                if(arma[1]>rpg.danno){

                    rpg.arma=arma[0];
                    rpg.danno=arma[1];

                    return `📦 Hai trovato:
⚔️ *${arma[0]}*
Danno: ${arma[1]}`;
                }
            }

            rpg.monete+=80;

            return `📦 Hai trovato un tesoro!

💰+80 monete`;
        },


        () => {

            rpg.hp=Math.max(0,rpg.hp-25);

            return `⚠️ Trappola!

🩸-25 HP`;
        },


        () => {

            let cura=40;

            rpg.hp=Math.min(rpg.hpMax,rpg.hp+cura);

            return `🏛️ Santuario antico!

❤️+${cura} HP`;
        }
    ];


    let risultato =
        eventi[Math.floor(Math.random()*eventi.length)]();


    let level = rpg.livello*100;

    let levelup='';

    if(rpg.exp>=level){

        rpg.livello++;
        rpg.exp-=level;
        rpg.hpMax+=20;
        rpg.hp=rpg.hpMax;
        rpg.danno+=5;

        levelup=
`\n\n🎉 LEVEL UP!
Nuovo livello: ${rpg.livello}`;
    }


    let msg =
`⚔️ *AVVENTURA*

@${m.sender.split('@')[0]}

${risultato}
${levelup}

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
            text:msg,
            mentions:[m.sender]
        },
        {quoted:m}
    );
};


handler.help=['avventura'];
handler.tags=['game'];

handler.command =
/^(avventura|esplora|rpg)(.*)?$/i;


export default handler;