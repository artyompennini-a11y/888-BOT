//Plugin by Elixir & 888 staff
import { Chess } from 'chess.js';


 
   
let handler = async (m, { conn, usedPrefix, command, text }) => {
  try {
    conn.game = conn.game || {};

   
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

  
    let room = Object.values(conn.game).find(room =>
      room.state === 'WAITING' && room.name === text
    );

    
      
      
    if (room) {
      room.blackChat = m.chat;
      room.blackPlayer = m.sender;
      room.state = 'PLAYING';

      let boardMsg = [
        `♟️ *888 BOT - SCACCHI* ♟️`,
        `━━━━━━━━━━━━━━━━━━`,
        `⚪ Bianco: @${room.whitePlayer.split('@')[0]}`,
        `⚫ Nero: @${room.blackPlayer.split('@')[0]}`,
        `━━━━━━━━━━━━━━━━━━`,
        `🎯 Turno: ${room.game.turn() === 'w' ? '⚪ Bianco' : '⚫ Nero'}`,
        `━━━━━━━━━━━━━━━━━━`,
        `📌 Usa: ${usedPrefix}mossa <mossa>`,
        `🚪 Usa: ${usedPrefix}esci per abbandonare`
      ].join('\n');

      await conn.sendMessage(room.whiteChat, {
        text: boardMsg,
        mentions: conn.parseMention(boardMsg)
      });

      await conn.sendMessage(room.blackChat, {
        text: boardMsg,
        mentions: conn.parseMention(boardMsg)
      });

      return;
    }

    
      
      

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

export { handler as default, quitHandler };
