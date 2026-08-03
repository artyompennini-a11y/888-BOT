import yts from 'yt-search';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`╭───〔 𝟴𝟴𝟴 𝗕𝗢𝗧 〕───╮\n│\n│ 💡 *Uso corretto:* \n│ ${usedPrefix + command} <nome canzone>\n│\n╰───────────────────╯`);

  try {
    const search = await yts(text);
    const vid = search.videos[0];
    if (!vid) return m.reply('❌ *Nessun risultato trovato per la ricerca.*');

    const url = vid.url;

    // Struttura dei pulsanti e logica mantenuta intatta con nuova grafica
    if (command === 'play') {
        let infoMsg = `─── 𝟴𝟴𝟴 𝗣𝗟𝗔𝗬𝗘𝗥 ───\n\n` +
                      `🎵 *Titolo:* ${vid.title}\n` +
                      `⏱️ *Durata:* ${vid.timestamp}\n` +
                      `👤 *Canale:* ${vid.author.name}\n` +
                      `👁️ *Visualizzazioni:* ${vid.views.toLocaleString()}\n\n` +
                      `👇 *Scegli il formato da scaricare:*`;

        return await conn.sendMessage(m.chat, {
            image: { url: vid.thumbnail },
            caption: infoMsg,
            footer: '𝟴𝟴𝟴 𝗕𝗢𝗧 • Downloader',
            buttons: [
                { buttonId: `${usedPrefix}playaud ${url}`, buttonText: { displayText: '🎧 Audio (MP3)' }, type: 1 },
                { buttonId: `${usedPrefix}playvid ${url}`, buttonText: { displayText: '📹 Video (MP4)' }, type: 1 }
            ],
            headerType: 4
        }, { quoted: m });
    }

    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

    const isAudio = command === 'playaud';
    const tmpDir = os.tmpdir();
    const fileName = `file_${Date.now()}`;
    const outputPath = path.join(tmpDir, `${fileName}.${isAudio ? 'mp3' : 'mp4'}`);

    // Downloader locale basato su yt-dlp: nessuna API esterna richiesta
    await new Promise((resolve, reject) => {
        let cmd = isAudio 
            ? `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${url}"`
            : `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${outputPath}" "${url}"`;

        exec(cmd, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    if (!fs.existsSync(outputPath)) {
        throw new Error('Il download locale con yt-dlp è fallito.');
    }

    if (isAudio) {
        const voicePath = path.join(tmpDir, `${fileName}.ogg`);

        await new Promise((resolve, reject) => {
            exec(
                `ffmpeg -hide_banner -loglevel error -y -i "${outputPath}" -map_metadata -1 -vn -ar 48000 -ac 1 -c:a libopus -b:a 64k -application voip -f ogg "${voicePath}"`,
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        await conn.sendMessage(m.chat, {
            audio: fs.readFileSync(voicePath),
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: m });

        if (fs.existsSync(voicePath)) fs.unlinkSync(voicePath);

    } else {
        await conn.sendMessage(m.chat, {
            video: fs.readFileSync(outputPath),
            mimetype: 'video/mp4',
            caption: `✨ *Completato da 𝟴𝟴𝟴 𝗕𝗢𝗧*`
        }, { quoted: m });
    }

    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

  } catch (e) {
    console.error("Handler Error:", e.message);
    m.reply('⚠️ *Errore:* Impossibile completare il download. Riprova più tardi.');
  }
};

handler.help = ['play'];
handler.tags = ['downloader'];
handler.command = /^(play|playaud|playvid)$/i;

export default handler;