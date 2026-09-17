import yts from 'yt-search';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let outputPath;
  let voicePath;
  if (!text) return m.reply(`╭───〔 𝟴𝟴𝟴 𝗕𝗢𝗧 〕───╮\n│\n│ 💡 *Uso corretto:* \n│ ${usedPrefix + command} <nome canzone>\n│\n╰───────────────────╯`);

  try {
    const isDownloadCommand = command === 'playaud' || command === 'playvid';
    const directUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(text.trim())
      ? text.trim()
      : null;
    const search = directUrl ? null : await yts(text);
    const vid = directUrl ? { url: directUrl, title: directUrl, timestamp: '', author: { name: '' }, views: 0 } : search?.videos?.[0];
    if (!vid) return m.reply('❌ *Nessun risultato trovato per la ricerca.*');

    const url = vid.url;

    if (!isDownloadCommand) {
      let infoMsg =
        `─── 𝟴𝟴𝟴 𝗣𝗟𝗔𝗬𝗘𝗥 ───\n\n` +
        `🎵 *Titolo:* ${vid.title}\n` +
        `⏱️ *Durata:* ${vid.timestamp}\n` +
        `👤 *Canale:* ${vid.author.name}\n` +
        `👁️ *Visualizzazioni:* ${vid.views.toLocaleString()}\n\n` +
        `👇 *Scegli il formato:*`;

      const buttonParamsJson = JSON.stringify({
        title: "Scegli formato",
        sections: [
          {
            title: "Download",
            rows: [
              { id: `${usedPrefix}playaud ${url}`, title: "🎧 MP3", description: "Scarica audio" },
              { id: `${usedPrefix}playvid ${url}`, title: "📹 MP4", description: "Scarica video" }
            ]
          }
        ]
      });

      return await conn.sendMessage(
        m.chat,
        {
          image: { url: vid.thumbnail },
          caption: infoMsg,
          footer: "𝟴𝟴𝟴 𝗕𝗢𝗧 • Downloader",
          interactiveButtons: [
            {
              name: "single_select",
              buttonParamsJson
            }
          ]
        },
        { quoted: m }
      );
    }

    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

    const isAudio = command === 'playaud';
    const tmpDir = os.tmpdir();
    const fileName = `file_${Date.now()}`;
    outputPath = path.join(tmpDir, `${fileName}.${isAudio ? 'mp3' : 'mp4'}`);

    await new Promise((resolve, reject) => {
      let cmd = isAudio
        ? `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${url}"`
        : `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${outputPath}" "${url}"`;

      exec(cmd, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!fs.existsSync(outputPath)) throw new Error('Download fallito.');

    if (isAudio) {
      voicePath = path.join(tmpDir, `${fileName}.ogg`);

      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -hide_banner -loglevel error -y -i "${outputPath}" -map_metadata -1 -vn -ar 48000 -ac 1 -c:a libopus -b:a 64k -application voip -f ogg "${voicePath}"`,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      await conn.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(voicePath),
          mimetype: "audio/ogg; codecs=opus",
          ptt: true
        },
        { quoted: m }
      );

      if (fs.existsSync(voicePath)) fs.unlinkSync(voicePath);
    } else {
      await conn.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(outputPath),
          mimetype: "video/mp4",
          caption: `✨ *Completato da 𝟴𝟴𝟴 𝗕𝗢𝗧*`
        },
        { quoted: m }
      );
    }

    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

  } catch (e) {
    console.error("Handler Error:", e.message);
    const message = /not found|is not recognized/i.test(e.message)
      ? '⚠️ *Errore:* Installa yt-dlp e ffmpeg, poi riprova.'
      : '⚠️ *Errore:* Impossibile completare il download.';
    m.reply(message);
  } finally {
    for (const file of [outputPath, voicePath]) {
      if (file && fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
};

handler.help = ['play'];
handler.tags = ['downloader'];
handler.command = /^(play|playaud|playvid)$/i;

export default handler;
