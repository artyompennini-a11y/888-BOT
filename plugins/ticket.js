import { generateWAMessageFromContent, proto } from '@realvare/baileys'

const SUPPORT_GROUP = '120363405035221899@g.us'
const pendingFirma = {}

const getGroupJid = async (conn) => {
  if (SUPPORT_GROUP?.endsWith?.('@g.us')) return SUPPORT_GROUP
  try {
    const meta = await conn.groupGetInviteInfo(SUPPORT_GROUP)
    return meta?.id || null
  } catch {
    return null
  }
}

let handler = async (m, { conn, text, command }) => {
  if (!global.db.data.tickets) global.db.data.tickets = {}
  const cmd = command?.toLowerCase()

  if (cmd === 'ticket') {
    if (!text || text.trim().length < 10)
      return m.reply('⚠️ Il motivo deve contenere almeno 10 caratteri.\nEsempio: .ticket non riesco ad accedere al gruppo')

    const groupJid = await getGroupJid(conn)
    if (!groupJid) return m.reply('❌ Errore nel trovare il gruppo di supporto.')

    const ticketId = `TKT-${Date.now()}`
    const numero = m.sender.split('@')[0]

    global.db.data.tickets[ticketId] = {
      sender: m.sender,
      chat: m.chat,
      motivo: text.trim(),
      numero,
      status: 'open',
      timestamp: Date.now()
    }

    const staffMessage = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: '🎫 Nuovo Ticket',
              hasMediaAttachment: false
            },
            body: {
              text: `• *ID:* ${ticketId}\n• *Utente:* +${numero}\n• *Motivo:* ${text.trim()}\n\n_Rispondi con:_ .risposta ${ticketId} [testo]`
            },
            footer: {
              text: 'Usa il pulsante per copiare il codice del ticket'
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: 'cta_copy',
                  buttonParamsJson: JSON.stringify({
                    display_text: '📋 Copia ID',
                    id: ticketId,
                    copy_code: ticketId
                  })
                }
              ]
            }
          }
        }
      }
    }

    await conn.relayMessage(groupJid, staffMessage, {})

    await m.reply(`✅ *Ticket aperto con successo!*\n\n• *ID:* ${ticketId}\n_Il nostro staff ti risponderà il prima possibile._`)
    return
  }

  if (cmd === 'risposta') {
    const parts = text?.trim().split(' ')
    if (!parts || parts.length < 2)
      return m.reply('⚠️ Uso corretto: .risposta TKT-123456 testo della risposta')

    const ticketId = parts[0].toUpperCase()
    const testo = parts.slice(1).join(' ')

    const ticket = global.db.data.tickets[ticketId]
    if (!ticket) return m.reply(`❌ Ticket ${ticketId} non trovato.`)
    if (ticket.status === 'closed') return m.reply(`⚠️ Il ticket ${ticketId} è già stato chiuso.`)

    pendingFirma[m.sender] = { ticketId, testo }

    const signPrompt = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: '✏️ Firma della risposta',
              hasMediaAttachment: false
            },
            body: {
              text: `Invia il tuo *nome* in chat per firmare la risposta al ticket *${ticketId}*.\n\n_Oppure usa il pulsante per annullare._`
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: 'quick_reply',
                  buttonParamsJson: JSON.stringify({
                    display_text: '❌ Annulla',
                    id: '.annullafirma'
                  })
                }
              ]
            }
          }
        }
      }
    }

    return await conn.relayMessage(m.chat, signPrompt, { quoted: m })
  }

  if (cmd === 'annullafirma') {
    delete pendingFirma[m.sender]
    return m.reply('🗑️ Invio della risposta annullato.')
  }
}

handler.all = async function (m) {
  if (!m.text || m.fromMe) return
  if (!pendingFirma[m.sender]) return

  const { ticketId, testo } = pendingFirma[m.sender]
  const firma = m.text.trim()
  delete pendingFirma[m.sender]

  const ticket = global.db.data.tickets?.[ticketId]
  if (!ticket) return

  ticket.status = 'closed'
  ticket.closedBy = firma

  try {
    await this.sendMessage(ticket.sender, {
      text: `📩 *Risposta al tuo ticket* (${ticketId})\n\n${testo}\n\n• *Firmato:* ${firma}\n• _888 Staff_`
    })

    await this.sendMessage(m.chat, {
      text: `✅ Risposta inviata a *+${ticket.numero}*\n\n• *Ticket:* ${ticketId} (Chiuso)\n• *Firma:* ${firma}`
    })
  } catch (e) {
    await this.sendMessage(m.chat, {
      text: `❌ Errore durante l'invio: ${e.message}`
    })
  }
}

handler.command = /^(ticket|risposta|annullafirma)$/i
export default handler
