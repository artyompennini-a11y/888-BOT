let handler = async (m, { conn, text, usedPrefix, command }) => {
  let chat = global.db.data.chats[m.chat];

  // ───────────────────────────────
  // 🔥 MENU USO — STILE 888
  // ───────────────────────────────
  if (!text) {
    return m.reply(
`╭━━━〔 ⚙️ *SET WELCOME 888* 〕━━━┈
┃ 📌 *Variabili disponibili:*
┃ • @user — Menziona l’utente
┃ • @group — Nome del gruppo
┃ • @count — Numero membri
┃ • @desc — Descrizione gruppo
┃━━━━━━━━━━━━━━━━━━
┃ 📌 *Esempio:*
┃ ${usedPrefix}${command} Benvenuto @user nel gruppo @group!
┃━━━━━━━━━━━━━━━━━━
┃ 🔄 *Reset:*
┃ ${usedPrefix}${command} reset
┃━━━━━━━━━━━━━━━━━━
┃ 📜 *Messaggio attuale:*
┃ ${chat.sWelcome || '@user ha entrato nel gruppo (predefinito)'}
╰━━━━━━━━━━━━━━━━━━┈`
    );
  }

  // ───────────────────────────────
  // 🔥 RESET — STILE 888
  // ───────────────────────────────
  if (text.toLowerCase() === 'reset') {
    delete chat.sWelcome;
    return m.reply(
`╭━━━〔 🔄 *WELCOME RESETTATO* 〕━━━┈
┃ Il messaggio di benvenuto
┃ è stato ripristinato.
┃━━━━━━━━━━━━━━━━━━
┃ 📜 *Predefinito:*
┃ @user ha entrato nel gruppo
┃━━━━━━━━━━━━━━━━━━
┃ 🔧 Usa ${usedPrefix}simula benvenuto
┃    per testarlo.
╰━━━━━━━━━━━━━━━━━━┈`
    );
  }

  // ───────────────────────────────
  // 🔥 SETTAGGIO — STILE 888
  // ───────────────────────────────
  chat.sWelcome = text;

  m.reply(
`╭━━━〔 ✅ *WELCOME AGGIORNATO* 〕━━━┈
┃ Il nuovo messaggio è stato
┃ salvato correttamente.
┃━━━━━━━━━━━━━━━━━━
┃ 📜 *Nuovo messaggio:*
┃ ${text}
┃━━━━━━━━━━━━━━━━━━
┃ 🔧 Usa ${usedPrefix}simula benvenuto
┃ 🔄 Usa ${usedPrefix}${command} reset
╰━━━━━━━━━━━━━━━━━━┈`
  );
};

handler.help = ['𝐬𝐞𝐭𝐰𝐞𝐥𝐜𝐨𝐦𝐞'];
handler.tags = ['admin'];
handler.command = /^setwelcome|setbenvenuto$/i;
handler.admin = true;
handler.mods = true;
handler.group = true;

export default handler;