const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const handler = async (m, { conn, isOwner }) => {
    const userId = m.sender;
    const groupId = m.chat;

    if (!isOwner) 
        return m.reply("❌ Solo il proprietario può usare questo comando.");

    try {
        const { key } = await conn.sendMessage(m.chat, {
            text: `🔄 *Riavvio in corso...*\n⏱️ Attendi qualche secondo.\n\n> 888 BOT restart`
        }, { quoted: m });

        await delay(1000);

        await conn.sendMessage(m.chat, {
            text: '🚀🚀🚀🚀',
            edit: key
        });

        await delay(1000);

        await conn.sendMessage(m.chat, {
            text: `⚙️ *Avvio procedura...*\n🔃 Caricamento moduli in corso.\n\n> 888 BOT restart`,
            edit: key
        });

        await delay(1000);

        await conn.sendMessage(m.chat, {
            text: `✅ *Riavvio completato!*\n🟢 Bot online a breve.\n\n> 888 BOT restart`,
            edit: key
        });

        await delay(1000);

        process.exit(42);

    } catch (error) {
        m.reply(`❌ Errore durante il riavvio: ${error.message}`);
    }
};

handler.help = ['riavvia', 'restart'];
handler.tags = ['owner'];
handler.command = /^(riavvia|restart)$/i;
handler.owner = true;

export default handler;