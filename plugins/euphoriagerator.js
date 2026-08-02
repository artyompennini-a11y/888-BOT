// Codice di euforiagenerator.js
// Generazione pulita del nome Membro senza simboli speciali

let handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) {
    return conn.reply(
      m.chat, 
      `❌ Inserisci il nome da generare!\n\n💡 *Esempio:*\n${usedPrefix + command} Abisso`, 
      m
    );
  }

  // Rimuove solo gli spazi vuoti inutili all'inizio e alla fine, mantenendo il maiuscolo/minuscolo originale
  let nomePulito = text.trim();

  // Formattazione pulita: NOME ᵋᵘᵠᵒʳᶦᵃ 
  let risultato = `${nomePulito} ᵋᵘᵠᵒʳᶦᵃ`;

  await conn.reply(
    m.chat, 
    `✨ *Nome Membro ᵋᵘᵠᵒʳᶦᵃ generato con successo!*`, 
    m
  );

  // Invia il risultato finale
  return await conn.reply(m.chat, `${risultato}`, m);
};

handler.help = ['euphoria <nome>'];
handler.tags = ['euphoria', 'tools'];
handler.command = ['euphoria'];

export default handler;