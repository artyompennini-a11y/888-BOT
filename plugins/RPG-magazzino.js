async function handler(m, { conn }) {

  const users = global.db.data.users
  const user = users[m.sender] || (users[m.sender] = {})

  user.magazzino = user.magazzino || []

  // ───────────────────────────────
  // 🔥 MAGAZZINO VUOTO — 888
  // ───────────────────────────────
  if (user.magazzino.length === 0) {
    return conn.sendMessage(m.chat, { 
      text:
`╭━━━〔 📦 *MAGAZZINO 888* 〕━━━┈
┃ Il tuo magazzino è attualmente vuoto.
┃ Nessuna merce disponibile.
╰━━━━━━━━━━━━━━━━━━┈`
    }, { quoted: m })
  }

  // ───────────────────────────────
  // 🔥 LISTA MERCE — 888
  // ───────────────────────────────
  let testo =
`╭━━━〔 📦 *MAGAZZINO 888* 〕━━━┈
┃ Merce disponibile:
┃━━━━━━━━━━━━━━━━━━`

  user.magazzino.forEach((item, index) => {
    testo += `
┃ ${index + 1}. *${item.nome}* ×${item.quantità}
┃ 💰 Valore unitario: *${item.valore}€*
┃━━━━━━━━━━━━━━━━━━`
  })

  testo += `
┃ Usa il comando *vendì* per vendere tutta la merce.
╰━━━━━━━━━━━━━━━━━━┈`

  conn.sendMessage(m.chat, { text: testo }, { quoted: m })
}

handler.command = /^magazzino$/i
handler.tags = ['rpg']
handler.help = ['magazzino']

export default handler