import yts from 'yt-search';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`⚡ *𝟴𝟴𝟴 𝗕𝗢𝗧*\n\n💡 _Scrivi:_ ${usedPrefix + command} nome canzone`);

  try {
    const search = await yts(text);
    const vid = search.videos[0];
    if (!vid) return m.reply('⚠️ *𝗥𝗶𝘀𝘂𝗹𝘁𝗮𝘁𝗼 𝗻𝗼𝗻 𝘁𝗿𝗼𝘃𝗮𝘁𝗼.*');

    const url = vid.url;

    // Struttura originale dei pulsanti mantenuta intatta
    if (command === 'play') {
        let infoMsg = `┏━━━━━━━━━━━━━━━━━━━┓\n` +
                      `   🎧  *𝙋𝙡𝙖𝙮 𝟴𝟴𝟴 𝗕𝗢𝗧* 🎧\n` +
                      `┗━━━━━━━━━━━━━━━━━━━┛\n\n` +
                      `◈ 📌 *𝗧𝗶𝘁𝗼𝗹𝗼:* ${vid.title}\n` +
                      `◈ ⏱️ *𝗗𝘂𝗿𝗮𝘁𝗮:* ${vid.timestamp}\n\n` +
                      `*𝗦𝗲𝗹𝗲𝘇𝗶𝗼𝗻𝗮 𝗶λ 𝗳𝗼𝗿𝗺𝗮𝘁𝗼:*`;

        return await conn.sendMessage(m.chat, {
            image: { url: vid.thumbnail },
            caption: infoMsg,
            footer: '\n𝟴𝟴𝟴 𝗕𝗢𝗧',
            buttons: [
                { buttonId: `${usedPrefix}playaud ${url}`, buttonText: { displayText: '🎵 𝗔𝗨𝗗𝗜𝗢 (𝗠𝗣𝟯)' }, type: 1 },
                { buttonId: `${usedPrefix}playvid ${url}`, buttonText: { displayText: '🎬 𝗩𝗜𝗗𝗘𝗢 (𝗠𝗣𝟰)' }, type: 1 }
            ],
            headerType: 4
        }, { quoted: m });
    }

    await conn.sendMessage(m.chat, { react: { text: "🎵", key: m.key } });

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
            caption: `✅ *𝐒𝐜𝐚𝐫𝐢𝐜𝐚𝐭𝐨 𝐝𝐚 𝟴𝟴𝟴 𝗕𝗢𝗧*`
        }, { quoted: m });
    }

    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

  } catch (e) {
    console.error("Handler Error:", e.message);
    m.reply('🚀 *𝙋𝙡𝙖𝙮 𝙀𝙧𝙧or:* Impossibile elaborare la richiesta in questo momento. Riprova.');
  }
};

handler.help = ['play'];
handler.tags = ['downloader'];
handler.command = /^(play|playaud|playvid)$/i;

export default handler;
