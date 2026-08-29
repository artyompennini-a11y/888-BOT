// Plugin by The Punisher, elixir & 888 staff

let bombaInCorso = {};

const playAgainButtons = () => [{
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({ display_text: 'Innesca un\'altra!', id: '.bomba' })
}];

let handler = async (m, { conn, command }) => {
    let chat = m.chat;

    if (command === 'bomba') {
        if (bombaInCorso[chat]) return m.reply('⚠️ *C\'è già una bomba innescata in questa chat! Scappa!* 🏃‍♂️');

        const cooldownKey = `bomba_${chat}`;
        const lastGame = global.cooldowns?.[cooldownKey] || 0;
        const now = Date.now();
        if (now - lastGame < 5000) return m.reply('⏳ *Attendi un attimo prima di innescare una nuova bomba!*');

        global.cooldowns = global.cooldowns || {};
        global.cooldowns[cooldownKey] = now;

        let durata = Math.floor(Math.random() * (35 - 15 + 1)) + 15; 
        let scadenza = Date.now() + (durata * 1000);

        bombaInCorso[chat] = {
            vittima: m.sender,
            passaggi: [],
            scadenza: scadenza,
            timer: setTimeout(() => esplosione(chat, conn), durata * 1000)
        };

        let pName = `@${m.sender.split('@')[0]}`;
        let startCaption = `
💣 ⚡ *GIOCO DELLA BOMBA v2.0* ⚡ 💣
══════════════════════════
👤 *Portatore attuale:* ${pName}
⏳ *Tempo prima del BOOM:* ${durata} secondi
🧨 *Azione:* Scrivi *.passa @utente* o rispondi *.passa* a un messaggio
══════════════════════════
⚠️ *Il bot non accetta la bomba!*
`.trim();

        return conn.sendMessage(chat, { text: startCaption, mentions: [m.sender] }, { quoted: m });
    }
};

handler.before = async function (m, { conn }) {
    let chat = m.chat;
    if (!bombaInCorso[chat] || !m.text) return;

    let b = bombaInCorso[chat];
    let testo = m.text.toLowerCase().trim();

    if (!testo.startsWith('.passa')) return;
    if (m.sender !== b.vittima) return; 

    let target = null;

    if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0];
    } else if (m.quoted) {
        target = m.quoted.sender || m.quoted.participant || (m.quoted.vM && m.quoted.vM.sender);
    }

    if (!target || target === m.sender) return; 

    let botJid = conn.user?.jid ? conn.user.jid.split(':')[0] : (conn.user?.id ? conn.user.id.split(':')[0] : '');
    if (botJid && target.includes(botJid)) return m.reply('❌ *Il bot non può ricevere la bomba!*');

    let tempoRimanenteMs = b.scadenza - Date.now();
    if (tempoRimanenteMs <= 500) return;

    clearTimeout(b.timer);

    let secondiRimanenti = Math.ceil(tempoRimanenteMs / 1000);

    if (!b.passaggi.includes(m.sender)) b.passaggi.push(m.sender);

    b.vittima = target;
    let pName = `@${target.split('@')[0]}`;

    let conferma = `
🚨 💣 *BOMBA TRASFERITA!* 💣 🚨
══════════════════════════
👉 *La bomba è passata a:* ${pName}
⏳ *Tempo rimanente:* ${secondiRimanenti} secondi!
⏰ *Sbrigati a passarla prima che esploda!*
══════════════════════════
`.trim();

    b.timer = setTimeout(() => esplosione(chat, conn), tempoRimanenteMs);

    await conn.sendMessage(chat, { text: conferma, mentions: [target] }, { quoted: m });
    return true; 
};

async function esplosione(chatId, conn) {
    let b = bombaInCorso[chatId];
    if (!b) return;

    let vTag = `@${b.vittima.split('@')[0]}`;
    if (!global.db) global.db = { data: { users: {} } };
    if (!global.db.data) global.db.data = { users: {} };
    if (!global.db.data.users) global.db.data.users = {};

    let penale = 15;
    if (!global.db.data.users[b.vittima]) global.db.data.users[b.vittima] = { money: 0 };
    let saldoVittima = global.db.data.users[b.vittima].money || 0;
    global.db.data.users[b.vittima].money = Math.max(0, saldoVittima - penale);

    let finale = `
💥 ☠️ *BOOM! ESPLOSIONE!* ☠️ 💥
══════════════════════════
💀 *La bomba è scoppiata nelle mani di:* ${vTag}
💸 *Penalità subita:* -${penale}€
══════════════════════════\n`.trim();

    if (b.passaggi.length > 0) {
        finale += `\n🏆 *SOPRAVVISSUTI PREMIATI:*\n`;
        let premiati = [...new Set(b.passaggi)];
        for (let jid of premiati) {
            if (jid === b.vittima) continue;
            let premio = Math.floor(Math.random() * 20) + 10;

            if (!global.db.data.users[jid]) global.db.data.users[jid] = { money: 0 };
            global.db.data.users[jid].money = (global.db.data.users[jid].money || 0) + premio;

            finale += `• @${jid.split('@')[0]} 💰 +${premio}€\n`;
        }
    }

    let mentionList = [b.vittima, ...b.passaggi];

    await conn.sendMessage(chatId, { 
        text: finale, 
        mentions: mentionList,
        interactiveButtons: playAgainButtons()
    });

    delete bombaInCorso[chatId];
}

handler.help = ['bomba'];
handler.tags = ['giochi'];
handler.command = /^(bomba)$/i;
handler.group = true;
handler.register = false;

export default handler;
