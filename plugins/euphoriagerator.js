let handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) {
    return conn.reply(
      m.chat, 
      `❌ Inserisci il nome da generare!\n\n💡 *Esempio:*\n${usedPrefix + command} Abisso`, 
      m
    );
  }

  // Stampiamo sulla console del server cosa riceve il bot
  console.log('--- DEBUG EUPHORIA ---');
  console.log('1. Testo originale ricevuto:', JSON.stringify(text));

  let nomePulito = text.trim().toLowerCase();
  console.log('2. Testo dopo toLowerCase():', JSON.stringify(nomePulito));

  let risultato = `${nomePulito} ᵋᵘᵠᵒʳᶦᵃ`;
  console.log('3. Risultato finale:', JSON.stringify(risultato));
  console.log('----------------------');

  await conn.reply(m.chat, `✨ *Nome Membro ᵋᵘᵠᵒʳᶦᵃ generato con successo!*`, m);
  return await conn.reply(m.chat, `${risultato}`, m);
};

handler.help = ['euphoria <nome>'];
handler.tags = ['euphoria', 'tools'];
handler.command = ['euphoria'];

export default handler;