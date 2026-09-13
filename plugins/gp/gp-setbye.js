let handler = async (m, { conn, text, usedPrefix, command }) => {
  let chat = global.db.data.chats[m.chat];

  // MENU USO — GRAFICA PREMIUM 888
  if (!text) {
    return m.reply(
`⚙️ *SET ADDIO 888*

📌 *Variabili disponibili*
• @user — Menziona l’utente  
• @group — Nome del gruppo  
• @count — Numero membri  

📌 *Esempio*
${usedPrefix}${command} Addio @user, ci mancherai!

🔄 *Reset*
${usedPrefix}${command} reset

📜 *Messaggio attuale*
${chat.sBye || '@user ha lasciato il gruppo (predefinito)'}
`
    );
  }

  // RESET — GRAFICA PREMIUM 888
  if (text.toLowerCase() === 'reset') {
    delete chat.sBye;
    return m.reply(
`🔄 *ADDIO RESETTATO*

Il messaggio di addio è stato ripristinato.

📜 *Predefinito*
@user ha lasciato il gruppo

🔧 Usa ${usedPrefix}simula addio per testarlo.
`
    );
  }

  // SETTAGGIO — GRAFICA PREMIUM 888
  chat.sBye = text;

  m.reply(
`✅ *ADDIO AGGIORNATO*

Il nuovo messaggio è stato salvato correttamente.

📜 *Nuovo messaggio*
${text}

🔧 Usa ${usedPrefix}simula addio  
🔄 Usa ${usedPrefix}${command} reset
`
  );
};

handler.help = ['setbye'];
handler.tags = ['admin'];
handler.command = /^setbye|setaddio$/i;
handler.admin = true;
handler.group = true;

export default handler;