// Plugin by Elixir, Punisher & 888 staff
import fetch from 'node-fetch'
import { createCanvas } from 'canvas'

let handler = async (m, { conn, text, command, usedPrefix: prefix }) => {
  try {
    console.log(`[checkban] Richiesta scansione da: ${m.sender} via ${command}`)
    
    let target = m.quoted ? m.quoted.sender : m.mentionedJid?.[0] ? m.mentionedJid[0] : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null
    if (!target) {
      return m.reply(`⭔ *SISTEMA 888*\n\n💡 _Uso:_ Rispondi a qualcuno, taggalo o scrivi il numero.`)
    }

    await m.react('🛰️')

    let cleanNumber = target.split('@')[0]
    let isBanned = false
    let databaseStatus = 'UNKNOWN'

    try {
      if (global.db && global.db.data && global.db.data.users) {
        let userInDb = global.db.data.users[target]
        if (userInDb) {
          isBanned = userInDb.banned || false
          databaseStatus = isBanned ? 'RESTRICTED' : 'AUTHORIZED'
        }
      }
    } catch (dbErr) {
      console.error('[checkban] Errore lettura locale database:', dbErr.message)
    }

    const canvas = createCanvas(850, 480)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#070b19'
    ctx.fillRect(0, 0, 850, 480)

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x < 850; x += 25) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 480)
      ctx.stroke()
    }
    for (let y = 0; y < 480; y += 25) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(850, y)
      ctx.stroke()
    }

    ctx.strokeStyle = '#00f0ff'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, 810, 440)

    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)'
    ctx.fillRect(25, 25, 800, 40)
    ctx.strokeStyle = '#00f0ff'
    ctx.strokeRect(25, 25, 800, 40)

    ctx.fillStyle = '#00f0ff'
    ctx.font = 'bold 16px Courier New'
    ctx.fillText('// 888 MAIN CORE CONTROL SYSTEM — CORE SCANNER v4.0 //', 45, 51)

    ctx.fillStyle = '#ffffff'
    ctx.font = '15px Courier New'
    ctx.fillText(`TARGET_ID : ${target}`, 50, 110)
    ctx.fillText(`PHONE_NUM : +${cleanNumber}`, 50, 140)
    ctx.fillText(`TIMESTAMP : ${new Date().toISOString()}`, 50, 170)
    ctx.fillText(`DB_STATUS : ${databaseStatus}`, 50, 200)

    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)'
    ctx.beginPath()
    ctx.moveTo(50, 230)
    ctx.lineTo(800, 230)
    ctx.stroke()

    ctx.fillStyle = 'rgba(0, 240, 255, 0.05)'
    ctx.fillRect(50, 260, 750, 160)
    ctx.lineWidth = 1.5
    ctx.strokeStyle = isBanned ? '#ff0055' : '#00ff66'
    ctx.strokeRect(50, 260, 750, 160)

    if (isBanned) {
      ctx.fillStyle = '#ff0055'
      ctx.font = 'bold 36px Courier New'
      ctx.fillText('➔ SECURITY ALERT: ACCESS BANNED', 80, 325)
      ctx.font = '14px Courier New'
      ctx.fillStyle = 'rgba(255, 0, 85, 0.8)'
      ctx.fillText('CRITICAL: L\'utente ha violato le policy o è stato inserito nella blacklist.', 80, 365)
      ctx.fillText('Stato operativo: Sospensione permanente da tutti i moduli del cluster 888.', 80, 385)
    } else {
      ctx.fillStyle = '#00ff66'
      ctx.font = 'bold 36px Courier New'
      ctx.fillText('➔ SECURITY CLEAR: SYSTEM ACTIVE', 80, 325)
      ctx.font = '14px Courier New'
      ctx.fillStyle = 'rgba(0, 255, 102, 0.8)'
      ctx.fillText('VERIFIED: Nessuna anomalia o restrizione trovata a carico dell\'account.', 80, 365)
      ctx.fillText('Stato operativo: Autorizzato per intero all\'utilizzo dei servizi centrali.', 80, 385)
    }

    const buffer = canvas.toBuffer('image/png')
    
    let captionText = 
`╭━━━〔 📡 *SCANZIONE LOG* 〕━━━┈
┃ *Bot:* 𝟴𝟴𝟴 𝗕𝗢𝗧
┃ *Livello:* Core Control System
┃━━━━━━━━━━━━━━━━━━
┃ ⚙️ *Dettagli Scansione:*
┃  ⮕ *Core:* 888 NETWORK
┃  ⮕ *Target:* @${cleanNumber}
┃  ⮕ *Esito:* ${isBanned ? '*BANNATO / LOCK* 🔴' : '*AUTORIZZATO / SAFE* 🟢'}
╰━━━━━━━━━━━━━━━━━━┈
> ⚠️ In caso di bug o problemi tecnici, 
> utilizza il comando *${prefix || '#'}ticket* per 
> segnalarlo subito allo staff.`.trim()

    await conn.sendMessage(m.chat, { 
      image: buffer, 
      caption: captionText,
      mentions: [target]
    }, { quoted: m })

    await m.react('✅')
    console.log(`[checkban] Canvas generato ed inviato con successo per: ${cleanNumber}`)

  } catch (err) {
    console.error('[checkban] Errore durante la generazione del checkban tech:', err)
    await m.reply(`\`── ❌ SYSTEM ERROR ──\`\n\n\`💥\` Fallimento durante il rendering HUD Canvas.\n\n\`[⚡] 888 SYSTEM\``)
    await m.react('❌')
  }
}

handler.help = ['checkban']
handler.tags = ['owner']
handler.command = /^(checkban)$/i
handler.owner = true

export default handler
