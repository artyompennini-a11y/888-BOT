//Plugin by Elixir, Punisher & 888 staff

let handler = async (m, { conn }) => {
  return await conn.reply(m.chat, `ᵋᵘᵠᵒʳᶦᵃ`, m)
}

handler.help = ['euphoria']
handler.tags = ['euphoria', 'tools']
handler.command = ['euphoria']

export default handler