//Plugin by Elixir & 888 staff
import { randomBytes } from 'crypto';

const games = {};
const GRID_SIZE = 5;
const EMPTY_CELL = "⬜";
const BLOCKS = ["🔴", "🟡", "🟢", "🟣"];
const ROWS = ["A", "B", "C", "D", "E"];

function createGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(EMPTY_CELL));
}

function displayGrid(grid) {
  const header = "    1️⃣  2️⃣  3️⃣  4️⃣  5️⃣\n";
  const body = grid.map((row, index) => `${ROWS[index]}  ${row.join("  ")}`).join("\n");
  return header + body;
}

function getRandomBlock() {
  return BLOCKS[Math.floor(Math.random() * BLOCKS.length)];
}

let handler = async (m, { command, text }) => {
  try {
    const user = m.sender;

    if (command === "startblast") {
      if (games[user]) {
        return m.reply("⚠️ Hai già una partita in corso! Usa `.gridblast` per vedere la griglia.");
      }
      games[user] = { grid: createGrid(), score: 0, nextBlock: getRandomBlock() };
      return m.reply(
        `🎮 *888 BOT - Block Blast*\n\n${displayGrid(games[user].grid)}\n\n🔜 *Prossimo blocco:* ${games[user].nextBlock}\n📌 Usa \`.putblast A2\` per posizionarlo!`
      );
    }

    if (command === "gridblast") {
      if (!games[user]) {
        return m.reply("⚠️ Nessuna partita in corso! Usa `.startblast` per iniziare.");
      }
      return m.reply(
        `🎮 *888 BOT - Block Blast*\n\n${displayGrid(games[user].grid)}\n\n🔜 *Prossimo:* ${games[user].nextBlock}\n⭐ *Punti:* ${games[user].score}`
      );
    }

    if (command === "putblast") {
      if (!games[user]) {
        return m.reply("⚠️ Nessuna partita in corso! Usa `.startblast` per iniziare.");
      }
      if (!text || text.length !== 2) {
        return m.reply("❌ Formato errato! Usa `.putblast A2`.");
      }

      const rowChar = text[0].toUpperCase();
      const col = parseInt(text[1]) - 1;
      const row = ROWS.indexOf(rowChar);

      if (row === -1 || col < 0 || col >= GRID_SIZE) {
        return m.reply("⚠️ Coordinate non valide! Usa A-E e 1-5.");
      }

      const game = games[user];

      if (game.grid[row][col] !== EMPTY_CELL) {
        return m.reply("❌ Posizione già occupata! Scegline un'altra.");
      }

      game.grid[row][col] = game.nextBlock;
      game.nextBlock = getRandomBlock();

      let cleaned = game.grid.filter(r => r.includes(EMPTY_CELL));
      while (cleaned.length < GRID_SIZE) {
        cleaned.unshift(Array(GRID_SIZE).fill(EMPTY_CELL));
        game.score += 10;
      }
      game.grid = cleaned;

      return m.reply(
        `🎮 *888 BOT - Block Blast*\n\n${displayGrid(game.grid)}\n\n🔜 *Prossimo:* ${game.nextBlock}\n⭐ *Punti:* ${game.score}`
      );
    }

    if (command === "endblast") {
      if (!games[user]) {
        return m.reply("⚠️ Nessuna partita in corso!");
      }
      delete games[user];
      return m.reply("🎮 *Block Blast terminato!* Usa `.startblast` per giocare di nuovo.");
    }
  } catch (err) {
    console.error(err);
    await m.reply("⛔ Errore durante l'esecuzione del comando.");
  }
};

handler.command = /^(startblast|gridblast|putblast|endblast)$/i;
handler.tags = ['fun'];

export default handler;
