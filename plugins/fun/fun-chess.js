//Plugin by Elixir & 888 staff
import { Chess } from 'chess.js';

/* ============================================================
   SCACCHI — CREA O ENTRA IN UNA PARTITA
   ============================================================ */

let handler = async (m, { conn, usedPrefix, command, text }) => {
  try {
    conn.game = conn.game || {};

    // Controllo se il giocatore è già in una partita
    let already = Object.values(conn.game).find(room =>
      room.id.startsWith('chess') &&
      [room.whitePlayer, room.blackPlayer].includes(m.sender)
    );

    if (already) {
      return m.reply('⚠️ Stai già giocando una partita di scacchi!');
    }

    if (!text) {
      return m.reply(`Uso corretto:\n${usedPrefix + command} <nome_partita>\n\nEsempio:\n${usedPrefix + command} sfida1`);
    }

    // Cerca una partita in attesa con lo stesso nome
    let room = Object.values(conn.game).find(room =>
      room.state === 'WAITING' && room.name === text
    );

    /* ============================================================
       SECONDO GIOCATORE ENTRA
       ============================================================ */
    if (room) {
      room.blackChat = m.chat;
      room.blackPlayer = m.sender;
      room.state = 'PLAYING';

      let str = [
        `♟️ *888 BOT - SCACCHI* ♟️`,
        `━━━━━━━━━━━━━━━━━━`,
        `⚪ Bianco: @${(room.whitePlayer || '').split('@')[0]}`,
        `⚫ Nero: @${(room.blackPlayer || '').split('@')[0]}`,
        `━━━━━━━━━━━━━━━━━━`,
        `🎯 Turno: ${room.game.turn() === 'w' ? '⚪ Bianco' : '⚫ Nero'}`,
        `━━━━━━━━━━━━━━━━━━`,
        `📌 Usa: ${usedPrefix}mossa <mossa>`,
        `🚪 Usa: ${usedPrefix}esci per abbandonare`
      ].join('\n');

      await conn.sendMessage(room.whiteChat, {
        text: str,
        mentions: conn.parseMention(str)
      });

      if (room.blackChat) {
        await conn.sendMessage(room.blackChat, {
          text: str,
          mentions: conn.parseMention(str)
        });
      }

      return;
    }

    /* ============================================================
       CREAZIONE NUOVA PARTITA
       ============================================================ */

    room = {
      id: 'chess-' + Date.now(),
      name: text,
      state: 'WAITING',
      game: new Chess(),

      whiteChat: m.chat,
      blackChat: null,

      whitePlayer: m.sender,
      blackPlayer: null
    };

    conn.game[room.id] = room;

    let waitMsg = [
      `♟️ *888 BOT - SCACCHI* ♟️`,
      `━━━━━━━━━━━━━━━━━━`,
      `⌛ In attesa di un avversario...`,
      `━━━━━━━━━━━━━━━━━━`,
      `🎯 Per entrare: ${usedPrefix}scacchi ${text}`,
      `🚪 Per abbandonare: ${usedPrefix}esci`
    ].join('\n');

    return conn.reply(m.chat, waitMsg, null, m);

  } catch (err) {
    console.error(err);
    return m.reply('⛔ Errore durante la creazione della partita.');
  }
};

handler.command = /^(scacchi|chess)$/i;
handler.tags = ['fun'];


/* ============================================================
   MOSSA — EFFETTUA UNA MOSSA
   ============================================================ */

let moveHandler = async (m, { conn, usedPrefix, command, text }) => {
  try {
    conn.game = conn.game || {};

    if (!text) return m.reply(`Uso: ${usedPrefix}mossa <mossa>\nEsempio: ${usedPrefix}mossa e4`);

    // Trova la partita del giocatore
    let room = Object.values(conn.game).find(room =>
      room.id.startsWith('chess') &&
      [room.whitePlayer, room.blackPlayer].includes(m.sender)
    );

    if (!room) return m.reply('⚠️ Non sei in nessuna partita di scacchi.');

    let game = room.game;

    // Controllo turno
    let turn = game.turn() === 'w' ? room.whitePlayer : room.blackPlayer;
    if (turn !== m.sender) {
      return m.reply('⛔ Non è il tuo turno!');
    }

    // Prova la mossa
    let move = game.move(text, { sloppy: true });

    if (!move) {
      return m.reply('❌ Mossa non valida!');
    }

    // Scacchiera ASCII
    let board = game.ascii();

    let msg = [
      `♟️ *888 BOT - SCACCHI* ♟️`,
      `━━━━━━━━━━━━━━━━━━`,
      `📌 Mossa effettuata: *${move.san}*`,
      `━━━━━━━━━━━━━━━━━━`,
      `\`\`\`${board}\`\`\``,
      `━━━━━━━━━━━━━━━━━━`,
      `🎯 Turno: ${game.turn() === 'w' ? '⚪ Bianco' : '⚫ Nero'}`,
      `🚪 ${usedPrefix}esci per abbandonare`
    ].join('\n');

    // Invia a entrambi
    await conn.sendMessage(room.whiteChat, { text: msg });
    if (room.blackChat) await conn.sendMessage(room.blackChat, { text: msg });

    // Controllo scacco matto
    if (game.isCheckmate()) {
      let winner = game.turn() === 'w' ? '⚫ Nero' : '⚪ Bianco';

      let endMsg = [
        `🏁 *SCACCO MATTO!*`,
        `Il vincitore è: *${winner}*`,
        `━━━━━━━━━━━━━━━━━━`,
        `Per una nuova partita:`,
        `${usedPrefix}scacchi <nome>`
      ].join('\n');

      await conn.sendMessage(room.whiteChat, { text: endMsg });
      if (room.blackChat) await conn.sendMessage(room.blackChat, { text: endMsg });

      delete conn.game[room.id];
    }

  } catch (err) {
    console.error(err);
    return m.reply('⛔ Errore durante la mossa.');
  }
};

moveHandler.command = /^(mossa|move)$/i;
moveHandler.tags = ['fun'];


/* ============================================================
   ESCI — ABBANDONA LA PARTITA
   ============================================================ */

let quitHandler = async (m, { conn, usedPrefix }) => {
  try {
    conn.game = conn.game || {};

    let roomId = Object.keys(conn.game).find(id => {
      let room = conn.game[id];
      if (!room || !room.id.startsWith('chess')) return false;

      let isPlayer = [room.whitePlayer, room.blackPlayer].includes(m.sender);
      let isChat = [room.whiteChat, room.blackChat].includes(m.chat);

      return isPlayer && isChat;
    });

    if (!roomId) {
      return m.reply('⚠️ Non sei in nessuna partita di scacchi in questa chat.');
    }

    let room = conn.game[roomId];

    let isWhite = room.whitePlayer === m.sender;
    let color = isWhite ? '⚪ Bianco' : '⚫ Nero';

    let endMsg = [
      `♟️ *Partita terminata*`,
      `👋 Il giocatore ${color} ha abbandonato.`,
      `━━━━━━━━━━━━━━━━━━`,
      `Per iniziare una nuova partita:`,
      `${usedPrefix}scacchi <nome>`
    ].join('\n');

    // Avvisa entrambe le chat
    if (room.whiteChat) {
      await conn.sendMessage(room.whiteChat, { text: endMsg });
    }
    if (room.blackChat && room.blackChat !== room.whiteChat) {
      await conn.sendMessage(room.blackChat, { text: endMsg });
    }

    delete conn.game[roomId];

  } catch (err) {
    console.error(err);
    return m.reply('⛔ Errore durante l\'uscita dalla partita.');
  }
};

quitHandler.command = /^(esci|quit|abbandona)$/i;
quitHandler.tags = ['fun'];


export { handler as default, moveHandler, quitHandler };
