// Codice di euforiagenerator.js
// Generazione pulita del nome Membro senza simboli speciali

let handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) {
    return conn.reply(
      m.chat, 
      `❌ Inserisci il nome da generare!\n\n💡 *Esempio:*\n${usedPrefix + command} abisso`, 
      m
    );
  }

  // Pulisce il testo inserito dall'utente e lo converte in maiuscolo
  let nomePulito = text.trim().toUpperCase();

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