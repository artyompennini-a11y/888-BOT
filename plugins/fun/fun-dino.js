import fs from 'fs';
import path from 'path';

let handler = async (m, { conn }) => {
    const from = m.chat;

    // Percorso del file index.html (deve trovarsi nella stessa cartella del plugin o nella radice del bot)
    const filePath = path.join(process.cwd(), 'index.html');

    // Verifica se il file index.html esiste
    if (!fs.existsSync(filePath)) {
        return conn.sendMessage(from, { 
            text: "⚠️ Il file *index.html* non è stato trovato nella cartella principale del bot!" 
        }, { quoted: m });
    }

    // Legge il file HTML
    const htmlBuffer = fs.readFileSync(filePath);

    // Invio del file index.html come documento eseguibile/scaricabile
    await conn.sendMessage(from, {
        document: htmlBuffer,
        mimetype: 'text/html',
        fileName: 'DinoRunner.html',
        caption: "🦖 *DINO RUNNER*\n\nApri il file nel browser per giocare!"
    }, { quoted: m });
};

handler.help = ['dino'];
handler.tags = ['fun', 'games'];
handler.command = /^(dino)$/i;

export default handler;
