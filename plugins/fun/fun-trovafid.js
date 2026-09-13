let handler = async (m, { conn, command, groupMetadata }) => {
    if (command === 'trovafid') {

        let toM = a => '@' + a.split('@')[0];

        let ps = groupMetadata.participants.map(v => v.id);

        if (ps.length < 2) {
            return m.reply(
`╭━━━〔 ❌ *IMPOSSIBILE* 〕━━━┈
┃ Non ci sono abbastanza
┃ partecipanti nel gruppo
┃ per creare una coppia.
╰━━━━━━━━━━━━━━━━━━┈`
            );
        }

        let a = ps[Math.floor(Math.random() * ps.length)];

        let b;
        do {
            b = ps[Math.floor(Math.random() * ps.length)];
        } while (b === a);

        m.reply(
`╭━━━〔 ❤️ *COPPIA TROVATA 888* 〕━━━┈
┃ ${toM(a)} e ${toM(b)}
┃ ora risultano *fidanzati*.
┃━━━━━━━━━━━━━━━━━━
┃ 💘 Che l’amore abbia inizio.
╰━━━━━━━━━━━━━━━━━━┈`,
            null,
            {
                mentions: [a, b],
                contextInfo: {
                    mentionedJid: [a, b]
                }
            }
        );
    }
};

handler.help = ['𝐭𝐫𝐨𝐯𝐚𝐟𝐢𝐝'];
handler.tags = ['fun'];
handler.command = /^(trovafid)$/i;
handler.group = true;

export default handler;