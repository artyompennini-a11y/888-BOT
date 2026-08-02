// Codice di euforiagenerator.js
// Genera solo la stringa ᵋᵘᵠᵒʳᶦᵃ (accetta il comando con o senza testo dopo)

let handler = async (m, { conn, text }) => {
  // Output fisso
  let risultato = `ᵋᵘᵠᵒʳᶦᵃ`;

  await conn.reply(
    m.chat, 
    `✨ *Generato con successo!*`, 
    m
  );

  // Invia solo ed esclusivamente la stringa stilizzata
  return await conn.reply(m.chat, `${risultato}`, m);
};

handler.help = ['euphoria'];
handler.tags = ['euphoria', 'tools'];
handler.command = ['euphoria'];

export default handler;