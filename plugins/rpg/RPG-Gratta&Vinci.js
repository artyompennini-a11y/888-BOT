//Plugin by punisher, elixir & 888 staff

const COOLDOWN = 2 * 60 * 1000; // 2 minuti

let handler = async (m, { conn }) => {
  const users = global.db.data.users;
  if (!users[m.sender]) users[m.sender] = { money: 0, bank: 0, lastGratta: 0 };

  const user = users[m.sender];
  const now = Date.now();
  const timePassed = now - (user.lastGratta || 0);

  // COOLDOWN — Grafica Premium 888
  if (timePassed < COOLDOWN) {
    const remaining = msToTime(COOLDOWN - timePassed);
    return conn.sendMessage(m.chat, {
      text: `⏳ *COOLDOWN 888*\nDevi attendere *${remaining}* prima di grattare di nuovo.`
    }, { quoted: m });
  }

  // SOLDI INSUFFICIENTI — Grafica Premium 888
  if (user.money < 500) {
    return conn.sendMessage(m.chat, {
      text: `❌ *FONDI INSUFFICIENTI*\nServono *500 888COIN* per acquistare un Gratta & Vinci.`
    }, { quoted: m });
  }

  user.money -= 500;
  user.lastGratta = now;

  const simboli = ["💎", "💰", "🍀", "🔥", "💣", "🩸"];
  const griglia = [
    simboli[Math.floor(Math.random() * simboli.length)],
    simboli[Math.floor(Math.random() * simboli.length)],
    simboli[Math.floor(Math.random() * simboli.length)]
  ];

  let premio = 0;
  let risultato = "";
  const chance = Math.random() * 100;

  // JACKPOT — Grafica Premium 888
  if (chance < 1) {
    griglia[0] = griglia[1] = griglia[2] = "🩸";
    premio = 15000;
    risultato = `🎉 *JACKPOT 888!*\nHai vinto *15000 888COIN*!`;
    user.money += premio;
  }

  // BOMBA — Grafica Premium 888
  else if (griglia.includes("💣")) {
    risultato = `💥 *BOMBA!*\nHai perso *2000 888COIN*!`;
    user.bank = Math.max(0, user.bank - 2000);
  }

  // TRIPLA — Grafica Premium 888
  else if (griglia[0] === griglia[1] && griglia[1] === griglia[2]) {
    premio = 2000;
    risultato = `✨ *TRIPLA COMBINAZIONE!*\nHai vinto *2000 888COIN*!`;
    user.money += premio;
  }

  // NESSUNA VINCITA — Grafica Premium 888
  else {
    risultato = `❌ *NESSUNA VINCITA*`;
  }

  const messaggio = `
🎟️ *GRATTA & VINCI 888*

${griglia[0]} │ ${griglia[1]} │ ${griglia[2]}

🎟️ Costo: 500 888COIN  
🧾 Risultato: ${risultato}  
💵 Contanti: ${user.money} 888COIN  
🏦 Banca: ${user.bank} 888COIN  
`.trim();

  conn.sendMessage(m.chat, { text: messaggio }, { quoted: m });
};

handler.command = /^gratta$/i;
handler.tags = ['rpg','fun'];
handler.help = ['gratta'];

export default handler;

function msToTime(duration) {
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let seconds = Math.floor((duration / 1000) % 60);

  return `${minutes.toString().padStart(2,"0")}m ${seconds.toString().padStart(2,"0")}s`;
}