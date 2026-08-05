let handler = async (m, { conn }) => {
    let staff = `*⋆｡˚✦『 𝐒𝐓𝐀𝐅𝐅 𝟴𝟴𝟴 𝗕𝗢𝗧 』✦˚｡⋆*

*╭───────────────╮*
*│ 🤖 𝐁𝐨𝐭:* ${global.nomebot}
*│ 🆚 𝐕𝐞𝐫𝐬𝐢𝐨𝐧𝐞:* ${global.versione}
*╰───────────────╯*

*╭─── 👑 𝐂𝐑𝐄𝐀𝐓𝐎𝐑𝐄 ───╮*
*│ ✦ 𝐍𝐨𝐦𝐞:* The punisher
*│ ✦ 𝐑𝐮𝐨𝐥𝐨:* Owner / Developer
*│ ✦ 𝐂𝐨𝐧𝐭𝐚𝐭𝐭𝐨:* @573117824583
*│ ✦ 𝐈𝐆:* instagram.com/arty.340
*│ ✦ 𝐓𝐆:* @punishth
*╰────────────────────╯*

*╭─── 🔱 𝐂𝐎-𝐎𝐖𝐍𝐄𝐑 ───╮*
*│ ✦ Elixir*
*│   ├ 𝐑𝐮𝐨𝐥𝐨:* Co-Owner / Developer
*│   ├ 𝐂𝐨𝐧𝐭𝐚𝐭𝐭𝐨:* @639753555926     
*│   ├ 𝐈𝐆:* instagram.com/elixir._regna
*│   └ 𝐓𝐆:* @ElixirKG
*╰────────────────────╯*

*╭─── 🛡️ 𝐒𝐓𝐀𝐅𝐅 ───╮*
*│ ✦ Ghost*
*│   ├ 𝐑𝐮𝐨𝐥𝐨:* Manager
*│   └ 𝐂𝐨𝐧𝐭𝐚𝐭𝐭𝐨:* @212785655331
*│ ✦ Malphas*
*│   ├ 𝐑𝐮𝐨𝐥𝐨:* Manager
*│   └ 𝐂𝐨𝐧𝐭𝐚𝐭𝐭𝐨:*@212656627725
*╰────────────────────╯*

*╭─── 📌 𝐈𝐍𝐅𝐎 𝐔𝐓𝐈𝐋𝐈 ───╮*
*│ ✦ 𝐂𝐚𝐧𝐚𝐥𝐞:* whatsapp.com/channel/0029Vb7NyC67tkj0robcbw24
*╰────────────────────╯*

> *𝟴𝟴𝟴 𝗕𝗢𝗧*`

    await conn.reply(
        m.chat,
        staff.trim(),
        m,
        {
            contextInfo: {
                mentionedJid: [
                    '573117824583@s.whatsapp.net',
                    '639753555926@s.whatsapp.net',  
                    '212785655331@s.whatsapp.net',
                    '212656627725@s.whatsapp.net'
                ]
            }
        }
    )

    await conn.sendMessage(
        m.chat,
        {
            contacts: {
                contacts: [
                    {
                        vcard: `BEGIN:VCARD 
VERSION:3.0
FN:The punisher
ORG:𝟴𝟴𝟴 𝗕𝗢𝗧 - Owner / Dev
TEL;type=CELL;type=VOICE;waid=573117824583:+573117824583
END:VCARD`
                    },
                    {
                        vcard: `BEGIN:VCARD
VERSION:3.0
FN:Megamind
ORG:𝟴𝟴𝟴 𝗕𝗢𝗧 - Co-Owner / Dev
TEL;type=CELL;type=VOICE;waid=639753555926:+639753555926
END:VCARD`
                    },
                    {
                        vcard: `BEGIN:VCARD
VERSION:3.0
FN:Ghost
ORG:𝟴𝟴𝟴 𝗕𝗢𝗧 - Manager
TEL;type=CELL;type=VOICE;waid=212785655331:+212785655331
END:VCARD`
                    },
                    {
                        vcard: `BEGIN:VCARD
VERSION:3.0
FN:Malphas
ORG:𝟴𝟴𝟴 𝗕𝗢𝗧 - Manager
TEL;type=CELL;type=VOICE;waid=212656627725:+212656627725
END:VCARD`
                    }
                ]
            }
        },
        { quoted: m }
    )

    m.react('👑')
}

handler.help = ['staff']
handler.tags = ['main']
handler.command = ['staff']

export default handler
