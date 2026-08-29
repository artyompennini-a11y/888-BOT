const handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('❌ _Questo comando funziona solo all\'interno dei gruppi._');

  function progress(percent) {
    let bar = ''
    const total = 20
    const filled = Math.floor(percent * total / 100)
    for (let i = 0; i < total; i++) {
      bar += i < filled ? '█' : '▒'
    }
    return `${bar} ${percent}%`
  }

  const msg = await conn.sendMessage(m.chat,{
    text:`╭━━━〔 ⏳ *SISTEMA SCANSIONE* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* Avvio Diagnostica...
┃━━━━━━━━━━━━━━━━━━
┃ ⮕ _Inizializzazione del processo..._
┃ 
┃ ${progress(5)}
╰━━━━━━━━━━━━━━━━━━┈`
  },{quoted:m})

  async function update(percent, text){
    await conn.sendMessage(m.chat,{
      text:`╭━━━〔 ⏳ *SISTEMA SCANSIONE* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* ${text}
┃━━━━━━━━━━━━━━━━━━
┃ ⮕ _Analisi dei metadati in corso..._
┃ 
┃ ${progress(percent)}
╰━━━━━━━━━━━━━━━━━━┈`,
      edit:msg.key
    })
  }

  await new Promise(r=>setTimeout(r,700))
  await update(30,"Raccolta Informazioni")
  await new Promise(r=>setTimeout(r,700))
  await update(60,"Analisi Membri")
  await new Promise(r=>setTimeout(r,700))
  await update(85,"Verifica Permessi")
  await new Promise(r=>setTimeout(r,700))
  await update(100,"Completato con Successo!")

  const metadata = await conn.groupMetadata(m.chat)
  const nome = metadata.subject
  const id = m.chat
  const creatoreJid = metadata.owner
  const descrizione = metadata.desc || "Nessuna descrizione"
  const membri = metadata.participants.length
  const adminsList = metadata.participants.filter(p=>p.admin)
  const admins = adminsList.length
  const percentualeAdmin = Math.floor((admins/membri)*100)
  const creatoIl = new Date(metadata.creation*1000).toLocaleDateString('it-IT')
  const giorniVita = Math.floor((Date.now() - metadata.creation*1000)/86400000)
  const annunci = metadata.announce ? "Solo admin possono scrivere" : "Chat aperta a tutti"
  const restrizioni = metadata.restrict ? "Solo admin possono modificare info" : "Tutti possono modificare info"

  const chatData = global.db.data.chats[m.chat] || {}
  let messaggiTotali = chatData.totalmsg || 0
  if (!messaggiTotali && chatData.topUsers) {
    messaggiTotali = Object.values(chatData.topUsers).reduce((sum, value) => sum + (value || 0), 0)
  }
  if (!messaggiTotali && chatData.users) {
    messaggiTotali = Object.values(chatData.users).reduce((sum, user) => sum + ((user?.messages || 0)), 0)
  }

  const getSafeName = async (jid) => {
    const fallback = jid.split('@')[0]
    if (!conn.getName) return fallback
    try {
      const name = await Promise.resolve(conn.getName(jid))
      return typeof name === 'string' && name ? name : fallback
    } catch {
      return fallback
    }
  }

  const creatoreNome = creatoreJid ? await getSafeName(creatoreJid) : null
  const creatore = creatoreNome ? '@'+creatoreNome : "Sconosciuto"

  let listaAdmin=''
  let mentions=[]
  for (let admin of adminsList){
    const numero = admin.id.split('@')[0]
    listaAdmin += `┃  • @${numero}\n`
    mentions.push(admin.id)
  }
  if (creatoreJid) mentions.push(creatoreJid)

  await conn.sendMessage(m.chat,{delete:msg.key})

  const messaggio=`╭━━━〔 👥 *INFO GRUPPO* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* Informazioni Sincronizzate
┃━━━━━━━━━━━━━━━━━━
┃ 📛 *Nome Gruppo:* ${nome}
┃ 🛡️ *Creato da:* ${creatore}
┃ 📆 *Data Creazione:* ${creatoIl}
┃ ⏳ *Attivo da:* ${giorniVita} Giorni
┃ 
┃ 📊 *STATISTICHE CHAT:*
┃  • _Membri totali:_ ${membri}
┃  • _Admin totali:_ ${admins} (${percentualeAdmin}%)
┃  • _Messaggi totali:_ ${messaggiTotali}*
┃    (*conteggiati dall'ingresso del bot)
┃ 
┃ 🔒 *IMPOSTAZIONI:*
┃  • _Invio Messaggi:_ ${annunci}
┃  • _Modifica Info:_ ${restrizioni}
┃ 
┃ 👑 *AMMINISTRATORI IN CARICA:*
${listaAdmin.trimEnd()}
╰━━━━━━━━━━━━━━━━━━┈`.trim()

  await conn.sendMessage(
    m.chat,
    {
      text: messaggio,
      contextInfo: { mentionedJid: mentions },
      footer: '💡 Seleziona un\'opzione rapida dal menu sottostante.',
      buttons: [
        { buttonId: '.link', buttonText: { displayText: '🔗 LINK GRUPPO' }, type: 1 },
        { buttonId: '.menu', buttonText: { displayText: '📜 MENU PRINCIPALE' }, type: 1 }
      ],
      headerType: 1
    },
    { quoted: m }
  )
}

handler.command=['infogruppo','groupinfo','infogc']
handler.group=true

export default handler
