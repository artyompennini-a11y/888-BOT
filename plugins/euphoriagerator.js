let handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) {
    return conn.reply(
      m.chat, 
      `❌ Inserisci il nome da generare!\n\n💡 *Esempio:*\n${usedPrefix + command} Abisso`, 
      m
    );
  }

  // Forza tutto in minuscolo
  let nomePulito = text.trim().toLowerCase();

  // Formattazione pulita: nome ᵋᵘᵠᵒʳᶦᵃ 
  let risultato = `${nomePulito} ᵋᵘᵠᵒʳᶦᵃ`;

  await conn.reply(
    m.chat, 
    `✨ *Nome Membro ᵋᵘᵠᵒʳᶦᵃ generato con successo!*`, 
    m
  );

  return await conn.reply(m.chat, `${risultato}`, m);
};