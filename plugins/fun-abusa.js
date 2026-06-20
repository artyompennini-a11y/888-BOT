let handler = async (m, { conn, participants }) => {
    if (!m.mentionedJid || !m.mentionedJid[0]) {
        return conn.reply(m.chat, "❌ Usa: `.abusa @persona`", m);
    }

    const victim = m.mentionedJid[0];
    const victimMention = `@${victim.split('@')[0]}`;

    const insultiSiciliani = [
        `${victimMention} si na **vastasa** di merda, figghiu di buttana!`,
        `${victimMention} va a moriri ammazzatu, strunzu inutili!`,
        `${victimMention} si na **chiavica** camminanti, pezzu di munnezza!`,
        `${victimMention} to matri si nni penti ogni jorno d'aviriti fattu!`,
        `${victimMention} si un **cornutu** patentatu, levelu mastru!`,
        `${victimMention} non vali mancu na lira, sfigatu di minchia!`,
        `${victimMention} si na **faccia di cazzu**, vai a cuccariti!`,
        `${victimMention} to soro è na troia e tu si n'autru strunzu!`,
        `${victimMention} si cusì brutu ca fai schifu puru ai cani!`,
        `${victimMention} va a pigghia 'u sole, vastaso fallitu!`,
        `${victimMention} si un **abortu** ca è sopravvissutu pi sbagghiu!`,
        `${victimMention} non ti voli nuddu, mancu to matri!`,
        `${victimMention} si na **munnezza** umana, schifiusu!`,
        `${victimMention} hai u cerviddu ch'è cchiù vacanti di na lattina!`,
        `${victimMention} si un **leccaculu** patentatu!`,
        `${victimMention} to patre è cornutu e to matri buttana!`,
        `${victimMention} si cusì inutili ca mancu l'infernu ti voli!`,
        `${victimMention} va a futtiti, ricchione di merda!`,
        `${victimMention} si na **schifezza** cu li gammi!`,
        `${victimMention} non vali nenti, zero assoluto!`,
        `${victimMention} si un curnutu ca cammina!`,
        `${victimMention} to famiglia è na razza di vastasi!`,
        `${victimMention} si brutu dintra e fora, mostru sicilianu!`,
        `${victimMention} va a moriri, pezzu di merda!`,
        `${victimMention} si na **diarrea** ca è venuta fora pi sbagghiu!`,
        `${victimMention} non ti sopporta nuddu, mancu to stessu riflessu!`,
        `${victimMention} si un fallimentu geneticu!`,
        `${victimMention} figghiu di na grandissima buttana!`,
        `${victimMention} si cusì pateticu ca fai pena!`,
        `${victimMention} va a cuccati, strunzu!`,
        `${victimMention} si na **minchia** moscia!`,
        `${victimMention} to vita è na completa perdita di tempu!`,
        `${victimMention} si un scartu di fabbrica!`,
        `${victimMention} hai na faccia ca pari un incidente!`,
        `${victimMention} si na **troia** masculina!`,
        `${victimMention} non meriti mancu l'aria ca respiri!`,
        `${victimMention} si un rifiutu umani!`,
        `${victimMention} vastaso, cornutu e strunzu!`,
        `${victimMention} si na cosa ca mancu Dio la voli!`,
        `${victimMention} va a futtiri i porci!`,
        `${victimMention} si cusì inutili ca pari un preservativu bucatu!`,
        `${victimMention} to matri ti avi vulutu abortiri!`,
        `${victimMention} si na **cacata** ambulanti!`,
        `${victimMention} non hai dignità, pezzu di lignu!`,
        `${victimMention} si un curnutazzu!`,
        `${victimMention} vai a nasconditi, schifiusu!`,
        `${victimMention} si na delusione ambulanti!`,
        `${victimMention} figghiu di buttana e patri ignotu!`,
        `${victimMention} si na **puzza** ca cammina!`,
        `${victimMention} non ti voli nuddu 'ntu stu munnu!`,
        `${victimMention} si un **leccaminchia** di prima categoria!`,
        `${victimMention} to esistenza è na punizione!`,
        `${victimMention} si na merda ca cadiu di u celu!`,
        `${victimMention} vastaso, strunzu, e curnutu!`,
        `${victimMention} si cusì brutu ca u specchiu si rumpi!`,
        `${victimMention} va a pigghia 'n culu!`,
        `${victimMention} si un scemu patentatu!`,
        `${victimMention} non hai cerviddu, sulu aria!`,
        `${victimMention} si na **buttana** falluta!`,
        `${victimMention} to vita è na tragedia greca!`,
        `${victimMention} si un rifiutu di a società!`,
        `${victimMention} figghiu di na zoccola!`,
        `${victimMention} si na cosa inutili e schifusa!`,
        `${victimMention} va a moriri luntanu!`,
        `${victimMention} si un **minchione** senza rimediu!`,
        `${victimMention} to famiglia si nni vergogna di tia!`,
        `${victimMention} si na munnezza ca nun si ricicla!`,
        `${victimMention} hai u cori nivuru comu na pece!`,
        `${victimMention} si un tradituri e strunzu!`,
        `${victimMention} non meriti mancu compassione!`,
        `${victimMention} si na **cacarella** cronica!`,
        `${victimMention} vastaso di merda!`,
        `${victimMention} si cusì vacanti dintra ca pari na conchiglia!`,
        `${victimMention} va a futtiti cu to soru!`,
        `${victimMention} si un fallimentu viventi!`,
        `${victimMention} non vali nenti, sulu a pena di vista!`,
        `${victimMention} si na **faccia di culu**!`,
        `${victimMention} to matri è na buttana famosa!`,
        `${victimMention} si un scarto geneticu!`,
        `${victimMention} va a cuccari sutta u ponti!`,
        `${victimMention} si na cosa ca fa schifu puru a li moschi!`,
        `${victimMention} non hai amici, sulu nemici!`,
        `${victimMention} si un **ricchione** fallutu!`,
        `${victimMention} to vita è na barzelletta trista!`,
        `${victimMention} si na merda supra na scarpa!`,
        `${victimMention} vastasu, curnutu e strunzu!`,
        `${victimMention} si un abortu ca cammina!`,
        `${victimMention} non ti saluta nuddu!`,
        `${victimMention} si na **puzza** ca nun passa!`,
        `${victimMention} figghiu di na grandissima troia!`,
        `${victimMention} si cusì inutili ca mancu li topi ti mangiano!`,
        `${victimMention} va a moriri 'n silenzio!`,
        `${victimMention} si un curnutazzu patentatu!`,
        `${victimMention} si na schifezza umana!`,
        `${victimMention} to esistenza è na iurnata persa!`,
        `${victimMention} si un strunzu senza speranze!`,
        `${victimMention} vastaso di merda, vai a futtiti!`
    ];

    const randomInsulto = insultiSiciliani[Math.floor(Math.random() * insultiSiciliani.length)];

    await conn.sendMessage(m.chat, {
        text: `🔥 *ABUSA SICILIANO MODE* 🔥\n\n` +
              `🎯 *Vittima:* ${victimMention}\n\n` +
              `${randomInsulto}\n\n` +
              `🖕 Riposa 'n curnutaggine, pezzu di merda.`,
        mentions: [victim]
    });
};

handler.help = ['abusa'];
handler.tags = ['fun', 'games'];
handler.command = /^(abusa)$/i;
handler.group = true;

export default handler;
