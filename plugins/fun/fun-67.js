//Plugin by Elixir
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let handler = async (m, { conn }) => {
    // Numero casuale da 1 a 6
    const num = Math.floor(Math.random() * 6) + 1;

    // Cerca direttamente nella cartella media/
    const gifPath = path.join('media', `sixseven${num}.gif`);

    if (!fs.existsSync(gifPath)) {
        return m.reply(`⚠️ Errore: Il file sixseven${num}.gif non è stato trovato nella cartella media`);
    }

    const tempMp4 = `temp67_${Date.now()}.mp4`;
    const caption = "🕺 *67! 67! 67!* 🕺";

    try {
        // Conversione GIF → MP4
        await execAsync(
            `ffmpeg -i "${gifPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${tempMp4}"`
        );

        await conn.sendMessage(m.chat, {
            video: { url: tempMp4 },
            caption,
            gifPlayback: true
        }, { quoted: m });

        // Elimina il file temporaneo
        if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4);

    } catch (error) {
        console.error(error);
        m.reply("⚠️ Errore durante la conversione della GIF.");
    }
};

handler.help = ['sixseven', '67'];
handler.tags = ['fun'];
handler.command = /^(sixseven|67)$/i;

export default handler;

