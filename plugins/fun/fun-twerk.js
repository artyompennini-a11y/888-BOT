import { performance } from "perf_hooks";

let handler = async (m, { conn, text }) => {

    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;

    if (!who) return m.reply("Chi deve twerkare? Tagga qualcuno o rispondi a un suo messaggio!\nEsempio: *.twerk @utente*");

    const messaggi = [
        `💃 @${who.split`@`[0]} inizia a scaldarsi per twerkare...`,
        `🍑 Preparati per lo spettacolo!`,
        `🔥 Sta iniziando a muovere il sedere...`,
        `🎶 Il ritmo si fa più incalzante!`,
        `💫 Shake it, baby!`,
        `✨ Il twerk si fa sempre più intenso!`,
        `🌟 Wow, che movimenti sensuali!`,
        `💥 Sta dando il massimo!`,
        `🚀 Il twerk è al suo apice!`,
        `🎉 Che spettacolo incredibile!`,
        `🏆 Twerk livello professionista!`,
        `✅ Performance completata con successo!`,
    ];

    let start = performance.now();

    for (let i = 0; i < messaggi.length; i++) {
        await conn.sendMessage(m.chat, { 
            text: messaggi[i], 
            mentions: [who] 
        }, { quoted: m });
        await new Promise(res => setTimeout(res, 600));
    }

    let end = performance.now();
    let durationSec = ((end - start) / 1000).toFixed(2);

    let finale = `💃 @${who.split`@`[0]} ha completato una sessione di twerk epica! 🍑\nDurata: *${durationSec} secondi* di pura energia!`;

    await conn.sendMessage(m.chat, { text: finale, mentions: [who] }, { quoted: m });
};

handler.help = ['twerk @utente'];
handler.tags = ['fun'];
handler.command = /^(twerk)$/i;

export default handler;
