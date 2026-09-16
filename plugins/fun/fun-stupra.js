//Plugin by Elixir, Punisher & 888 staff

let handler = async (m, { conn, usedPrefix, command, text }) => {
    let who;

    if (m.isGroup) {
        who = m.mentionedJid[0] 
            ? m.mentionedJid[0] 
            : m.quoted ? m.quoted.sender 
            : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' 
            : false;
    } else {
        who = text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.chat;
    }

    if (!who) return m.reply(`𝐦𝐞𝐧𝐳𝐢𝐨𝐧𝐚 𝐥𝐚 𝐩𝐞𝐫𝐬𝐨𝐧𝐚 𝐝𝐚 𝐬𝐭𝐮𝐩𝐫𝐚𝐫𝐞`);


    const thumbnailUrl = "https://files.catbox.moe/eu24ui.png"; // URL dell'immagine in miniatura
    const thumbnailBuffer = await (await fetch(thumbnailUrl)).buffer();
    const thumbnailText = "𝐒𝐓𝐔𝐏𝐑𝐀"; // Testo miniatura compatibile

    let abrazo = await conn.sendMessage(m.chat, {
        text: `━━━━━━━━━━━━━
@${who.split('@')[0]} *sei stata stuprata come una troia di merda da* @${m.sender.split('@')[0]} *e ti ha fatto urlare che ne volevi di più* " 𝐀𝐡𝐡𝐡.., 𝐀𝐚𝐚𝐚𝐡𝐡, 𝐬𝐢 𝐜𝐨𝐧𝐭𝐢𝐧𝐮𝐚, 𝐧𝐨𝐧 𝐟𝐞𝐫𝐦𝐚𝐫𝐭𝐢, 𝐧𝐨𝐧 𝐟𝐞𝐫𝐦𝐚𝐫𝐭𝐢 " *ti ha lasciata così piena di sborra che manco ti reggi in piedi puttana di merda*.
━━━━━━━━━━━━━`,
        mentions: [who, m.sender],
    }, {
        quoted: {
            key: {
                participants: "0@s.whatsapp.net",
                fromMe: false,
                id: "Halo",
            },
            message: {
                locationMessage: {
                    name: thumbnailText, // Scritta in miniatura compatibile
                    jpegThumbnail: thumbnailBuffer, // Immagine in miniatura
                },
            },
            participant: "0@s.whatsapp.net",
        },
    });

    conn.sendMessage(m.chat, { react: { text: '', key: abrazo.key } });
};

handler.command = ['stupra'];
handler.help = ['stupra @𝐭𝐚𝐠'];
handler.tags = ['fun'];

export default handler;