// Codice di euforiagenerator.js
// Genera unicamente la stringa ᵋᵘᵠᵒʳᶦᵃ

let handler = async (m, { conn }) => {
  // Output fisso
  let risultato = `ᵋᵘᵠᵒʳᶦᵃ`;

  await conn.reply(
    m.chat, 
    `✨ *Generato con successo!*`, 
    m
  );

  // Invia solo la stringa stilizzata
  return await conn.reply(m.chat, `${risultato}`, m);
};

handler.help = ['euphoria'];
handler.tags = ['euphoria', 'tools'];
handler.command = ['euphoria'];

export default handler;