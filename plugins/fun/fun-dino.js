import fs from 'fs';
import path from 'path';

let handler = async (m, { conn }) => {
    const from = m.chat;

    const filePath = path.join(process.cwd(), 'index.html');

    if (!fs.existsSync(filePath)) {
        return conn.sendMessage(from, { 
            text: "⚠️ Il file *index.html* non è stato trovato nella cartella principale del bot!" 
        }, { quoted: m });
    }

    const htmlBuffer = fs.readFileSync(filePath);

    await conn.sendMessage(from, {
        document: htmlBuffer,
        mimetype: 'text/html',
        fileName: 'DinoRunner.html',
        caption: "🦖 *DINO RUNNER*\n\nClicca il tasto sotto per aprire il gioco!",
        cards: [
            {
                image: { url: 'media/menu/dino.jpeg' },
                title: "🦖 Dino Runner",
                body: "Apri il gioco direttamente dal file HTML!",
                footer: "𝟠𝟠𝟠𝙱𝙾𝚃",
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '▶️ Apri DinoRunner.html',
                            url: 'https://github.com/artyompennini-a11y/888dinorunhtml/blob/main/index.html'
                        })
                    }
                ]
            }
        ]
    }, { quoted: m });
};

handler.help = ['dino'];
handler.tags = ['fun', 'games'];
handler.command = /^(dino)$/i;

export default handler;

