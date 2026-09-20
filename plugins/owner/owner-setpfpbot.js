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
    try {
      return m.reply('⚠️ Non hai il permesso di usare questo comando!');
    } catch (error) {
      console.error('Errore reply:', error.message);
    }
  }

  const media = await (m.quoted || m).download();
  const mime = (m.quoted?.msg || m.quoted || m).mimetype || '';

  if (!mime.includes('image')) {
    try {
      return m.reply('Rispondi a un\'immagine.');
    } catch (error) {
      console.error('Errore reply:', error.message);
    }
  }

  try {
    const buffer = await processImage(media);

    if (args[0] === '--full') {
      await conn.query({
        tag: 'iq',
        attrs: {
          to: conn.user.jid,
          type: 'set',
          xmlns: 'w:profile:picture'
        },
        content: [{
          tag: 'picture',
          attrs: { type: 'image' },
          content: buffer
        }]
      });
    } else {
      await conn.updateProfilePicture(conn.user.jid, buffer);
    }

    try {
      m.reply('✅ Foto profilo cambiata con successo!');
    } catch (error) {
      console.error('Errore reply:', error.message);
    }
  } catch (error) {
    console.error('Errore:', error.message);
    try {
      m.reply('❌ Errore durante l\'aggiornamento della foto profilo.');
    } catch (replyError) {
      console.error('Errore reply:', replyError.message);
    }
  }
};

handler.help = ['setppbot'];
handler.tags = ['owner'];
handler.command = /^(setpp|setppbot|immagineprofilo)$/i;
handler.owner = true;

export default handler;