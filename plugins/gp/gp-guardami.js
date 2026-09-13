// Plugin "guardami" — mostra i messaggi del bot in attesa
// Versione premium 888

let handler = async (m, { conn }) => {
  try {
    // Store compatibile con tutte le versioni
    let store = conn.msgStore || conn.ev?.msgStore || conn.sentMessages || [];

    if (!Array.isArray(store)) {
      return m.reply("⚠️ Nessun registro dei messaggi disponibile.");
    }

    // Filtra solo messaggi validi e con stato pending/server_ack
    let pending = store.filter(msg =>
      msg &&
      msg.status &&
      (msg.status === "pending" || msg.status === "server_ack")
    );

    if (!pending.length) {
      return m.reply("🟢 Nessun messaggio in attesa.\nIl bot è sincronizzato correttamente.");
    }

    let txt = `👁️ *Messaggi in Attesa*\nTotale: ${pending.length}\n\n`;

    for (let msg of pending) {
      let id = msg.key?.id || "Sconosciuto";
      let ts = msg.messageTimestamp
        ? new Date(msg.messageTimestamp * 1000).toLocaleString()
        : "N/D";

      txt +=
        `📨 ID: ${id}\n` +
        `⏳ Stato: ${msg.status}\n` +
        `🕒 Timestamp: ${ts}\n\n`;
    }

    await m.reply(txt.trim());

  } catch (err) {
    console.error("[guardami] Errore:", err);
    await m.reply("❌ Errore interno durante la scansione dei messaggi.");
  }
};

handler.help = ['guardami'];
handler.tags = ['info'];
handler.command = /^(guardami)$/i;
handler.owner = true;

export default handler;