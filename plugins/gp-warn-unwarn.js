const time = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let handler = async (m, { conn, text, args, groupMetadata, usedPrefix, command }) => {
  let reason = args.slice(1).join(' ') || 'Non specificato, ma meritato'
  
  if (command == 'warn' || command == "ammonisci") {
    let mention = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.quoted
    if (!mention) return m.reply('⚠️ *Devi menzionare o rispondere al messaggio di un utente da ammonire.*')
    
    let war = '2'
    let who;
    if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : true;
    else who = m.chat;
    if (!who) return;

    if (!(who in global.db.data.users)) {
      global.db.data.users[who] = { warn: 0 };
    }
    
    let warn = global.db.data.users[who].warn;
    let user = global.db.data.users[who];
    
    let prova = {
      "key": {
        "participants": "0@s.whatsapp.net",
        "fromMe": false,
        "id": "Halo"
      },
      "message": {
        "locationMessage": {
          name: 'WARN ⚠️',
          jpegThumbnail: await loadIcon('warn'),
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
        }
      },
      "participant": "0@s.whatsapp.net"
    };

    if (warn < war) {
      global.db.data.users[who].warn += 1;

      let messaggioWarn = `╭━━━〔 ⚠️ *AVVERTIMENTO* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* Sanzione Registrata
┃━━━━━━━━━━━━━━━━━━
┃ 👤 *Target:* @${mention.split`@`[0]}
┃ 👑 *Eseguito da:* @${m.sender.split`@`[0]}
┃ 📊 *Sanzioni:* [ ${user.warn} / 3 ]
┃ 📝 *Motivo:* _${reason}_
┃━━━━━━━━━━━━━━━━━━
┃ ⮕ _Attenzione! Al raggiungimento del terzo_
┃   _avvertimento verrai espulso dal gruppo._
╰━━━━━━━━━━━━━━━━━━┈`.trim();

      conn.reply(m.chat, messaggioWarn, prova, { mentions: [mention, m.sender] });

    } else if (warn == war) {
      global.db.data.users[who].warn = 0;

      let messaggioKick = `╭━━━〔 ❌ *UTENTE ESPULSO* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* Limite Raggiunto
┃━━━━━━━━━━━━━━━━━━
┃ 👤 *Target:* @${who.split('@')[0]}
┃ ⚙️ *Azione:* Rimozione Automatica
┃━━━━━━━━━━━━━━━━━━
┃ ⮕ _L'utente ha accumulato 3 avvertimenti_
┃   _ed è stato rimosso dalla chat._
╰━━━━━━━━━━━━━━━━━━┈`.trim();

      conn.reply(m.chat, messaggioKick, prova, { mentions: [who] });

      await time(1000);
      await conn.groupParticipantsUpdate(m.chat, [who], 'remove');
    }
  }

  if (command == 'unwarn' || command == "delwarn") {
    let mention = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null
    if (!mention) return m.reply('✅ *Devi menzionare o rispondere al messaggio di un utente per rimuovere un warn.*')

    let who = mention

    if (!(who in global.db.data.users)) {
      global.db.data.users[who] = { warn: 0 }
    }

    let user = global.db.data.users[who]

    if (user.warn > 0) {
      user.warn -= 1

      let prova = {
        "key": {
          "participants": "0@s.whatsapp.net",
          "fromMe": false,
          "id": "Halo"
        },
        "message": {
          "locationMessage": {
            name: 'Unwarn ✅',
            jpegThumbnail: await loadIcon('unwarn')
          }
        },
        "participant": "0@s.whatsapp.net"
      }

      let messaggioUnwarn = `╭━━━〔 ✅ *SANZIONE REVOCATA* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* Warn Rimosso
┃━━━━━━━━━━━━━━━━━━
┃ 👤 *Target:* @${who.split('@')[0]}
┃ 👑 *Eseguito da:* @${m.sender.split('@')[0]}
┃ 📊 *Sanzioni Rimanenti:* [ ${user.warn} / 3 ]
┃━━━━━━━━━━━━━━━━━━
┃ ⮕ _Un avvertimento è stato revocato._
┃   _Comportati bene d'ora in avanti._
╰━━━━━━━━━━━━━━━━━━┈`.trim();

      conn.reply(m.chat, messaggioUnwarn, prova, { mentions: [who, m.sender] })

    } else {
      m.reply('ⓘ _Questo utente non ha nessuna sanzione o warn a carico._')
    }
  }
}

handler.command = ['warn', 'ammonisci', 'unwarn', 'delwarn'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;

