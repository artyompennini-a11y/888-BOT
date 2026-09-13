// Plugin by Punisher


let handler = async (m, { conn }) => {
  const message = `Bro perchè parli di Night?`;

  await conn.sendMessage(m.chat, { text: message }, { quoted: m });
};

handler.help = ['larper'];
handler.tags = ['giochi'];

// Questa regex rileva "larper" ovunque nel messaggio, ignorando maiuscole/minuscole
handler.customPrefix = /larper/i; 
handler.command = new RegExp; // Sovrascrive il comando standard per usare il prefisso personalizzato

export default handler;
