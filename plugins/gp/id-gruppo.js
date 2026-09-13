// Plugin by Elixir, Punisher & 888 Staff
let handler = async (m, { conn }) => {
    let groupId = m.chat
    await conn.reply(m.chat, `*ID di questo gruppo:* \n\`${groupId}\``, m)
}

handler.command = ['id', 'idgruppo', 'jid']

export default handler
