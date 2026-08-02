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

  // Formattazione pulita: NOME ᵋᵘᵠᵒʳᶦᵃ ᵐᵇʳ
  let risultato = `${nomePulito} ᵋᵘᵠᵒʳᶦᵃ ᵐᵇʳ`;

  await conn.reply(
    m.chat, 
    `✨ *Nome Membro ᵋᵘᵠᵒʳᶦᵃ generato con successo!*`, 
    m
  );
  
  // Invia il risultato finale
  return await conn.reply(m.chat, `${risultato}`, m);
};

handler.help = ['euphmbr <nome>'];
handler.tags = ['euphoria', 'tools'];
handler.command = ['euphmbr'];

export default handler;