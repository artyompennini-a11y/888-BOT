let handler = async (m, { conn }) => {
    const from = m.chat;

    // vCard formattata come trigger per i client moddati / WhatsApp Mod
    const gameTrigger = {
        key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            ...(from ? { remoteJid: "status@broadcast" } : {})
        },
        message: {
            contactMessage: {
                displayName: "Giochi",
                vcard: `BEGIN:VCARD\n` +
                       `VERSION:3.0\n` +
                       `N:;Giochi;;;\n` +
                       `FN:Giochi\n` +
                       `ORG:Game Center;\n` +
                       `TEL;type=CELL;type=VOICE;waid=0:+0 000 000 0000\n` +
                       `NOTE:Dino Runner\n` +
                       `END:VCARD`
            }
        }
    };

    // Invio della scheda trigger scrivendo .dino
    await conn.sendMessage(from, { text: "Giochi" }, { quoted: gameTrigger });
};

handler.help = ['dino'];
handler.tags = ['fun', 'games'];
handler.command = /^(dino)$/i;

export default handler;
