let handler = async (m, { conn, text, command, usedPrefix, args }) => {

    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
    if (!global.db.data.chats[m.chat].whitelist) global.db.data.chats[m.chat].whitelist = []

    let chat = global.db.data.chats[m.chat]
    let who;

    if (command === 'whitelist' && (!args || args.length === 0 || (args.length === 1 && args[0] === 'list'))) {
        let list = chat.whitelist.map(jid => `┃  ⮕ @${jid.split('@')[0]}`).join('\n')
        let caption = `╭━━━〔 📑 *WHITELIST GRUPPO* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Stato:* Utenti Autorizzati
┃━━━━━━━━━━━━━━━━━━
${list ? list : '┃  ⚠️ _Nessun utente autorizzato in questo gruppo._'}
╰━━━━━━━━━━━━━━━━━━┈`.trim()
        return m.reply(caption, null, { mentions: conn.parseMention(list) })
    }

    let action = null
    if (command === 'whitelist' && args && args.length >= 2) {
        action = args[0].toLowerCase()

        let targetText = args.slice(1).join(' ')
        who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : targetText ? targetText.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false
    } else if (command === 'addwhitelist') {
        action = 'add'
        who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false
    } else if (command === 'delwhitelist') {
        action = 'remove'
        who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false
    }

    if (!who) return m.reply(`⚠️ *Uso corretto:* _${usedPrefix}whitelist add @tag_ o _${usedPrefix}addwhitelist @tag_`)

    if (action === 'add' || command === 'addwhitelist') {
        if (chat.whitelist.includes(who)) return m.reply('✨ _L\'utente è già presente nella whitelist di questo gruppo._')
        chat.whitelist.push(who)
        await global.db.write()
        await conn.sendMessage(m.chat, {
            text: `╭━━━〔 ✅ *UTENTE AUTORIZZATO* 〕━━━┈
┃ 👤 *Utente:* @${who.split('@')[0]}
┃ 🏰 *Ambito:* Questo Gruppo
┃━━━━━━━━━━━━━━━━━━
┃ ⮕ _L'utente è ora esente dai controlli Antinuke._
╰━━━━━━━━━━━━━━━━━━┈`,
            contextInfo: { mentionedJid: [who] }
        }, { quoted: m })
        return
    }

    if (action === 'remove' || command === 'delwhitelist') {
        if (!chat.whitelist.includes(who)) return m.reply('❌ _L\'utente non è presente nella whitelist di questo gruppo._')
        chat.whitelist = chat.whitelist.filter(jid => jid !== who)
        await global.db.write()
        
        await conn.sendMessage(m.chat, {
            text: `╭━━━〔 🗑️ *UTENTE RIMOSSO* 〕━━━┈
┃ 👤 *Utente:* @${who.split('@')[0]}
┃ 🏰 *Ambito:* Questo Gruppo
┃━━━━━━━━━━━━━━━━━━
┃ ⮕ _L'utente è stato rimosso dalla whitelist locale._
╰━━━━━━━━━━━━━━━━━━┈`,
            contextInfo: { mentionedJid: [who] }
        }, { quoted: m })
        return
    }
}

handler.help = ['addwhitelist', 'delwhitelist', 'whitelist']
handler.tags = ['owner', 'group']
handler.command = /^(addwhitelist|delwhitelist|whitelist)$/i
handler.admin = true
handler.group = true

export default handler
