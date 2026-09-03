const COOLDOWN = 10 * 60 * 1000; // 10 minuti
const BLOCCO_ARRESTO = 20 * 60 * 1000; // 20 minuti

async function handler(m, { conn }) {
  const users = global.db.data.users;
  if (!users[m.sender]) users[m.sender] = { money: 0, bank: 0, lastRapina: 0, arrestatoFino: 0 };
  const user = users[m.sender];
  const now = Date.now();

  // ───────────────────────────────
  // 🔥 ARRESTO ATTIVO — 888
  // ───────────────────────────────
  if (user.arrestatoFino && now < user.arrestatoFino) {
    const remaining = msToTime(user.arrestatoFino - now);
    return conn.sendMessage(
      m.chat,
      {
        text:
`╭━━━〔 🚔 *SEI IN ARRESTO* 〕━━━┈
┃ Non puoi rapinare ora.
┃━━━━━━━━━━━━━━━━━━
┃ ⏳ Torna operativo tra:
┃ ➜ *${remaining}*
╰━━━━━━━━━━━━━━━━━━┈`
      },
      { quoted: m }
    );
  }

  // ───────────────────────────────
  // 🔥 COOLDOWN RAPINA — 888
  // ───────────────────────────────
  if (now - user.lastRapina < COOLDOWN) {
    const remaining = msToTime(COOLDOWN - (now - user.lastRapina));
    return conn.sendMessage(
      m.chat,
      {
        text:
`╭━━━〔 ⏳ *COOLDOWN RAPINA* 〕━━━┈
┃ Puoi rapinare ogni *10 minuti*.
┃━━━━━━━━━━━━━━━━━━
┃ Riprova tra:
┃ ➜ *${remaining}*
╰━━━━━━━━━━━━━━━━━━┈`
      },
      { quoted: m }
    );
  }

  user.lastRapina = now;

  const targets = [
    { nome: "🏪 𝐍𝐞𝐠𝐨𝐳𝐢𝐨", successo: 0.7, min: 500, max: 2000 },
    { nome: "🚛 𝐏𝐨𝐫𝐭𝐚𝐯𝐚𝐥𝐨𝐫𝐢", successo: 0.5, min: 2000, max: 5000 },
    { nome: "🏦 𝐁𝐚𝐧𝐜𝐚", successo: 0.3, min: 5000, max: 12000 }
  ];

  const target = targets[Math.floor(Math.random() * targets.length)];
  const esito = Math.random();

  // ───────────────────────────────
  // 🔥 RAPINA RIUSCITA — 888
  // ───────────────────────────────
  if (esito < target.successo) {
    const guadagno = Math.floor(Math.random() * (target.max - target.min + 1)) + target.min;
    user.money += guadagno;

    return conn.sendMessage(
      m.chat,
      {
        text:
`╭━━━〔 💣 *RAPINA RIUSCITA* 〕━━━┈
┃ 🎯 Obiettivo: ${target.nome}
┃━━━━━━━━━━━━━━━━━━
┃ 💰 Bottino ottenuto:
┃ ➜ *${guadagno} 888COIN*
┃━━━━━━━━━━━━━━━━━━
┃ 🔥 Sei scappato senza lasciare tracce!
╰━━━━━━━━━━━━━━━━━━┈`
      },
      { quoted: m }
    );
  }

  // ───────────────────────────────
  // 🔥 ARRESTO — 888
  // ───────────────────────────────
  if (esito > 0.9) {
    user.arrestatoFino = now + BLOCCO_ARRESTO;

    return conn.sendMessage(
      m.chat,
      {
        text:
`╭━━━〔 🚨 *ARRESTATO!* 〕━━━┈
┃ La polizia ti ha catturato
┃ durante la rapina a:
┃ ➜ ${target.nome}
┃━━━━━━━━━━━━━━━━━━
┃ ⛓️ Sarai in carcere per:
┃ ➜ *20 minuti*
╰━━━━━━━━━━━━━━━━━━┈`
      },
      { quoted: m }
    );
  }

  // ───────────────────────────────
  // 🔥 RAPINA FALLITA — 888
  // ───────────────────────────────
  const multa = Math.floor(user.bank * 0.3);
  user.bank = Math.max(0, user.bank - multa);

  return conn.sendMessage(
    m.chat,
    {
      text:
`╭━━━〔 🚔 *RAPINA FALLITA* 〕━━━┈
┃ 🎯 Obiettivo: ${target.nome}
┃━━━━━━━━━━━━━━━━━━
┃ 💸 Multa ricevuta:
┃ ➜ *${multa} 888COIN*
┃━━━━━━━━━━━━━━━━━━
┃ Pianifica meglio la prossima rapina…
╰━━━━━━━━━━━━━━━━━━┈`
    },
    { quoted: m }
  );
}

handler.command = /^rapina$/i;
handler.tags = ['rpg'];
handler.help = ['rapina'];

export default handler;

function msToTime(duration) {
  let minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((duration % (1000 * 60)) / 1000);
  return `${minutes}m ${seconds}s`;
}