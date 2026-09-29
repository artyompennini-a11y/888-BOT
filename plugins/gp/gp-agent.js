let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        if (!text) return m.reply(`🤖 Ciao! Sono l'agente autonomo avanzato di 888-BOT.\nChiedimi qualcosa, ad esempio:\n_usedPrefix{command} generami un report di vendita_`);

        await conn.sendPresenceUpdate('composing', m.chat);

        const aiRichAgent = conn.createAIRich({
            temperature: 0.6,
            model: 'gpt-4-turbo-rich',
            systemPrompt: "Sei l'assistente virtuale autonomo di 888-BOT. Rispondi strutturando le risposte in modo pulito ed elegante.",
        });

        const responseBuilder = await aiRichAgent.sender(m.chat, {
            build: () => {
                return {
                    text: text,
                    processedAt: new Date().toISOString(),
                };
            }
        }, {
            quoted: m
        });

        if (!responseBuilder) {
            m.reply("🤖 Elaborazione completata dall'agente autonomo (nessun output restituito dal builder).");
        }

    } catch (error) {
        let errorMessage = `❌ *CRASH DI SISTEMA INTERCETTATO*\n\n` +
                           `*Comando lanciato:* \`${usedPrefix}${command}\`\n` +
                           `*Messaggio di Errore:* \`${error.message || error}\`\n\n` +
                           `*Stack Trace (Dettagli tecnici):*\n\`\`\`${error.stack || 'Nessuno stack trace disponibile'}\`\`\``;
        
        await conn.sendMessage(m.chat, { text: errorMessage }, { quoted: m });
    }
};

handler.help = ['ai <rich-prompt>', '888ai <prompt>'];
handler.tags = ['ai'];
handler.command = /^(ai|888ai|agent)\$/i;

export default handler;