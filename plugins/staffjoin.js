import { fileURLToPath } from 'url'
import path from 'path'

const pendingStaffJoin = {}

const STAFF_GROUP = "120363403774208578@g.us" 

const isStaff = (jid) =>
  (global.db.data.pluginPerms?.[jid] ?? []).includes('staff')

const notifyOwners = async (conn, req) => {
  const { id, staff, link, members } = req

  await conn.sendMessage(STAFF_GROUP, {
    text:
`╭━━━〔 🚨 *STAFF JOIN REQUEST* 〕━━━┈
┃ 👤 *Staff:* ${staff.split('@')[0]}
┃ 🔗 *Link gruppo:* ${link}
┃ 👥 *Membri:* ${members}
┃ 🆔 *ID Richiesta:* ${id}
┃━━━━━━━━━━━━━━━━━━
┃ Seleziona un'azione:
╰━━━━━━━━━━━━━━━━━━┈`,
    buttons: [
      { buttonId: `.staffaccept ${id}`, buttonText: { displayText: '✅ Approva' }, type: 1 },
      { buttonId: `.staffreject ${id}`, buttonText: { displayText: '❌ Rifiuta' }, type: 1 }
    ],
    headerType: 1
  })
}

let handler = async (m, { conn, text, command }) => {
  const cmd = command?.toLowerCase()

  // ───────────────────────────────
  // 🔘 APPROVA / RIFIUTA RICHIESTA
  // ───────────────────────────────
  if (cmd === 'staffaccept' || cmd === 'staffreject') {
    const id = text?.trim()
    if (!id) return m.reply('❌ ID mancante')

    const req = pendingStaffJoin[id]
    if (!req) return m.reply('❌ Richiesta non trovata')

    // APPROVA
    if (cmd === 'staffaccept') {
      try {
        let res = await conn.groupAcceptInvite(req.code)

        await conn.sendMessage(res, {
          text:
`╭━━━〔 ✅ *STAFF APPROVATO* 〕━━━┈
┃ 👤 *Staff:* ${req.staff.split('@')[0]}
┃ 📢 È entrato nel gruppo.
╰━━━━━━━━━━━━━━━━━━┈`
        })

        delete pendingStaffJoin[id]
      } catch (e) {
        return m.reply('❌ Errore join (già dentro o link invalido)')
      }
      return
    }

    // RIFIUTA
    if (cmd === 'staffreject') {
      await conn.sendMessage(req.staff, {
        text:
`╭━━━〔 ❌ *STAFF RIFIUTATO* 〕━━━┈
┃ La tua richiesta è stata
┃ rifiutata dagli owner.
╰━━━━━━━━━━━━━━━━━━┈`
      })

      delete pendingStaffJoin[id]
      return
    }
  }

  // ───────────────────────────────
  // 🔘 STAFFJOIN
  // ───────────────────────────────
  if (cmd !== 'staffjoin') return

  if (!isStaff(m.sender))
    return m.reply(
`╭━━━〔 ⛔ *ACCESSO NEGATO* 〕━━━┈
┃ Solo lo *staff autorizzato*
┃ può usare questo comando.
╰━━━━━━━━━━━━━━━━━━┈`
    )

  let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
  let [_, code] = text.match(linkRegex) || []
  if (!code)
    return m.reply(
`╭━━━〔 ❌ *LINK NON VALIDO* 〕━━━┈
┃ Inserisci un link corretto
┃ di invito WhatsApp.
╰━━━━━━━━━━━━━━━━━━┈`
    )

  let info = await conn.groupGetInviteInfo(code).catch(() => null)
  if (!info)
    return m.reply(
`╭━━━〔 ❌ *ERRORE LETTURA* 〕━━━┈
┃ Impossibile ottenere info
┃ del gruppo indicato.
╰━━━━━━━━━━━━━━━━━━┈`
    )

  let id = `SJ-${Date.now()}`

  pendingStaffJoin[id] = {
    id,
    code,
    staff: m.sender,
    link: text,
    members: info.participants?.length || 0
  }

  await notifyOwners(conn, pendingStaffJoin[id])

  return m.reply(
`╭━━━〔 📨 *RICHIESTA INVIATA* 〕━━━┈
┃ 👤 *Staff:* ${m.sender.split('@')[0]}
┃ 🆔 *ID:* ${id}
┃━━━━━━━━━━━━━━━━━━
┃ ⏳ In attesa di approvazione
┃ dagli owner.
╰━━━━━━━━━━━━━━━━━━┈`
  )
}

handler.command = /^(staffjoin|staffaccept|staffreject)$/i
export default handler