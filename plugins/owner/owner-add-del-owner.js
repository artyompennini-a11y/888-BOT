import fs from 'fs'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let who
    if (m.isGroup) who = m.mentionedJid ? m.mentionedJid : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null
    else who = m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.chat

    if (!who) return m.reply(`⚠️ Specifica un utente taggandolo, rispondendo al suo messaggio o inserendo il numero.\n\n*Esempi:* \n📌 ${usedPrefix + command} @user\n📌 ${usedPrefix + command} 39333xxxxxxx`)
    
    let path = './owners.json'
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, JSON.stringify([], null, 2))
    }
    
    let data = JSON.parse(fs.readFileSync(path, 'utf-8'))
    let label = who.split('@')

    if (command === 'addowner' || command === 'addproprietario') {
        if (data.includes(who)) return m.reply(`💡 *@${label}* è già nella lista dei proprietari.`, null, { mentions: [who] })

        data.push(who)
        fs.writeFileSync(path, JSON.stringify(data, null, 2))
        await m.reply(`✅ *@${label}* è stato aggiunto ai proprietari con successo e per sempre!`, null, { mentions: [who] })
    }

    if (command === 'delowner' || command === 'delproprietario' || command === 'removeowner') {
        if (!data.includes(who)) return m.reply(`💡 *@${label}* non fa parte dei proprietari.`, null, { mentions: [who] })

        data = data.filter(user => user !== who)
        fs.writeFileSync(path, JSON.stringify(data, null, 2))
        await m.reply(`🗑️ *@${label}* è stato rimosso dalla lista dei proprietari.`, null, { mentions: [who] })
    }
}

handler.help = ['addowner', 'delowner']
handler.tags = ['owner']
handler.command = ['addowner', 'addproprietario', 'delowner', 'delproprietario', 'removeowner']
handler.rowner = true 

export default handler