//Plugin by Gab, Lucifero & 333 staff




const PIN_EMOJI = ['🎳', '⚪', '⚪', '⚪', '⚪', '⚪', '⚪', '⚪', '⚪', '⚪']

function tiro() {
  
  const rand = Math.random()
  if (rand < 0.05) return 0           // 5% gutter
  if (rand < 0.15) return Math.floor(Math.random() * 3) + 1   // 1-3
  if (rand < 0.45) return Math.floor(Math.random() * 4) + 4   // 4-7
  if (rand < 0.75) return Math.floor(Math.random() * 2) + 8   // 8-9
  if (rand < 0.90) return 10          // 15% strike
  return Math.floor(Math.random() * 10) + 1
}

function pinAbbattuti(n) {
  
  const righe = [
    [7, 8, 9, 10],
    [4, 5, 6],
    [2, 3],
    [1]
  ]
  const abbattuti = new Set()
  
  const tutti = [1,2,3,4,5,6,7,8,9,10]
  const scelti = tutti.sort(() => Math.random() - 0.5).slice(0, n)
  scelti.forEach(p => abbattuti.add(p))

  return righe.map(riga =>
    riga.map(p => abbattuti.has(p) ? '💨' : '🎳').join(' ')
  ).join('\n┃ ')
}

function risultatoTiro(n) {
  if (n === 10) return '⚡ STRIKE!'
  if (n === 0)  return '😭 Gutter!'
  if (n >= 8)   return `😮 Ottimo! ${n} pin`
  if (n >= 5)   return `👍 Buono! ${n} pin`
  return `😬 Solo ${n} pin...`
}

let handler = async (m, { conn, text }) => {
  const user = global.db.data.users[m.sender]
  if (!user) return m.reply('❌ Non sei registrato')

  const puntata = parseInt(text?.trim())
  if (!puntata || puntata <= 0) {
    return await conn.sendMessage(m.chat, {
      text:
`╔═ 🎳 𝐁𝐎𝐖𝐋𝐈𝐍𝐆 𝚃𝙷𝙴 𝙿𝚄𝙽𝙸𝚂𝙷𝙴𝚁-𝙱𝙾𝚃 ═╗
┃
┃ 🎳 *Lancia la palla!*
┃
┃ 💼 *Tuoi soldi:* ${user.money || 0}€
┃
┃ 📊 *Pagamenti:*
┃ ⚡ Strike (10)   → x4
┃ 😮 8-9 pin       → x2
┃ 👍 5-7 pin       → x1
┃ 😬 1-4 pin       → perdi metà
┃ 😭 Gutter (0)    → perdi tutto
┃
╚══════════════╝`,
      footer: "𝚃𝙷𝙴 𝙿𝚄𝙽𝙸𝚂𝙷𝙴𝚁-𝙱𝙾𝚃 CASINO",
      buttons: [
        { buttonId: ".bowling 10",  buttonText: { displayText: "💸 Punta 10€"  }, type: 1 },
        { buttonId: ".bowling 50",  buttonText: { displayText: "💰 Punta 50€"  }, type: 1 },
        { buttonId: ".bowling 100", buttonText: { displayText: "🤑 Punta 100€" }, type: 1 },
        { buttonId: ".casino",      buttonText: { displayText: "🔙 Torna al Casino" }, type: 1 }
      ],
      headerType: 1
    }, { quoted: m })
  }

  if (puntata < 10) return m.reply('❌ Puntata minima: *10€*')
  if ((user.money || 0) < puntata) return m.reply(`❌ Non hai abbastanza soldi! Hai *${user.money || 0}€*`)

  const pin = tiro()
  const pins = pinAbbattuti(pin)
  const risultato = risultatoTiro(pin)

  let esito = ''
  let moneyMod = 0

  if (pin === 10) {
    moneyMod = puntata * 4
    user.money += moneyMod
    esito = `✅ *Hai vinto ${moneyMod}€!*`
  } else if (pin >= 8) {
    moneyMod = puntata * 2
    user.money += moneyMod
    esito = `✅ *Hai vinto ${moneyMod}€!*`
  } else if (pin >= 5) {
    moneyMod = puntata
    user.money += moneyMod
    esito = `✅ *Hai vinto ${moneyMod}€!*`
  } else if (pin >= 1) {
    moneyMod = Math.floor(puntata / 2)
    user.money -= moneyMod
    esito = `❌ *Hai perso ${moneyMod}€!*`
  } else {
    moneyMod = puntata
    user.money -= moneyMod
    esito = `❌ *Hai perso ${puntata}€!*`
  }

  await conn.sendMessage(m.chat, {
    text:
`╔═ 🎳 𝐁𝐎𝐖𝐋𝐈𝐍𝐆 𝚃𝙷𝙴 𝙿𝚄𝙽𝙸𝚂𝙷𝙴𝚁-𝙱𝙾𝚃 ═╗
┃
┃ 🎳 *Hai lanciato...*
┃
┃ ${pins}
┃
┃ 🏅 *${risultato}*
┃ 💵 Puntata: ${puntata}€
┃ ${esito}
┃
┃ 💼 Saldo: *${user.money}€*
┃
╚══════════════╝`,
    footer: "𝚃𝙷𝙴 𝙿𝚄𝙽𝙸𝚂𝙷𝙴𝚁-𝙱𝙾𝚃 𝐂𝐀𝐒𝐈𝐍𝐎",
    buttons: [
      { buttonId: `.bowling ${puntata}`, buttonText: { displayText: "🔄 Lancia ancora" }, type: 1 },
      { buttonId: ".casino",             buttonText: { displayText: "🔙 Torna al Casino" }, type: 1 }
    ],
    headerType: 1
  }, { quoted: m })
}

handler.command = /^bowling$/i
handler.group = true
export default handler
