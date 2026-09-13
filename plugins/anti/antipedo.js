import fetch from 'node-fetch'

const logAdminAction = async (chatId, adminJid, actionKey, amount = 1) => {
if (typeof global.logAdmin?.increment === 'function') {
await global.logAdmin.increment(chatId, adminJid, actionKey, amount)
} else {
global.logAdminQueue = global.logAdminQueue || []
global.logAdminQueue.push({ chatId, adminJid, actionKey, amount })
}
}

async function handler(m, {
isBotAdmin,
text,
conn
}) {

if (!isBotAdmin) {
return m.reply('ⓘ 𝐃𝐞𝐯𝐨 𝐞𝐬𝐬𝐞𝐫𝐞 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫 𝐩𝐨𝐭𝐞𝐫 𝐟𝐮𝐧𝐳𝐢𝐨𝐧𝐚𝐫𝐞')
}

const mention = m.mentionedJid?.[0] || m.quoted?.sender || null

if (!mention) {
return m.reply("ⓘ 𝐌𝐞𝐧𝐳𝐢𝐨𝐧𝐚 𝐥'𝐮𝐭𝐞𝐧𝐭𝐞 𝐝𝐚 𝐫𝐢𝐦𝐮𝐨𝐯𝐞𝐫𝐞")
}

const normalize = jid => jid && conn.decodeJid ? conn.decodeJid(jid) : jid
const target = normalize(mention)
const sender = normalize(m.sender)

if (
target === sender ||
target === normalize(conn.user?.jid || conn.user?.id)
) {
return m.reply("ⓘ 𝐌𝐞𝐧𝐳𝐢𝐨𝐧𝐚 𝐥'𝐮𝐭𝐞𝐧𝐭𝐞 𝐝𝐚 𝐫𝐢𝐦𝐮𝐨𝐯𝐞𝐫𝐞")
}

const groupMetadata =
conn.chats?.[m.chat]?.metadata ||
await conn.groupMetadata(m.chat).catch(() => null)

const participants = groupMetadata?.participants || []

const getParticipantIds = p =>
[p?.id, p?.jid, p?.lid]
.filter(Boolean)
.map(normalize)

const utente = participants.find(u =>
getParticipantIds(u).includes(target)
)

const owner = utente?.admin === 'superadmin'
const admin = utente?.admin === 'admin' || utente?.admin === true

if (owner) {
return m.reply('⚠️ 𝐍𝐨𝐧 𝐩𝐮𝐨𝐢 𝐫𝐢𝐦𝐮𝐨𝐯𝐞𝐫𝐞 𝐢𝐥 𝐜𝐫𝐞𝐚𝐭𝐨𝐫𝐞 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')
}

if (admin) {
return m.reply('⚠️ 𝐍𝐨𝐧 𝐩𝐮𝐨𝐢 𝐫𝐢𝐦𝐮𝐨𝐯𝐞𝐫𝐞 𝐮𝐧 𝐚𝐦𝐦𝐢𝐧𝐢𝐬𝐭𝐫𝐚𝐭𝐨𝐫𝐞.')
}

await conn.sendMessage(m.chat, {
text: `🚨⛓️ *𝐀𝐓𝐓𝐄𝐍𝐙𝐈𝐎𝐍𝐄,  𝐏𝐄𝐃𝐎 𝐀𝐋𝐋'𝐈𝐍𝐓𝐄𝐑𝐍𝐎 𝐃𝐄𝐋𝐋𝐀 𝐂𝐇𝐀𝐓 𝐀𝐕𝐕𝐈𝐒𝐓𝐀𝐓𝐎* ⛓️🚨

@${mention.split('@')[0]}

𝐈𝐥 𝐩𝐞𝐝𝐨 𝐬𝐭𝐚 𝐩𝐞𝐫 𝐞𝐬𝐬𝐞𝐫𝐞 𝐛𝐮𝐭𝐭𝐚𝐭𝐨 𝐟𝐮𝐨𝐫𝐢 𝐝𝐚𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.`,
mentions: [mention]
})

await new Promise(resolve => setTimeout(resolve, 3000))

await conn.groupParticipantsUpdate(m.chat, [mention], 'remove')

await conn.sendMessage(m.chat, {
text: `🛡️ 𝐏𝐄𝐃𝐎 𝐑𝐈𝐌𝐎𝐒𝐒𝐎 𝐂𝐎𝐍 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐎 🛡️

✅ 𝐎𝐫𝐚 𝐥𝐞 𝐫𝐚𝐠𝐚𝐳𝐳𝐞 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨 𝐬𝐨𝐧𝐨 𝐚𝐥 𝐬𝐢𝐜𝐮𝐫𝐨.

👮 𝐀𝐳𝐢𝐨𝐧𝐞 𝐞𝐬𝐞𝐠𝐮𝐢𝐭𝐚 𝐝𝐚 @${m.sender.split('@')[0]}`,
mentions: [m.sender]
})

await logAdminAction(m.chat, m.sender, 'removes')
}

handler.help = ['antipedo @utente']
handler.tags = ['admin']
handler.command = /^antipedo$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
