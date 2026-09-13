let handler = async (m, { isOwner, isAdmin, conn, args, participants, command, groupMetadata }) => {
  if (command === 'tagall' || command === 'marcar') {

    if (!(isAdmin || isOwner)) {
      global.dfail('admin', m, conn);
      throw false;
    }

    let pesan = args.join(' ') || '🚨 *SVEGLIA!!!*';
    let oi = `${pesan}`;

    let prova = {
      key: {
        participants: "0@s.whatsapp.net",
        fromMe: false,
        id: "Halo"
      },
      message: {
        locationMessage: {
          name: '𝐍𝐎𝐍 𝐒𝐈 𝐃𝐎𝐑𝐌𝐄!!!',
          jpegThumbnail: await (await fetch('https://telegra.ph/file/92576d96e97bb7e3939e2.png')).buffer()
        }
      },
      participant: "0@s.whatsapp.net"
    };

    let teks = 
`📢 *Richiamo Generale*
🏠 Gruppo: *${groupMetadata.subject || 'Gruppo Sconosciuto'}*
👥 Membri: *${participants.length}*
💬 Messaggio: _${oi}_

*Menzioni:*`;

    const validParticipants = participants.filter(mem => mem && typeof mem.id === 'string' && mem.id.includes('@'));
    const mentionList = validParticipants.map(mem => mem.id);

    const getSafeName = async (jid) => {
      const fallback = jid.split('@')[0];
      if (!conn.getName) return fallback;
      try {
        const name = await Promise.resolve(conn.getName(jid));
        return typeof name === 'string' && name ? name : fallback;
      } catch {
        return fallback;
      }
    };

    for (let mem of validParticipants) {
      const name = await getSafeName(mem.id);
      teks += `\n• @${name}`;
    }

    await conn.sendMessage(
      m.chat,
      {
        text: teks,
        contextInfo: { mentionedJid: mentionList }
      },
      { quoted: prova }
    );
  }
};

handler.help = ['tagall'];
handler.tags = ['admin'];
handler.admin = true;
handler.mods = true;
handler.command = /^(tagall|marcar)$/i;
handler.group = true;

export default handler;