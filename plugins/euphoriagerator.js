// Codice di euforiagenerator.js
// Forza il formato Maiuscolo/Minuscolo automatico (es. Abisso)

let handler = async (m, { conn, text, command, usedPrefix }) => {
  let testoInput = text || (m.text ? m.text.replace(new RegExp(`^${usedPrefix}${command}\\s*`, 'i'), '') : '');

  if (!testoInput.trim()) {
    return conn.reply(
      m.chat, 
      `❌ Inserisci il nome da generare!\n\n💡 *Esempio:*\n${usedPrefix + command} Abisso`, 
      m
    );
  }

  // Prende il testo, lo rende minuscolo e trasforma la prima lettera di ogni parola in Maiuscola
  let nomePulito = testoInput
    .trim()
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, m => m.toUpperCase());

  // Formattazione: Nome ᵋᵘᵠᵒʳᶦᵃ 
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