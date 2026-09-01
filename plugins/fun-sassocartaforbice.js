let handler = async (m, { conn, text, command, usedPrefix, args }) => {
  let users = global.db.data.users[m.sender];
  let opzioni = ["sasso", "carta", "forbice"];

  let sceltaUtente = args[0]?.toLowerCase();

  // ───────────────────────────────
  // 🔥 SCELTA NON VALIDA — 888
  // ───────────────────────────────
  if (!sceltaUtente || !opzioni.includes(sceltaUtente)) {
    return await conn.reply(
      m.chat,
`╭━━━〔 ⚠️ *SCELTA NON VALIDA* 〕━━━┈
┃ Usa: ${usedPrefix}scf sasso 150
┃━━━━━━━━━━━━━━━━━━
┃ Opzioni disponibili:
┃ ➜ *sasso*, *carta*, *forbice*
╰━━━━━━━━━━━━━━━━━━┈`,
      m
    );
  }

  let scommessa = parseInt(args[1]);

  // ───────────────────────────────
  // 🔥 IMPORTO NON VALIDO — 888
  // ───────────────────────────────
  if (isNaN(scommessa) || scommessa <= 0) {
    return await conn.reply(
      m.chat,
`╭━━━〔 ⚠️ *IMPORTO NON VALIDO* 〕━━━┈
┃ Esempio:
┃ ➜ ${usedPrefix}scf sasso 150
╰━━━━━━━━━━━━━━━━━━┈`,
      m
    );
  }

  // ───────────────────────────────
  // 🔥 SOLDI INSUFFICIENTI — 888
  // ───────────────────────────────
  if (scommessa > users.money) {
    throw `╭━━━〔 ❌ *FONDI INSUFFICIENTI* 〕━━━┈
┃ Ti mancano *${scommessa - users.money}€*
┃ per effettuare questa scommessa.
╰━━━━━━━━━━━━━━━━━━┈`;
  }

  // ───────────────────────────────
  // 🔥 LOGICA DEL GIOCO — 888
  // ───────────────────────────────
  let sceltaBot = opzioni[Math.floor(Math.random() * opzioni.length)];
  let risultato;

  // ───────────────────────────────
  // 🔥 PAREGGIO — 888
  // ───────────────────────────────
  if (sceltaUtente === sceltaBot) {
    risultato =
`╭━━━〔 ⚖️ *PAREGGIO* 〕━━━┈
┃ Scelta del bot: *${sceltaBot}*
┃ Nessuna scommessa aggiornata.
╰━━━━━━━━━━━━━━━━━━┈`;
  }

  // ───────────────────────────────
  // 🔥 VITTORIA — 888
  // ───────────────────────────────
  else if (
    (sceltaUtente === "sasso" && sceltaBot === "forbice") ||
    (sceltaUtente === "carta" && sceltaBot === "sasso") ||
    (sceltaUtente === "forbice" && sceltaBot === "carta")
  ) {
    let vincita = scommessa * 2;
    users.money += vincita;

    risultato =
`╭━━━〔 🎉 *HAI VINTO!* 〕━━━┈
┃ Scelta del bot: *${sceltaBot}*
┃━━━━━━━━━━━━━━━━━━
┃ 💰 Vincita: *${vincita}€*
┃ 💼 Saldo attuale: *${users.money}€*
╰━━━━━━━━━━━━━━━━━━┈`;
  }

  // ───────────────────────────────
  // 🔥 SCONFITTA — 888
  // ───────────────────────────────
  else {
    users.money -= scommessa;

    risultato =
`╭━━━〔 ❌ *HAI PERSO* 〕━━━┈
┃ Scelta del bot: *${sceltaBot}*
┃━━━━━━━━━━━━━━━━━━
┃ 💸 Perdita: *${scommessa}€*
┃ 💼 Saldo attuale: *${users.money}€*
╰━━━━━━━━━━━━━━━━━━┈`;
  }

  return m.reply(risultato);
};

handler.command = /^(scf)$/i;
handler.help = ['𝐬𝐜𝐟'];
handler.tags = ['fun'];

export default handler;