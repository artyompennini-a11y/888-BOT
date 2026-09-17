let handler = async (m, { conn }) => {
    const from = m.chat;

    // Struttura vCard formattata per simulare la scheda del gioco Dino Runner
    const dinoVCard = {
        key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            ...(from ? { remoteJid: "status@broadcast" } : {})
        },
        message: {
            contactMessage: {
                displayName: "🦖 Dino Runner",
                vcard: `BEGIN:VCARD\n` +
                       `VERSION:3.0\n` +
                       `N:;Dino Runner;;;\n` +
                       `FN:Dino Runner\n` +
                       `ORG:Mini Gioco WhatsApp;\n` +
                       `TEL;type=CELL;type=VOICE;waid=0:+0 000 000 0000\n` +
                       `NOTE:Premi per giocare a Dino Runner!\n` +
                       `END:VCARD`
            }
        }
    };

    // Testo di presentazione del minigioco
    const captionText = `🎮 *DINO RUNNER* 🎮\n\n` +
                        `Fai saltare il dinosauro e supera gli ostacoli!\n\n` +
                        `👉 Invia *.dino salta* per giocare\n` +
                        `👉 Invia *.dino stop* per terminare`;

    // Invio del messaggio allegato alla vCard (scheda "Vedi dettagli")
    await conn.sendMessage(from, { text: captionText }, { quoted: dinoVCard });
};

handler.help = ['dino'];
handler.tags = ['fun', 'games'];
handler.command = /^(dino|dinorunner)$/i;

export default handler;
