// Codice di euforiagenerator.js
// Generazione pulita con rispetto del maiuscolo/minuscolo originale

let handler = async (m, { conn, text, command, usedPrefix }) => {
  // Prende il testo grezzo inviato dall'utente e rimuove il comando iniziale (es. .euphoria)
  let testoOriginale = m.text ? m.text.replace(new RegExp(`^${usedPrefix}${command}\\s*`, 'i'), '') : '';

  if (!testoOriginale.trim()) {
    return conn.reply(
      m.chat, 
      `❌ Inserisci il nome da generare!\n\n💡 *Esempio:*\n${usedPrefix + command} Abisso`, 
      m
    );
  }

  // Mantiene l'esatta combinazione di maiuscole e minuscole scritte dall'utente
  let nomePulito = testoOriginale.trim();

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