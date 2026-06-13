import fetch from 'node-fetch'

let handler = async (m, { conn, text, command }) => {
    let newText = text || m.quoted?.text;
    if (!newText) return m.reply('📝 *Uso:*\n- .brat <testo>\n- .bratvid <testo>\n💡 *Esempio:* .brat Hello World\n\nPuoi anche rispondere a un messaggio per usare il suo testo.');
    
    try {
        await m.react('⏳'); // Feedback visivo di caricamento
        
        const isVideo = command.includes('vid');
        const url = isVideo
            ? `https://skyzxu-brat.hf.space/brat-animated?text=${encodeURIComponent(newText)}`
            : `https://skyzxu-brat.hf.space/brat?text=${encodeURIComponent(newText)}`;
            
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Errore API: ${response.status}`);
        
        const contentType = response.headers.get('content-type');
        const buffer = await response.arrayBuffer();
        const mediaBuffer = Buffer.from(buffer);
        
        if (isVideo) {
            const isVideoType = contentType?.includes('video') || contentType?.includes('mp4');
            const isGif = contentType?.includes('gif');
            
            if (isVideoType || isGif) {
                // Genera lo sticker animato direttamente dal video/gif generato
                await conn.sendMessage(m.chat, {
                    sticker: mediaBuffer,
                    contextInfo: global.fake?.contextInfo
                }, { quoted: m });
            } else {
                // Fallback a documento se il formato non è supportato
                await conn.sendMessage(m.chat, {
                    document: mediaBuffer,
                    caption: `"${newText}"`,
                    mimetype: contentType || 'application/octet-stream',
                    fileName: `brat_${Date.now()}.${contentType?.split('/')[1] || 'bin'}`,
                    contextInfo: global.fake?.contextInfo
                }, { quoted: m });
            }
        } else {
            const isImage = contentType?.includes('image');
            if (isImage) {
                // Genera lo sticker statico direttamente dall'immagine generata
                await conn.sendMessage(m.chat, {
                    sticker: mediaBuffer,
                    contextInfo: global.fake?.contextInfo
                }, { quoted: m });
            } else {
                // Fallback a documento se il formato non è un'immagine valida
                await conn.sendMessage(m.chat, {
                    document: mediaBuffer,
                    caption: `"${newText}"`,
                    mimetype: contentType || 'application/octet-stream',
                    fileName: `brat_${Date.now()}.${contentType?.split('/')[1] || 'bin'}`,
                    contextInfo: global.fake?.contextInfo
                }, { quoted: m });
            }
        }
        await m.react('✅');
    } catch (error) {
        await m.react('❌');
        m.reply(`${global.errore}\n\n${error.message}`);
    }
}

handler.help = ['brat <testo>', 'bratvid <testo>']
handler.tags = ['strumenti']
handler.command = /^brat(vid(eo)?)?$/i
handler.register = false

export default handler
