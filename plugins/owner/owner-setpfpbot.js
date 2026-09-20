import * as Jimp from 'jimp';
import ownerData from './config.js';

const AUTHORIZED_USER = `${ownerData[0][0]}@s.whatsapp.net`;

const processImage = async (media) => {
  const image = await Jimp.read(media);
  const size = Math.min(image.getWidth(), image.getHeight());
  const scaled = image.crop(0, 0, size, size).scaleToFit(720, 720);
  
  return await scaled.getBufferAsync(Jimp.MIME_JPEG);
};

let handler = async (m, { args, conn }) => {
  if (m.sender !== AUTHORIZED_USER) {
    return;
  }

  try {
    const media = await (m.quoted || m).download();
    const mime = (m.quoted?.msg || m.quoted || m).mimetype || '';

    if (!mime.includes('image')) {
      await m.reply('Rispondi a un\'immagine.');
      return;
    }

    const buffer = await processImage(media);
    await conn.updateProfilePicture(conn.user.jid, buffer);
    
    await m.reply('✅ Foto profilo aggiornata!');
  } catch (error) {
    console.error('Errore setppbot:', error.message);
  }
};

handler.help = ['setppbot'];
handler.tags = ['owner'];
handler.command = /^(setpp|setppbot|immagineprofilo)$/i;
handler.owner = true;

export default handler;