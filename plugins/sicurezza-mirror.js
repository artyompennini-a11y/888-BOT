// Plugin by Elixir, Punisher & 888 staff

let handler = async (m, { conn, command, args }) => {
    if (!global.db.data.mirrors) global.db.data.mirrors = {}

    if (command === 'mirror') {
        const name = args[0]?.trim()
        if (!name) {
            return conn.sendMessage(m.chat, { text: '⚠️ Specifica un nome per il salvataggio. Esempio: .mirror lunars' }, { quoted: m })
        }

        const metadata = await conn.groupMetadata(m.chat)
        let ppUrl = ''
        try {
            ppUrl = await conn.profilePictureUrl(m.chat, 'image')
        } catch (e) {
            ppUrl = ''
        }

        const settings = {
            announce: metadata.announce || false,
            restrict: metadata.restrict || false
        }

        const members = metadata.participants.map(p => conn.decodeJid(p.id))

        global.db.data.mirrors[name] = {
            subject: metadata.subject,
            desc: metadata.desc || '',
            ppUrl: ppUrl,
            settings,
            members
        }
        if (typeof global.markDbDirty === 'function') global.markDbDirty()

        return conn.sendMessage(m.chat, { text: `✅ Backup del gruppo salvato nel database sotto il nome: ${name}` }, { quoted: m })
    }

    if (command === 'clonagruppo') {
        const name = args[0]?.trim()
        if (!name) {
            return conn.sendMessage(m.chat, { text: '⚠️ Specifica il nome del backup da ripristinare. Esempio: .clonagruppo lunars' }, { quoted: m })
        }

        const backup = global.db.data.mirrors[name]
        if (!backup) {
            return conn.sendMessage(m.chat, { text: `❌ Nessun backup trovato con il nome: ${name}` }, { quoted: m })
        }

        if (backup.subject) {
            await conn.groupUpdateSubject(m.chat, backup.subject)
        }

        if (backup.desc) {
            await conn.groupUpdateDescription(m.chat, backup.desc)
        }

        if (backup.settings) {
            if (backup.settings.announce) {
                await conn.groupSettingUpdate(m.chat, 'announcement').catch(() => {})
            } else {
                await conn.groupSettingUpdate(m.chat, 'not_announcement').catch(() => {})
            }
            if (backup.settings.restrict) {
                await conn.groupSettingUpdate(m.chat, 'locked').catch(() => {})
            } else {
                await conn.groupSettingUpdate(m.chat, 'unlocked').catch(() => {})
            }
        }

        if (backup.ppUrl) {
            try {
                const res = await fetch(backup.ppUrl)
                const buffer = Buffer.from(await res.arrayBuffer())
                await conn.updateProfilePicture(m.chat, buffer)
            } catch (e) {}
        }

        const contacts = (backup.members || []).map(jid => {
            const num = jid.split('@')[0]
            return {
                displayName: `Ex Membro +${num}`,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Ex Membro +${num}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`
            }
        })

        if (contacts.length > 0) {
            await conn.sendMessage(m.chat, {
                contacts: {
                    displayName: `${contacts.length} Membri Salvati da 888 BOT`,
                    contacts
                }
            }, { quoted: m })
        }

        return conn.sendMessage(m.chat, { text: `✅ Gruppo clonato con successo dal backup: ${name}` }, { quoted: m })
    }
}

handler.help = ['mirror <nome>', 'clonagruppo <nome>']
handler.tags = ['owner']
handler.command = /^(mirror|clonagruppo)$/i
handler.group = true
handler.rowner = true

export default handler
