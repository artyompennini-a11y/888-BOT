import fetch from 'node-fetch';

let handler = async (m, { isPrems, conn }) => {
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
        displayName: '𝐏𝚲𝐆𝐇𝚵𝐓𝐓𝚲 𝟴𝟴𝟴',
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: "0@s.whatsapp.net"
  };

  let currentTime = new Date();
  let timePassed = currentTime - user.lastclaim;

  // ───────────────────────────────
  // 🔥 COOLDOWN — 888
  // ───────────────────────────────
  if (timePassed < 24 * 60 * 60 * 1000) {
    let remainingTime = 24 * 60 * 60 * 1000 - timePassed;
    let remainingTimeString = msToTime(remainingTime);

    return await conn.reply(
      m.chat,
`╭━━━〔 ⏳ *ATTESA NECESSARIA* 〕━━━┈
┃ Puoi reclamare di nuovo tra:
┃ ➜ *${remainingTimeString}*
┃━━━━━━━━━━━━━━━━━━
┃ Sistema Paghetta 888
╰━━━━━━━━━━━━━━━━━━┈`,
      fkontak
    );
  }

  // ───────────────────────────────
  // 🔥 ACCREDITO — 888
  // ───────────────────────────────
  let moneyToAdd = 1000;
  user.bank += moneyToAdd;
  user.lastclaim = currentTime;

  let text =
`╭━━━〔 💸 *PAGHETTA RICEVUTA* 〕━━━┈
┃ Hai guadagnato *${moneyToAdd}€*
┃ e sono stati depositati
┃ direttamente in banca.
┃━━━━━━━━━━━━━━━━━━
┃ 🏦 Saldo banca: *${user.bank}€*
╰━━━━━━━━━━━━━━━━━━┈`;

  await conn.reply(m.chat, text, fkontak);
}

function msToTime(duration) {
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let seconds = Math.floor((duration / 1000) % 60);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return `${hours} 𝐨𝐫𝐞 ${minutes} 𝐦𝐢𝐧𝐮𝐭𝐢 ${seconds} 𝐬𝐞𝐜𝐨𝐧𝐝𝐢`;
}

handler.command = /^(paghetta)$/i;
handler.tags = ['RPG'];
handler.isBotAdmin = true;
handler.group = true;

export default handler;