import fetch from 'node-fetch';

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender] || { bank: 0, lastclaim: 0 };

  let fkontak = {
    key: {
      participants: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "Halo"
    },
    message: {
      contactMessage: {
        displayName: 'PAGHETTA 888',
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: "0@s.whatsapp.net"
  };

  let now = Date.now();
  let timePassed = now - user.lastclaim;

  // ⏳ COOLDOWN — 888
  if (timePassed < 24 * 60 * 60 * 1000) {
    let remaining = 24 * 60 * 60 * 1000 - timePassed;
    let t = msToTime(remaining);

    return conn.reply(
      m.chat,
      `
⏳ *Attesa necessaria*
Puoi reclamare di nuovo tra:
*${t}*

Sistema Paghetta 888
`.trim(),
      fkontak
    );
  }

  // 💸 ACCREDITO — 888
  let amount = 1000;
  user.bank += amount;
  user.lastclaim = now;

  return conn.reply(
    m.chat,
    `
💸 *Paghetta ricevuta*
Hai guadagnato *${amount} 888COIN*.
Sono stati depositati direttamente in banca.

🏦 Saldo banca: *${user.bank} 888COIN*
`.trim(),
    fkontak
  );
}

function msToTime(ms) {
  let h = Math.floor((ms / (1000 * 60 * 60)) % 24);
  let m = Math.floor((ms / (1000 * 60)) % 60);
  let s = Math.floor((ms / 1000) % 60);

  if (h < 10) h = "0" + h;
  if (m < 10) m = "0" + m;
  if (s < 10) s = "0" + s;

  return `${h} ore ${m} minuti ${s} secondi`;
}

handler.command = /^(paghetta)$/i;
handler.tags = ['RPG'];
handler.group = true;

export default handler;