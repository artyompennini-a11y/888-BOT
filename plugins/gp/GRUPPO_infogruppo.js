const handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('❌ Questo comando funziona solo nei gruppi.');

  const progress = (percent) => {
    const total = 20;
    const filled = Math.floor(percent * total / 100);
    return `${'█'.repeat(filled)}${'▒'.repeat(total - filled)} ${percent}%`;
  };

  const msg = await conn.sendMessage(m.chat, {
    text: `⏳ *SISTEMA SCANSIONE 888*\nAvvio diagnostica...\n\n${progress(5)}`
  }, { quoted: m });

  const update = async (percent, text) => {
    await conn.sendMessage(m.chat, {
      text: `⏳ *SISTEMA SCANSIONE 888*\n${text}\n\n${progress(percent)}`,
      edit: msg.key
    });
  };

  await new Promise(r => setTimeout(r, 700));
  await update(30, "Raccolta informazioni");
  await new Promise(r => setTimeout(r, 700));
  await update(60, "Analisi membri");
  await new Promise(r => setTimeout(r, 700));
  await update(85, "Verifica permessi");
  await new Promise(r => setTimeout(r, 700));
  await update(100, "Completato con successo!");

  const metadata = await conn.groupMetadata(m.chat);
  const nome = metadata.subject;
  const creatoreJid = metadata.owner;
  const descrizione = metadata.desc || "Nessuna descrizione";
  const membri = metadata.participants.length;
  const adminsList = metadata.participants.filter(p => p.admin);
  const admins = adminsList.length;
  const percentualeAdmin = Math.floor((admins / membri) * 100);
  const creatoIl = new Date(metadata.creation * 1000).toLocaleDateString('it-IT');
  const giorniVita = Math.floor((Date.now() - metadata.creation * 1000) / 86400000);
  const annunci = metadata.announce ? "Solo admin possono scrivere" : "Chat aperta a tutti";
  const restrizioni = metadata.restrict ? "Solo admin possono modificare info" : "Tutti possono modificare info";

  const chatData = global.db.data.chats[m.chat] || {};
  let messaggiTotali = chatData.totalmsg || 0;

  if (!messaggiTotali && chatData.topUsers) {
    messaggiTotali = Object.values(chatData.topUsers).reduce((sum, value) => sum + (value || 0), 0);
  }
  if (!messaggiTotali && chatData.users) {
    messaggiTotali = Object.values(chatData.users).reduce((sum, user) => sum + ((user?.messages || 0)), 0);
  }

  const getSafeName = async (jid) => {
    const fallback = jid.split('@')[0];
    try {
      const name = await conn.getName(jid);
      return name || fallback;
    } catch {
      return fallback;
    }
  };

  const creatoreNome = creatoreJid ? await getSafeName(creatoreJid) : null;
  const creatore = creatoreNome ? '@' + creatoreNome : "Sconosciuto";

  let listaAdmin = '';
  let mentions = [];

  for (let admin of adminsList) {
    const numero = admin.id.split('@')[0];
    listaAdmin += `• @${numero}\n`;
    mentions.push(admin.id);
  }
  if (creatoreJid) mentions.push(creatoreJid);

  await conn.sendMessage(m.chat, { delete: msg.key });

  const messaggio = `
👥 *INFO GRUPPO 888*
Informazioni sincronizzate

📛 *Nome gruppo:* ${nome}
🛡️ *Creato da:* ${creatore}
📆 *Data creazione:* ${creatoIl}
⏳ *Attivo da:* ${giorniVita} giorni

📊 *Statistiche chat*
• Membri totali: ${membri}
• Admin totali: ${admins} (${percentualeAdmin}%)
• Messaggi totali: ${messaggiTotali}

🔒 *Impostazioni*
• Invio messaggi: ${annunci}
• Modifica info: ${restrizioni}

👑 *Amministratori*
${listaAdmin.trim()}
━━━━━━━━━━━━━━━━━━━━━━
💡 Usa il menu rapido qui sotto.
`.trim();

  await conn.sendMessage(
    m.chat,
    {
      text: messaggio,
      contextInfo: { mentionedJid: mentions },
      buttons: [
        { buttonId: '.link', buttonText: { displayText: '🔗 Link gruppo' }, type: 1 },
        { buttonId: '.menu', buttonText: { displayText: '📜 Menu principale' }, type: 1 }
      ],
      headerType: 1
    },
    { quoted: m }
  );
};

handler.command = ['infogruppo', 'groupinfo', 'infogc'];
handler.group = true;

export default handler;