//Codice di info-staff.js

//Plugin by Gab, Lucifero & 333 staff






let handler = async (m, { conn }) => {

const text = 
`╭─────────╮\n┃ 𝐈𝐍𝐅𝐎 𝐒𝐓𝐀𝐅𝐅 𝟴𝟴𝟴 𝗕𝗢𝗧
┃
┃ 👑 𝐎𝐖𝐍𝐄𝐑
┃ • The Punisher: wa.me/393206032199
┃
┃ 🔱 𝐂𝐎-𝐎𝐖𝐍𝐄𝐑
┃ • Elixir: wa.me/393784409415
┃━━━━━━━━━━━━━━
┃ 🌐 𝐋𝐈𝐍𝐊 𝐈𝐍𝐒𝐓𝐀𝐆𝐑𝐀𝐌
┃ • The Punisher: https://www.instagram.com/arty.340?igsh=ZGxranlrczNybHJ0
┃ • Elixir: https://instagram.com/eli.xir_ggt.me/ElixirKG
┃━━━━━━━━━━━━━━
┃ 📲 𝐈 𝐍𝐎𝐒𝐓𝐑𝐈 𝐓𝐄𝐋𝐄𝐆𝐑𝐀𝐌
┃ • The Punisher: *@punishth*
┃ • Elixir: *@ElixirKG*
╰─────────╯
`

const mentions = [
'393206032199@s.whatsapp.net',
'393784409415@s.whatsapp.net'
]

await conn.sendMessage(m.chat, {
text,
mentions,
contextInfo: {
externalAdReply: {
title: '𝐒𝐓𝐀𝐅𝐅 𝟴𝟴𝟴 𝗕𝗢𝗧',
body: '𝐞𝐧𝐭𝐫𝐚 𝐧𝐞𝐥 𝐜𝐚𝐧𝐚𝐥𝐞 𝐝𝐢 𝟴𝟴𝟴 𝗕𝗢𝗧!',
sourceUrl: 'https://whatsapp.com/channel/0029Vb7ptH62UPBKFFgByc3C',
mediaType: 1,
renderLargerThumbnail: true
}
}
}, { quoted: m })

m.react('👑')
}

handler.help = ['staff']
handler.tags = ['admin']
handler.command = ['staff']

export default handler
