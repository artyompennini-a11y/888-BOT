// Plugin by Elixir, Punisher & 888 staff

let handler = async (m, { conn, text, command, usedPrefix: prefix, args }) => {
  try {

    let targets = [];
    
    if (m.quoted?.sender) targets.push(m.quoted.sender);
    if (m.mentionedJid?.length) targets.push(...m.mentionedJid);
    
    if (text) {
      let numeri = text.replace(/[^0-9+\s,]/g, '').split(/[\s,]+/).filter(Boolean);
      numeri.forEach(n => {
        let num = n.replace(/[^0-9]/g, '');
        if (num.length >= 8 && num.length <= 15) targets.push(num + '@s.whatsapp.net');
      });
    }
    
    if (targets.length === 0) {
      return m.reply(`⭔ *888 ADVANCED CHECKER*\n\n💡 _Uso:_\n• Rispondi a un messaggio\n• Tagga @utente\n• Scrivi numero (es: +39 320 1234567)\n• Multi: .checkban 393201234567,393334445555\n\n⚠️ Max 5 numeri per scansione`);
    }
    
    targets = [...new Set(targets)].slice(0, 5); // Duplicati rimossi, max 5
    await m.react('🛰️');
    
    let risultati = await Promise.all(targets.map(t => scanNumber(conn, t, m.sender)));
    
    let reportGlobale = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🛡️ *888 CORE SCANNER v2.0*
┃ 📡 *ANALISI COMPLETA NUMERO*
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
    
    reportGlobale += `⏱️ *Timestamp:* ${new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}\n`;
    reportGlobale += `📊 *Scansioni:* ${risultati.length}\n`;
    reportGlobale += `🔴 *Bannati:* ${risultati.filter(r => r.banDB).length}\n`;
    reportGlobale += `🟢 *Attivi:* ${risultati.filter(r => r.attivo).length}\n`;
    reportGlobale += `⚠️ *Sconosciuti:* ${risultati.filter(r => !r.attivo && !r.banDB).length}\n`;
    reportGlobale += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    let mentions = [];
    
    for (const r of risultati) {
      reportGlobale += formatSingleReport(r, mentions);
      reportGlobale += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    }
    
    reportGlobale += `\n> 🔄 Usa *${prefix || '#'}checkban* per nuova scansione\n> 📝 Segnala bug con *${prefix || '#'}segnala*`;
    
    await conn.sendMessage(m.chat, { 
      text: reportGlobale,
      mentions: [...new Set(mentions)]
    }, { quoted: m });
    
    await m.react('✅');
    
  } catch (err) {
    console.error('[checkban] Errore critico:', err);
    await m.reply(`\`── ❌ SYSTEM ERROR ──\`\n\n\`💥\` ${err.message}\n\n\`[⚡] 888 SYSTEM\``);
    await m.react('❌');
  }
};

async function scanNumber(conn, jid, richiedente) {
  const numero = jid.split('@')[0];
  const startTime = Date.now();
  let risultato = {
    jid,
    numero,
    attivo: false,
    esisteWhatsApp: false,
    banDB: false,
    nome: null,
    foto: null,
    bio: null,
    ultimoAccesso: null,
    tipoAccount: 'sconosciuto',
    gruppiComuni: 0,
    tempoScansione: 0,
    errore: null
  };
  
  try {
    // Check local store for WhatsApp existence (no API call)
    try {
      let chat = conn.chats?.[jid];
      if (chat) {
        risultato.esisteWhatsApp = true;
        risultato.attivo = chat.isChats !== false;
      } else {
        // Check if user exists in any group participants
        let foundInGroup = false;
        for (const [groupId, groupChat] of Object.entries(conn.chats || {})) {
          if (groupId.endsWith('@g.us') && groupChat.metadata?.participants) {
            if (groupChat.metadata.participants.some(p => 
              conn.decodeJid(p.id) === conn.decodeJid(jid)
            )) {
              foundInGroup = true;
              risultato.gruppiComuni++;
            }
          }
        }
        if (foundInGroup) {
          risultato.esisteWhatsApp = true;
          risultato.attivo = true;
        }
      }
      
      // Check DB for user data
      if (!risultato.esisteWhatsApp && global.db?.data?.users?.[jid]) {
        risultato.esisteWhatsApp = true;
        risultato.attivo = true;
      }
    } catch (e) {
      console.error('[checkStore] Error:', e.message);
    }
    
    // Get profile data from local store (no API calls)
    if (risultato.esisteWhatsApp) {
      try {
        // Get name from local store
        let nome = await conn.getName(jid);
        if (nome && nome !== 'undefined' && nome !== numero) {
          risultato.nome = nome;
        }
      } catch {}
      
      try {
        // Get bio/status from local store
        let chat = conn.chats?.[jid];
        if (chat?.status) {
          risultato.bio = chat.status;
          if (chat.statusSetAt) risultato.ultimoAccesso = new Date(chat.statusSetAt * 1000);
        }
        // Check DB for bio
        if (!risultato.bio && global.db?.data?.users?.[jid]?.bio) {
          risultato.bio = global.db.data.users[jid].bio;
        }
      } catch {}
      
      try {
        // Check for photo from local store
        let chat = conn.chats?.[jid];
        if (chat?.imgUrl || chat?.profilePictureUrl) {
          risultato.foto = chat.imgUrl || chat.profilePictureUrl;
        }
      } catch {}
      
      try {
        // Get account type from local store
        if (jid.endsWith('@s.whatsapp.net')) {
          let chat = conn.chats?.[jid];
          if (chat) {
            if (chat.isBusiness) risultato.tipoAccount = 'business';
            else risultato.tipoAccount = 'personale';
          }
          // Check DB for business status
          if (global.db?.data?.users?.[jid]?.isBusiness) {
            risultato.tipoAccount = 'business';
          }
        }
      } catch {}
    }
    
    // Check ban status from DB
    try {
      let userDb = global.db?.data?.users?.[risultato.jid] || global.db?.data?.users?.[jid];
      if (userDb) {
        risultato.banDB = !!userDb.banned;
        if (userDb.banReason) risultato.banReason = userDb.banReason;
        if (userDb.banDate) risultato.banDate = userDb.banDate;
      }
      
      // Check global banlist
      if (global.db?.data?.settings?.[conn.user.jid]?.banlist?.includes(jid)) {
        risultato.banDB = true;
        risultato.banGlobale = true;
      }
    } catch (dbErr) {
      console.error('[checkban] DB Error:', dbErr.message);
    }
    
  } catch (err) {
    risultato.errore = err.message;
  }
  
  risultato.tempoScansione = Date.now() - startTime;
  return risultato;
}


function formatSingleReport(r, mentions) {
  let report = '';
  
  let statoEmoji, statoTesto;
  if (r.banDB) {
    statoEmoji = '🔴';
    statoTesto = 'BANNATO GLOBALMENTE';
  } else if (!r.esisteWhatsApp) {
    statoEmoji = '⚠️';
    statoTesto = 'NON SU WHATSAPP';
  } else if (!r.attivo) {
    statoEmoji = '🟡';
    statoTesto = 'INATTIVO / SOSPETTO';
  } else {
    statoEmoji = '🟢';
    statoTesto = 'ATTIVO E SICURO';
  }
  
  report += `╭━━━〔 📡 *${r.numero}* 〕━━━┈\n`;
  report += `┃ ${statoEmoji} *Stato:* ${statoTesto}\n`;
  report += `┃━━━━━━━━━━━━━━━━━━━━━━\n`;
  
  if (r.nome) {
    report += `┃ 👤 *Nome:* ${r.nome}\n`;
    mentions.push(r.jid);
  }
  
  report += `┃ 📱 *JID:* \`${r.jid}\`\n`;
  
  if (r.esisteWhatsApp) {
    report += `┃ 🔵 *WhatsApp:* ✅ Registrato\n`;
    report += `┃ 📋 *Tipo:* ${r.tipoAccount === 'business' ? '🏢 Business' : '👤 Personale'}\n`;
  } else {
    report += `┃ 🔵 *WhatsApp:* ❌ Non trovato\n`;
  }
  
  if (r.bio) {
    report += `┃ 📝 *Bio:* ${r.bio.substring(0, 60)}${r.bio.length > 60 ? '...' : ''}\n`;
  }
  
  if (r.ultimoAccesso) {
    let diffMs = Date.now() - r.ultimoAccesso;
    let diffGiorni = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    report += `┃ ⏰ *Ultimo status:* ${diffGiorni}g fa (${r.ultimoAccesso.toLocaleDateString('it-IT')})\n`;
  }
  
  report += `┃━━━━━━━━━━━━━━━━━━━━━━\n`;
  if (r.banDB) {
    report += `┃ 🚨 *ATTENZIONE:* BAN DB LOCALE\n`;
    report += `┃ ⛔ *Motivo:* ${r.banReason || 'Non specificato'}\n`;
    report += `┃ 📅 *Data ban:* ${r.banDate || 'N/A'}\n`;
    if (r.banGlobale) report += `┃ 🌐 *Tipo:* Ban globale server\n`;
  } else {
    report += `┃ ✅ *Nessun ban locale*\n`;
  }
  
  report += `┃━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `┃ ⏱️ Scansione: ${r.tempoScansione}ms\n`;
  report += `╰━━━━━━━━━━━━━━━━━━━━━━┈`;
  
  if (r.errore) {
    report += `\n⚠️ *Errore:* ${r.errore}`;
  }
  
  return report;
}

handler.help = ['checkban [@user/numero]', 'checkban multi numeri'];
handler.tags = ['owner', 'security'];
handler.command = /^(checkban|verifica|scan)$/i;
handler.owner = true;

export default handler;