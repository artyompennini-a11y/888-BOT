// Plugin by elixir & Axtral_WiZaRd
import fs from 'fs'
let handler = async (m, { conn, command, args, isOwner, isAdmin, isROwner }) => {
  let isEnabling = /true|1|attiva|(turn)?on|1/i.test(command)
  if (/0|disabilita|disattiva|off|0/i.test(command)) isEnabling = false

  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  const bot = global.db.data.settings[conn.user.jid] || (global.db.data.settings[conn.user.jid] = {})
  const userName = m.pushName || 'Utente'

  let imgBuffer
  try {
    imgBuffer = fs.readFileSync('icone/888.jpg')
  } catch {
    imgBuffer = Buffer.alloc(0)
  }

  const fake = {
    key: {
      participants: '0@s.whatsapp.net',
      fromMe: false,
      id: '1_888'
    },
    message: {
      locationMessage: {
        name: '⚙️ 888 BOT • Gestione Funzioni',
        jpegThumbnail: imgBuffer
      }
    },
    participant: '0@s.whatsapp.net'
  }

  let optionName = (args[0] || '').toLowerCase()

switch (optionName) {
    // ---------- MODULI ADMIN ----------
    case "welcome":
    case "benvenuto":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.welcome = isEnabling;
      break;

    case "goodbye":
    case "addio":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.goodbye = isEnabling;
      break;

    case "antinuke":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antinuke = isEnabling;
      break;

    case "antiraid":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antiraid = isEnabling;
      break;

    case "antiraidlink":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antiraidlink = isEnabling;
      break;

    case "antiflood":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antiflood = isEnabling;
      break;

    case "antighost":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antighost = isEnabling;
      break;

    case "antimedia":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antimedia = isEnabling;
      break;

    case "antitoxic":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antitoxic = isEnabling;
      break;

    case "antispam":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antispam = isEnabling;
      break;

    case "antibot":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antibot = isEnabling;
      break;

    case "antioneview":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antioneview = isEnabling;
      break;

    case "antitrava":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antitrava = isEnabling;
      break;

    case "antiporno":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antiporno = isEnabling;
      break;

    case "antigore":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antigore = isEnabling;
      break;

    case "antivoip":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antivoip = isEnabling;
      break;

    case "antilink":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antiLink = isEnabling;
      break;

    case "antilinkig":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antilinkig = isEnabling;
      break;

    case "antilinktg":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antilinktg = isEnabling;
      break;

    case "antilinktiktok":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antilinktiktok = isEnabling;
      break;

    case "antipaki":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antiArab = isEnabling;
      break;

    case "modoadmin":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.modoadmin = isEnabling;
      break;

    case "slowmode":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.slowmode = isEnabling;
      break;

    case "reaction":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.reaction = isEnabling;
      break;

    case "bestemmiometro":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.bestemmiometro = isEnabling;
      break;

    case "rileva":
    case "detect":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.rileva = isEnabling;
      break;

    case "logrichieste":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.logrichieste = isEnabling;
      break;

    case "ai":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.ai = isEnabling;
      break;

    case "vocali":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.vocali = isEnabling;
      break;

    case "autosticker":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.autosticker = isEnabling;
      break;

    case "risposte":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.risposte = isEnabling;
      break;

    case "antiruba":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antiruba = isEnabling;
      break;

    case "talk":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.talk = isEnabling;
      break;

    case "reazioni":
    case "provocatorio":
    case "provocazione":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.reazioni = isEnabling;
      break;

    case "autolevelup":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.autolevelup = isEnabling;
      break;

    case "antifake":
      if (m.isGroup) {
        if (!isAdmin && !isOwner && !isROwner) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.antifake = isEnabling;
      break;
// ---------- MODULI OWNER ----------
    case "antiprivato":
      if (!isOwner && !isROwner) {
        global.dfail('owner', m, conn)
        throw false
      }
      bot.antiprivato = isEnabling;
      break;

    case "anticall":
      if (!isOwner && !isROwner) {
        global.dfail('owner', m, conn)
        throw false
      }
      bot.anticall = isEnabling;
      break;

    case "solocreatore":
      if (!isROwner) {
        global.dfail('rowner', m, conn)
        throw false
      }
      bot.soloCreatore = isEnabling;
      break;

    case "lettura":
      if (!isOwner && !isROwner) {
        global.dfail('owner', m, conn)
        throw false
      }
      bot.read = isEnabling;
      break;

    case "subbots":
      if (!isOwner && !isROwner) {
        global.dfail('owner', m, conn)
        throw false
      }
      bot.jadibotmd = isEnabling;
      break;

    case "restrict":
      if (!isOwner && !isROwner) {
        global.dfail('owner', m, conn)
        throw false
      }
      bot.restrict = isEnabling;
      break;

    default:
      throw false
  }

  await conn.sendMessage(m.chat, {
    text: '⚙️ *Funzione:* ' + optionName + '\n' +
      (isEnabling ? '🟩 *ATTIVATO*' : '🟥 *DISATTIVATO*') +
      '\n👤 Operatore: ' + userName
  }, { quoted: fake });
}

handler.help = ['attiva', 'disattiva']
handler.tags = ['main']
handler.command = ['1', '0', 'attiva', 'disattiva', 'on', 'off']
handler.lowercaseOnly = true

export default handler
// Plugin by elixir & Axtral_WiZaRd
