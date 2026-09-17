let handler = async (m, { conn }) => {
    const from = m.chat;

    // Definizione della vCard per il gioco
    const vcard = `BEGIN:VCARD\n` +
                  `VERSION:3.0\n` +
                  `N:;Giochi;;;\n` +
                  `FN:Giochi\n` +
                  `ORG:Dino Runner;\n` +
                  `TEL;type=CELL;type=VOICE;waid=0:+0 000 000 0000\n` +
                  `NOTE:Dino Runner\n` +
                  `END:VCARD`;

    // Invio diretto del messaggio di tipo contatto
    await conn.sendMessage(from, {
        contacts: {
            displayName: 'Giochi',
            contacts: [{ vcard }]
        }
    }, { quoted: m });
};

handler.help = ['dino'];
handler.tags = ['fun', 'games'];
handler.command = /^(dino)$/i;

export default handler;
