// Codice di euforiagenerator.js
// Genera SOLO ed esclusivamente la scritta ᵋᵘᵠᵒʳᶦᵃ

let handler = async (m, { conn }) => {
  // Risposta singola e pulita senza alcun controllo sul testo
  return await conn.reply(m.chat, `ᵋᵘᵠᵒʳᶦᵃ`, m);
};

handler.help = ['euphoria'];
handler.tags = ['euphoria', 'tools'];
handler.command = ['euphoria'];

export default handler;