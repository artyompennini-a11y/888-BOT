// Plugin by Elixir & 888 staff
import { readFileSync } from 'fs'
import path, { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let handler = async (m, { conn }) => {
  const staffData = JSON.parse(readFileSync(join(__dirname, '../data/staff.json'), 'utf8'))

  const botName = global.db?.data?.nomedelbot || global.nomebot || "𝟴𝟴𝟴 𝗕𝗢𝗧"
  const botVersion = global.versione || global.db?.data?.version || "1.0"

  let staff = `*⋆｡˚✦『 𝐒𝐓𝐀𝐅𝐅 ${botName.toUpperCase()} 』✦˚｡⋆*`
  staff += `\n\n*╭───────────────╮*`
  staff += `\n*│ 🤖 𝐁𝐨𝐭:* ${botName}`
  staff += `\n*│ 🆚 𝐕𝐞𝐫𝐬𝐢𝐨𝐧𝐞:* ${botVersion}`
  staff += `\n*╰───────────────╯*`

  if (staffData.length > 0) {
    const owner = staffData[0]
    staff += `\n\n*╭─── 👑 𝐂𝐑𝐄𝐀𝐓𝐎𝐑𝐄 ───╮*`
    staff += `\n*│ ✦ 𝐍𝐨𝐦𝐞:* ${owner.nome}`
    staff += `\n*│ ✦ 𝐑𝐮𝐨𝐥𝐨:* ${owner.ruolo}`
    if (owner.telefono) {
      staff += `\n*│ ✦ 𝐂𝐨𝐧𝐭𝐚𝐭𝐭𝐨:* wa.me/${owner.telefono}`
    }
    if (owner.instagram) {
      staff += `\n*│ ✦ 𝐈𝐆:* instagram.com/${owner.instagram}`
    }
    if (owner.telegram) {
      staff += `\n*│ ✦ 𝐓𝐆:* @${owner.telegram}`
    }
    staff += `\n*╰────────────────────╯*`
  }

  if (staffData.length > 1) {
    const coOwners = staffData.filter(m => m.ruolo && m.ruolo.toLowerCase().includes('co-owner') || m.ruolo && m.ruolo.toLowerCase().includes('owner'))
    if (coOwners.length > 0) {
      staff += `\n\n*╭─── 🔱 𝐂𝐎-𝐎𝐖𝐍𝐄𝐑 ───╮*`
      for (const co of coOwners) {
        staff += `\n*│ ✦ ${co.nome}*`
        staff += `\n*│   ├ 𝐑𝐮𝐨𝐥𝐨:* ${co.ruolo}`
        if (co.telefono) {
          staff += `\n*│   ├ 𝐂𝐨𝐧𝐭𝐚𝐭𝐭𝐨:* wa.me/${co.telefono}`
        }
        if (co.instagram) {
          staff += `\n*│   ├ 𝐈𝐆:* instagram.com/${co.instagram}`
        }
        if (co.telegram) {
          staff += `\n*│   └ 𝐓𝐆:* @${co.telegram}`
        }
        staff += `\n*│*`
      }
      staff += `*╰────────────────────╯*`
    }
  }

  const managers = staffData.filter(m => m.ruolo && m.ruolo.toLowerCase().includes('manager'))
  if (managers.length > 0) {
    staff += `\n\n*╭─── 🛡️ 𝐒𝐓𝐀𝐅𝐅 ───╮*`
    for (const mgr of managers) {
      staff += `\n*│ ✦ ${mgr.nome}*`
      staff += `\n*│   ├ 𝐑𝐮𝐨𝐥𝐨:* ${mgr.ruolo}`
      if (mgr.telefono) {
        staff += `\n*│   └ 𝐂𝐨𝐧𝐭𝐚𝐭𝐭𝐨:* wa.me/${mgr.telefono}`
      }
      staff += `\n*│*`
    }
    staff += `*╰────────────────────╯*`
  }

  staff += `\n\n*╭─── 📌 𝐈𝐍𝐅𝐎 𝐔𝐓𝐈𝐋𝐈 ───╮*`
  staff += `\n*│ ✦ 𝐆𝐢𝐭𝐡𝐮𝐛:* https://github.com/Elixir-png/ElixirBot_`
  staff += `\n*│ ✦ 𝐂𝐚𝐧𝐚𝐥𝐞:* https://whatsapp.com/channel/0029Vb8Y0igGufJ0xMYJmU40`
  staff += `\n*│ ✦ 𝐄𝐦𝐚𝐢𝐥:* ElixirBoTSupporto@proton.me`
  staff += `\n*╰────────────────────╯*`

  staff += `\n\n> *${botName}*`

  const mentionedJids = staffData
    .filter(m => m.telefono)
    .map(m => `${m.telefono}@s.whatsapp.net`)

  const contacts = staffData
    .filter(m => m.telefono)
    .map(m => ({
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:${m.nome}
ORG:${botName} - ${m.ruolo}
TEL;type=CELL;type=VOICE;waid=${m.telefono}:${m.telefono.startsWith('39') ? '+' : '+'}${m.telefono}
END:VCARD`
    }))

  await conn.reply(m.chat, staff.trim(), m, {
    contextInfo: { mentionedJid: mentionedJids }
  })

  if (contacts.length > 0) {
    try {
      await conn.sendMessage(m.chat, {
        contacts: {
          contacts: contacts,
          subject: `Team ${botName}`
        }
      }, { quoted: m })
    } catch (e) {}
  }

  m.react('👑')
}

handler.help = ['staff', 'team']
handler.tags = ['main']
handler.command = ['staff', 'team']

export default handler
