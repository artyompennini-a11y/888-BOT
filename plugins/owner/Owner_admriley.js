let handler = async (m, { conn, isOwner }) =>  
  if (!isOwner) return 

  ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender

  try {
    await conn.groupParticipantsUpdate(m.chat, [who], 'promote')
   
    await conn.sendMessage(m.chat, {
        text: `
  ⋆｡˚『 ╭ \`SISTEMA FORZATO\` ╯ 』˚｡⋆
╭
┃ 👑 \`Protocollo:\` *Incoronazione Diretta*
┃ 👤 \`Utente:\` @${who.split('@')[0]}
┃
┃ ➤  \`Permessi Admin concessi dal Creatore.\`
╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒`,
        contextInfo: { 
            mentionedJid: [who],
            externalAdReply: {
                title: 'ʀɪʟᴇʏ ʙʏ ᴘᴀss',
                body: 'Elevazione privilegi in corso...',
                thumbnailUrl: 'https://qu.ax/TfUj.jpg', 
                sourceUrl: '888Bot',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })

  } catch (e) {
    
    conn.reply(m.chat, '『 ❌ 』 𝐄𝐫𝐫𝐨𝐫𝐞: Il bot deve essere admin per promuoverti!', m)
  }
}

handler.help = ['riley']
handler.tags = ['owner']
handler.command = /^(riley)$/i

handler.group = true
handler.rowner = true 
export default handler