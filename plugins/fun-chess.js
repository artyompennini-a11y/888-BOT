//Plugin by Elixir & 888 staff
import { Chess } from 'chess.js';

let handler = async (m, { conn, usedPrefix, command, text }) => {
  try {
    conn.game = conn.game || {};

    if (Object.values(conn.game).find(room => room.id && room.id.startsWith('chess') && [room.game?.white, room.game?.black].includes(m.sender))) {
      return m.reply('⚠️ Stai già giocando una partita di scacchi!');
    }

    if (!text) {
      return m.reply(`Uso: ${usedPrefix + command} <nome_partita>\n\nEsempio: ${usedPrefix + command} sfida1`);
    }

    let room = Object.values(conn.game).find(room => room.state === 'WAITING' && room.name === text);

    if (room) {
      await m.reply('♟️ Un giocatore si è unito! Partita iniziata!');
      room.black = m.chat;
      room.game.black = m.sender;
      room.state = 'PLAYING';

      let str = [
        `♟️ *888 BOT - SCACCHI* ♟️`,
        `━`.repeat(18),
        `⚪ Bianco: @${room.game.white.split('@')[0]}`,
        `⚫ Nero: @${room.game.black.split('@')[0]}`,
        `━`.repeat(18),
        `🎯 Mossa: ${room.game.turn() === 'w' ? '⚪ Bianco' : '⚫ Nero'}`,
        `━`.repeat(18),
        `📌 ${usedPrefix}mossa [mossa] per giocare`,
        `🚪 ${usedPrefix}esci per abbandonare`
      ].join('\n');

      await conn.sendMessage(room.white, { text: str, mentions: conn.parseMention(str) }, { quoted: m });
      await conn.sendMessage(room.black, { text: str, mentions: conn.parseMention(str) }, { quoted: m });

    } else {
      room = {
        id: 'chess-' + Date.now(),
        white: m.chat,
        black: '',
        game: new Chess(),
        state: 'WAITING',
        name: text
      };

      conn.reply(m.chat, [
        `♟️ *888 BOT - SCACCHI* ♟️`,
        `━`.repeat(18),
        `⌛ In attesa di un avversario...`,
        `━`.repeat(18),
        `🎯 ${usedPrefix}entra ${text} per partecipare`,
        `🚪 ${usedPrefix}esci per abbandonare`
      ].join('\n'), null, m);

      conn.game[room.id] = room;
    }
  } catch (err) {
    console.error(err);
    await m.reply('⛔ Errore durante la creazione della partita.');
  }
};

handler.command = /^(scacchi|chess)$/i;
handler.tags = ['fun'];

export default handler;
