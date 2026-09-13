let balIconBuffer;
async function loadBalIcon() {
  if (!balIconBuffer) {
    try {
      balIconBuffer = await global.fs.promises.readFile('./icone/bal.png');
    } catch (error) {
      balIconBuffer = Buffer.alloc(0);
    }
  }
  return balIconBuffer;
}

let handler = async (m, { conn }) => {
  // Filtra la lista degli owner validi
  const owners = global.owner.filter(([id, isCreator]) => id && isCreator);

  // Costruisce la lista di VCard per ogni owner
  const contacts = owners.map(([number, name]) => {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    const displayName = name || 'Owner';
    
    return {
      vcard: `BEGIN:VCARD\n`
        + `VERSION:3.0\n`
        + `FN:${displayName}\n`
        + `ORG:𝟴𝟴𝟴 𝗕𝗢𝗧;\n`
        + `TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\n`
        + `END:VCARD`
    };
  });

  // Messaggio citato personalizzato (Quoted Message)
  const botName = global.db?.data?.nomedelbot || 'Ꮻ𝐖𝐍𝚵𝐑   𝟴𝟴𝟴 𝗕𝗢𝗧';
  const icon = await loadBalIcon();
  
  const prova = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "Halo"
    },
    message: {
      locationMessage: {
        name: botName,
        jpegThumbnail: icon,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: "0@s.whatsapp.net"
  };

  // Invio dei contatti tramite il metodo nativo di Baileys
  await conn.sendMessage(m.chat, {
    contacts: {
      displayName: `${owners.length} Proprietari`,
      contacts: contacts
    }
  }, { quoted: prova });

  return true;
};

handler.help = ['padroni'];
handler.tags = ['main'];
handler.command = ['padroni', 'proprietario'];

export default handler;