let handler = async (m, { conn, usedPrefix, command, text }) => {
    let who;

    if (m.isGroup) {
        who = m.mentionedJid?.[0]
            ? m.mentionedJid[0]
            : m.quoted
            ? m.quoted.sender
            : text
            ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            : false;
    } else {
        who = text
            ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            : m.chat;
    }

    if (!who)
        return m.reply(
`❌ Nessun target.
Menziona qualcuno da colpire.`
        );

    const thumbnailUrl = "https://cdn.phototourl.com/free/2026-05-07-6bcb47a5-00d2-485b-9507-47b4536e15c5.jpg";
    const thumbnailBuffer = await (await fetch(thumbnailUrl)).buffer();

    let msg = await conn.sendMessage(
        m.chat,
        {
            text:
`🔫 *AZIONE 888*
@${who.split('@')[0]} è stato colpito da @${m.sender.split('@')[0]}.
Mira pessima, intento chiarissimo.`,
            mentions: [who, m.sender],
        },
        {
            quoted: {
                key: {
                    participants: "0@s.whatsapp.net",
                    fromMe: false,
                    id: "SHOT888",
                },
                message: {
                    locationMessage: {
                        name: "SPARA",
                        jpegThumbnail: thumbnailBuffer,
                    },
                },
                participant: "0@s.whatsapp.net",
            },
        }
    );

    conn.sendMessage(m.chat, { react: { text: '', key: msg.key } });
};

handler.command = ['shot'];
handler.help = ['shot @tag'];
handler.tags = ['fun'];

export default handler;