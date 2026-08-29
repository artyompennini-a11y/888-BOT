//Plugin by Elixir
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let handler = async (m, { conn }) => {
    // Sceglie un numero casuale da 1 a 6
    const num = Math.floor(Math.random() * 6) + 1;
    
    // Costruisce il percorso locale verso la tua cartella media/SixSeven/
    // process.cwd() è la cartella principale del tuo bot
    let gifPath = path.join(process.cwd(), `media/SixSeven/sixseven${num}.gif`);
    
    // Controlla se il file esiste davvero per evitare crash
    if (!fs.existsSync(gifPath)) {
        return m.reply(`⚠️ Errore: Il file sixseven${num}.gif non è stato trovato in media/SixSeven/`);
    }

    const tempMp4 = path.join(process.cwd(), `temp67_${Date.now()}.mp4`);
    const caption = "🕺 *67! 67! 67!* 🕺";

    try {
        // Converte la GIF locale in MP4 per l'effetto loop di WhatsApp
        // Usiamo ffmpeg perché WhatsApp non accetta GIF pesanti direttamente dai bot
        await execAsync(`ffmpeg -i "${gifPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${tempMp4}"`);

        await conn.sendMessage(m.chat, {
            video: { url: tempMp4 },
            caption: caption,
            gifPlayback: true 
        }, { quoted: m });

        // Elimina solo il file MP4 temporaneo creato
        if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4);

    } catch (error) {
        console.error(error);
        m.reply("⚠️ Errore durante la conversione della GIF.");
    }
}

handler.help = ['sixseven', '67'];
handler.tags = ['fun'];
handler.command = /^(sixseven|67)$/i; // Risponde a .sixseven o .67

export default handler;
