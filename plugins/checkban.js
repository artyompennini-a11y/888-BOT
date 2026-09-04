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

    try {
      let [onWa] = await conn.onWhatsApp(jid);
      if (onWa) {
        risultato.esisteWhatsApp = true;
        risultato.attivo = onWa.exists;
        if (onWa?.jid) risultato.jid = onWa.jid;
      }
    } catch (e) {
  
    }
    

    if (risultato.esisteWhatsApp) {
      try {

        let nome = await conn.getName(jid);
        if (nome && nome !== 'undefined' && nome !== numero) {
          risultato.nome = nome;
        }
      } catch {}
      
      try {
     
        let status = await conn.fetchStatus(jid);
        if (status?.status) {
          risultato.bio = status.status;
          if (status.setAt) risultato.ultimoAccesso = new Date(status.setAt * 1000);
        }
      } catch {}
      
      try {
   
        let foto = await conn.profilePictureUrl(jid, 'image');
        if (foto) risultato.foto = foto;
      } catch {}
      
      try {
    
        if (jid.endsWith('@s.whatsapp.net')) {
       
          let chat = conn.chats?.[jid];
          if (chat) {
            if (chat.isBusiness) risultato.tipoAccount = 'business';
            else risultato.tipoAccount = 'personale';
          }
        }
      } catch {}
    }
    

    try {
      let userDb = global.db?.data?.users?.[risultato.jid] || global.db?.data?.users?.[jid];
      if (userDb) {
        risultato.banDB = !!userDb.banned;
        if (userDb.banReason) risultato.banReason = userDb.banReason;
        if (userDb.banDate) risultato.banDate = userDb.banDate;
      }
      
  
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