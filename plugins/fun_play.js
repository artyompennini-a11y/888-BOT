import yts from 'yt-search';
import fg from 'api-dylux';
import fetch from 'node-fetch';
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

    if (command === 'play') {
        let infoMsg = `┏━━━━━━━━━━━━━━━━━━━┓\n` +
                      `  🎧 *𝟴𝟴𝟴 𝗕𝗢𝗧 𝗣𝗟𝗔𝗬𝗘𝗥* 🎧\n` +
                      `┗━━━━━━━━━━━━━━━━━━━┛\n\n` +
                      `◈ 📌 *𝗧𝗶𝘁𝗼𝗹𝗼:* ${vid.title}\n` +
                      `◈ ⏱️ *𝗗𝘂𝗿𝗮𝘁𝗮:* ${vid.timestamp}\n\n` +
                      `*𝗦𝗲𝗹𝗲𝘇𝗶𝗼𝗻𝗮 𝗶𝗹 𝗳𝗼𝗿𝗺𝗮𝘁𝗼:*`;

        return await conn.sendMessage(m.chat, {
            image: { url: vid.thumbnail },
            caption: infoMsg,
            footer: '\n 𝟴𝟴𝟴 𝗕𝗢𝗧',
            buttons: [
                { buttonId: `${usedPrefix}playaud ${url}`, buttonText: { displayText: '🎵 𝗔𝗨𝗗𝗜𝗢 (𝗠🇵𝟯)' }, type: 1 },
                { buttonId: `${usedPrefix}playvid ${url}`, buttonText: { displayText: '🎬 𝗩𝗜𝗗𝗘𝗢 (𝗠🇵𝟰)' }, type: 1 }
            ],
            headerType: 4
        }, { quoted: m });
    }

    await conn.sendMessage(m.chat, { react: { text: "🎵", key: m.key } });

    let downloadUrl = null;
    const isAudio = command === 'playaud';
    
    try {
        let res = isAudio ? await fg.yta(url) : await fg.ytv(url);
        if (res && res.dl_url) downloadUrl = res.dl_url;
    } catch (e) { console.log("Dylux API failed"); }

    if (!downloadUrl) {
        try {
            let apiType = isAudio ? 'youtube-mp3' : 'youtube-mp4';
            let res = await fetch(`https://vreden.my.id{apiType}?url=${encodeURIComponent(url)}`);
            let json = await res.json();
            downloadUrl = json.result?.download?.url || json.result?.url || json.result?.downloadUrl;
        } catch (e) { console.log("Vreden API failed:", e.message); }
    }

    if (!downloadUrl) {
        throw new Error('APIs failed to provide a download URL');
    }

    const tmpDir = os.tmpdir();
    const fileName = `file_${Date.now()}`;
    const inputPath = path.join(tmpDir, `${fileName}.${isAudio ? 'mp3' : 'mp4'}`);
    const outputPath = path.join(tmpDir, `${fileName}.${isAudio ? 'mp3' : 'mp4'}`);

    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(inputPath, Buffer.from(arrayBuffer));

    if (isAudio) {
        const voicePath = path.join(tmpDir, `${fileName}.ogg`);

        await new Promise((resolve, reject) => {
            exec(
                `ffmpeg -hide_banner -loglevel error -y -i "${inputPath}" -map_metadata -1 -vn -ar 48000 -ac 1 -c:a libopus -b:a 64k -application voip -f ogg "${voicePath}"`,
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
            video: fs.readFileSync(inputPath),
            mimetype: 'video/mp4',
            caption: `✅ *𝐒𝐜𝐚𝐫𝐢𝐜𝐚𝐭𝐨 𝐝𝐚 𝟴𝟴𝟴 𝗕𝗢𝗧*`
        }, { quoted: m });
    }

    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

  } catch (e) {
    console.error("Handler Error:", e.message);
    m.reply('🚀 *𝙋𝙡𝙖𝙮 𝙀𝙧𝙧𝙤rer:* Al momento i server di download sono sovraccarichi o offline. Riprova tra poco.');
  }
};

handler.help = ['play'];
handler.tags = ['downloader'];
handler.command = /^(play|playaud|playvid)$/i;

export default handler;
