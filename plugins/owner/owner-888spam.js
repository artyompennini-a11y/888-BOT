// Plugin by 888 staff — .888spam (solo owner)
const handler = async (m, { conn, text, isOwnerBot }) => {
  try {
    // Solo owner del bot
    if (!isOwnerBot) {
      return conn.sendMessage(m.chat, {
        text: "❌ Solo l'owner del bot può usare questo comando."
      });
    }

    if (!text) {
      return conn.sendMessage(m.chat, {
        text: "Uso corretto:\n.888spam [numero]"
      });
    }

    const num = parseInt(text.trim(), 10);

    if (isNaN(num) || num <= 0) {
      return conn.sendMessage(m.chat, {
        text: "Inserisci un numero valido.\nEsempio: .888spam 5"
      });
    }

    const max = 50; // limite sicurezza
    const times = Math.min(num, max);

    const link = "https://chat.whatsapp.com/CuMIAMfhTNo92h0UE2NGrb";

    let msg = "";
    for (let i = 0; i < times; i++) {
      msg += link + "\n";
    }

    await conn.sendMessage(m.chat, { text: msg });
  } catch (e) {
    console.error("Errore .888spam:", e);
  }
};

handler.help = ["888spam"];
handler.tags = ["tools"];
handler.command = /^\.?888spam$/i;

export default handler;