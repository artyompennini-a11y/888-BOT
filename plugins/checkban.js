// Plugin by Elixir, Punisher & 888 staff

let handler = async (m, { conn, text, command, usedPrefix: prefix }) => {
  try {
    console.log(`[checkban] Richiesta scansione da: ${m.sender} via ${command}`);

    let target = m.quoted ? m.quoted.sender : m.mentionedJid?.[0] ? m.mentionedJid[0] : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;
    if (!target) {
      return m.reply(`⭔ *SISTEMA 888*\n\n💡 _Uso:_ Rispondi a qualcuno, taggalo o scrivi il numero.`);
    }

    await m.react('🛰️');

    let cleanNumber = target.split('@')[0];
    let isBanned = false;
    let databaseStatus = 'UNKNOWN';

    try {
      if (global.db && global.db.data && global.db.data.users) {
        let userInDb = global.db.data.users[target];
        if (userInDb) {
          isBanned = userInDb.banned || false;
          databaseStatus = isBanned ? 'RESTRICTED' : 'AUTHORIZED';
        }
      }
    } catch (dbErr) {
      console.error('[checkban] Errore lettura locale database:', dbErr.message);
    }

    let reportText = `
╭━━━〔 📡 *888 CORE SCANNER* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Livello:* Core Control System
┃━━━━━━━━━━━━━━━━━━
┃ ⚙️ *Dettagli Scansione:*
┃ ⮕ *Target:* @${cleanNumber}
┃ ⮕ *JID:* \`${target}\`
┃ ⮕ *Stato DB:* \`${databaseStatus}\`
┃ ⮕ *Timestamp:* \`${new Date().toISOString()}\`
┃━━━━━━━━━━━━━━━━━━
┃ ${isBanned ? '🚨 *ESITO: SECURITY ALERT*' : '🛡️ *ESITO: SECURITY CLEAR*'}
┃ ⮕ *Stato:* ${isBanned ? '🔴 *BANNATO / LOCK*' : '🟢 *AUTORIZZATO / SAFE*'}
┃ ⮕ *Note:* ${isBanned ? 'Sospensione permanente da tutti i moduli.' : 'Nessuna anomalia riscontrata.'}
╰━━━━━━━━━━━━━━━━━━┈

> ⚠️ In caso di bug o problemi tecnici, 
> utilizza il comando *${prefix || '#'}segnala* per 
> segnalarlo subito allo staff.`.trim();

    await conn.sendMessage(m.chat, { 
      text: reportText,
      mentions: [target]
    }, { quoted: m });

    await m.react('✅');
    console.log(`[checkban] Scansione inviata con successo per: ${cleanNumber}`);

  } catch (err) {
    console.error('[checkban] Errore durante la scansione:', err);
    await m.reply(`\`── ❌ SYSTEM ERROR ──\`\n\n\`💥\` Fallimento durante l'elaborazione dei dati.\n\n\`[⚡] 888 SYSTEM\``);
    await m.react('❌');
  }
};

handler.help = ['checkban'];
handler.tags = ['owner'];
handler.command = /^(checkban)$/i;
handler.owner = true;

export default handler;