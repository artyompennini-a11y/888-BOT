import Jimp from 'jimp';
import fs from 'fs';

let handler = async (m, { conn }) => {

    let who = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;

    // Leggi immagine bonk
    const img = await Jimp.read('./icone/bonk.png');

    // Avatar utente
    let avatar;
    try {
        const url = await conn.profilePictureUrl(who, 'image');
        avatar = await Jimp.read(url);
    } catch {
        avatar = await Jimp.read('./icone/default.png');
    }

    avatar.resize(128, 128);

    const bonk = await img
        .composite(avatar, 120, 90)
        .getBufferAsync('image/png');

    await conn.sendMessage(m.chat, { image: bonk }, { quoted: m });
};

handler.command = /^(bonk)$/i;
handler.group = true;

export default handler;
