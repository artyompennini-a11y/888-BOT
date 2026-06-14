let handler = async (m, { conn }) => {
  const message = `NON CAGARE IL CAZZO NON STO PASSANDO UN BEL MOMENTO`;

  await conn.sendMessage(m.chat, { text: message }, { quoted: m });
};

handler.help = ['xxxx'];
handler.tags = ['giochi'];

// Questa regex rileva "xxxx" ovunque nel messaggio, ignorando maiuscole/minuscole
handler.customPrefix = /xxxx/i; 
handler.command = new RegExp; // Sovrascrive il comando standard per usare il prefisso personalizzato

export default handler;
