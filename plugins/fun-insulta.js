let handler = async (m, { conn, text }) => {
    if (!m.isGroup) throw 'Questo comando funziona solo nei gruppi.';

    let menzione = m.mentionedJid?.[0] || m.quoted?.sender || text?.replace(/@/, '') + '@s.whatsapp.net';
    if (!menzione) throw 'Chi cazzo vuoi insultare? Tagga o rispondi a qualcuno.';

    if (menzione === conn.user.jid) {
        const botInsults = [
            "Oh no, mi hai ferito mortalmente... aspetta, no, sono un bot del cazzo.",
            "Insultare un bot? Complimenti per il QI da scarafaggio.",
            "Sei così intelligente che insulti un'entità senza emozioni. Capolavoro.",
            "Il tuo insulto mi ha fatto tremare... di risate.",
        ];
        return conn.reply(m.chat, pickRandom(botInsults), m);
    }

    const insults = [
        "tua madre è una troia così usata che ha il buco del culo con il codice a barre.",
        "sei così brutto che quando sei nato l'ostetrica ha vomitato e tuo padre si è sparato.",
        "sei un aborto fallito che la natura ha deciso di lasciare in vita per punire l'umanità.",
        "tua sorella è così troia che fa i turni come il McDrive, 24 ore su 24.",
        "hai il cazzo così piccolo che quando pisci devi sederti per non bagnarti le scarpe.",
        "sei così cornuto che tua madre ti chiama 'figlio del postino' per affetto.",
        "tua madre è come un distributore automatico: si fa infilare soldi e dà il resto.",
        "sei talmente negro che quando entri in acqua il mare diventa petrolio.",
        "tua madre ha preso più cazzi lei di quanti ne abbia visti un urologo in carriera.",
        "sei così sfigato che se ti buttano dal balcone atterri in piedi... su una merda.",
        "hai la faccia che sembra sia stata usata come sacco da boxe da Mike Tyson ubriaco.",
        "sei inutile come un preservativo bucato dopo una gangbang.",
        "tua madre è così grassa che quando va al mare le balene cantano 'Free Willy'.",
        "sei così stupido che pensi che il clitoride sia una marca di automobili.",
        "tua sorella apre le gambe più facilmente di quanto si apra una porta automatica.",
        "hai il QI così basso che sembri il risultato di un'incestuosa tra fratelli.",
        "sei così povero che tua madre si prostituisce per pagare la bolletta della luce.",
        "tua madre è una grandissima puttana, talmente puttana che ha la tessera fedeltà al bordello.",
        "sei un rifiuto umano che nemmeno il cassonetto dell'immondizia vuole.",
        "hai la faccia di uno che è stato partorito dal culo invece che dalla fica.",
        "sei così brutto che tua madre ti allattava con la maschera antigas.",
        "tua madre fa più pompini di quanti respiri fai tu in un giorno.",
        "sei un coglione con i risvoltini, un fallimento ambulante.",
        "hai il cazzo storto come la tua vita, inutile e ridicolo.",
        "sei talmente bastardo che tuo padre non sa nemmeno di averti fatto.",
        "tua madre è come il WiFi pubblico: tutti ci si connettono e la usano gratis.",
        "sei così schifoso che quando sudi puzza di pesce marcio e sperma vecchio.",
        "hai più corna di un cervo in calore, cornuto patentato.",
        "tua sorella è la troia ufficiale del quartiere, tutti hanno il biglietto.",
        "sei un aborto di 30 anni che cammina ancora.",
        "tua madre ha il passaporto pieno di timbri di cazzi stranieri.",
        "sei così inutile che nemmeno la morte ti vuole, ti lascia soffrire.",
        "hai la personalità di una merda secca attaccata sotto la scarpa.",
        "sei brutto dentro e fuori, un mostro che nemmeno Frankenstein vorrebbe.",
        "tua madre è una vacca da monta che ha dato latte a mezza città.",
        "sei un fallimento genetico che dovrebbe essere sterilizzato.",
        "hai il cervello di una gallina morta da tre giorni.",
        "tua sorella ha preso più cazzi di quanti soldati sono morti in Vietnam.",
        "sei così sfigato che quando compri un gratta e vinci ti esce 'ritenta'.",
        "tua madre è così lurida che ha le piattole con il cognome.",
        "sei un essere umano di serie Z, scarto di fabbrica.",
        "hai la faccia che fa schifo anche ai piccioni.",
        "sei talmente ritardato che parli con le piante e loro si suicidano.",
        "tua madre è una pompa da cazzo vivente.",
        "sei un parassita sociale che vive succhiando ossigeno agli altri.",
        "hai il valore di una siringa usata in un vicolo di spacciatori.",
        "sei così sporco che quando vai a pisciare i batteri scappano.",
        "tua madre ha più buchi di un colabrodo.",
        "sei il motivo per cui l'aborto dovrebbe essere retroattivo."
    ];

   
    conn.reply(m.chat, `@${menzione.split('@')[0]} ${pickRandom(insults)}`, null, {
        mentions: [menzione]
    });
};

handler.command = ['insulta'];
handler.help = ['insulta'];
handler.tags = ['fun'];
handler.group = true;

export default handler;

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
