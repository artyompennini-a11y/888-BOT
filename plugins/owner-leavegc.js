//Plugin by Gab, Lucifero & 333 staff



let handler = async (m, { conn, args, command }) => {

    const fake = {
    contextInfo: { externalAdReply :{ mediaUrl: null, mediaType: 1,
    title: '𝟴𝟴𝟴 𝗕𝗢𝗧',
    body: '𝐞𝐧𝐭𝐫𝐚 𝐧𝐞𝐥 𝐜𝐚𝐧𝐚𝐥𝐞 𝐝𝐢 𝟴𝟴𝟴 𝗕𝗢𝗧!',         
    previewType: 0, thumbnail: fs.readFileSync("./icone/benvenuto.png"),
    sourceUrl: 'https://whatsapp.com/channel/0029Vb7ptH62UPBKFFgByc3C'
        }
      }
    };

    const caption = `Me so cagato il cazzo di fare il bot di turno qua dentro! 💩`;

  await conn.reply(m.chat, caption, null, fake);


  await conn.groupLeave(m.chat);
};
handler.help = ['𝐨𝐮𝐭'];
handler.command = /^(out|leavegc|leave|salirdelgrupo)$/i;
handler.group = true;
handler.tags = ['owner'];
handler.owner = true;
export default handler;
