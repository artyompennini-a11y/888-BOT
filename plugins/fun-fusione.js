import Jimp from 'jimp-compact';

let handler = async (m, { conn }) => {

  let users = m.mentionedJid || [];
  if (users.length < 2)
    return m.reply("Tagga 2 persone");

  let [u1, u2] = users;

  let img1 = await conn.profilePictureUrl(u1, 'image').catch(_ => null);
  let img2 = await conn.profilePictureUrl(u2, 'image').catch(_ => null);

  if (!img1 || !img2)
    return m.reply("❌ Errore immagini");

  // LETTURA IMMAGINI CORRETTA
  let a = await Jimp.read(img1);
  let b = await Jimp.read(img2);

  a.resize(256, 256);
  b.resize(256, 256);

  // CREAZIONE CANVAS CORRETTA
  let fused = new Jimp(256, 256);

  for (let x = 0; x < 256; x++) {
    let ratio = x / 256;

    for (let y = 0; y < 256; y++) {

      let p1 = Jimp.intToRGBA(a.getPixelColor(x, y));
      let p2 = Jimp.intToRGBA(b.getPixelColor(x, y));

      let r = p1.r * (1 - ratio) + p2.r * ratio;
      let g = p1.g * (1 - ratio) + p2.g * ratio;
      let bcol = p1.b * (1 - ratio) + p2.b * ratio;

      let color = Jimp.rgbaToInt(r, g, bcol, 255);
      fused.setPixelColor(color, x, y);
    }
  }

  fused.blur(1).contrast(0.2);

  let buffer = await fused.getBufferAsync(Jimp.MIME_PNG);

  await conn.sendMessage(m.chat, {
    image: buffer,
    caption: `🧬 *FUSIONE REALE*`,
    mentions: [u1, u2]
  });
};

handler.command = ['fusione'];
handler.group = true;

export default handler;