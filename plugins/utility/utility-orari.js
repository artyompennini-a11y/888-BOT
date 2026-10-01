// Plugin by elixir, punisher & 888 staff
import moment from 'moment-timezone'

const ZONES = {
  it: 'Europe/Rome',
  ita: 'Europe/Rome',
  roma: 'Europe/Rome',
  milano: 'Europe/Rome',
  usa: 'America/New_York',
  'new york': 'America/New_York',
  ny: 'America/New_York',
  london: 'Europe/London',
  uk: 'Europe/London',
  francia: 'Europe/Paris',
  parigi: 'Europe/Paris',
  berlino: 'Europe/Berlin',
  moscovia: 'Europe/Moscow',
  dubai: 'Asia/Dubai',
  india: 'Asia/Kolkata',
  cina: 'Asia/Shanghai',
  shanghai: 'Asia/Shanghai',
  tokyo: 'Asia/Tokyo',
  giappone: 'Asia/Tokyo',
  sydney: 'Australia/Sydney',
  toronto: 'America/Toronto',
  sanpaolo: 'America/Sao_Paulo',
  'san paolo': 'America/Sao_Paulo',
  brasile: 'America/Sao_Paulo',
  buenosaires: 'America/Argentina/Buenos_Aires',
  cairo: 'Africa/Cairo'
}

const OFFICIOS = {
  it: { label: 'Italia', zone: 'Europe/Rome' }
}

const handler = async (m, { conn, text, usedPrefix }) => {
  const raw = String(text || '').trim().toLowerCase()

  if (!raw || raw === 'help' || raw === 'aiuto') {
    return m.reply(
`🕐 *ORARI 888*

${usedPrefix}orari it — ora in Italia
${usedPrefix}orari tokyo — ora a Tokyo
${usedPrefix}orari newyork — ora a New York

🌍 Supporto anche: london, francia, berlino, moscovia, dubai, india, cina, sydney, toronto, sanpaolo, buenosaires, cairo`
    )
  }

  const zone = ZONES[raw]

  if (!zone) {
    const matches = Object.keys(ZONES)
      .filter(k => k.startsWith(raw))
      .slice(0, 8)

    if (matches.length) {
      return m.reply(`🌍 Zona non trovata. Intendi:\n${matches.map(k => `• *${usedPrefix}orari ${k}*`).join('\n')}`)
    }
    return m.reply(`❌ Zona sconosciuta: *${raw}*\nUsa *${usedPrefix}orari* per l'elenco.`)
  }

  const now = moment().tz(zone)
  const italy = OFFICIOS.it
  const italyNow = moment().tz(italy.zone)
  const diffHours = now.utcOffset() - italyNow.utcOffset()

  let diff = 'Stesso fuso orario dell\'Italia'
  if (diffHours !== 0) {
    const sign = diffHours > 0 ? '+' : '-'
    diff = `${sign}${Math.abs(diffHours)}h rispetto all'Italia`
  }

  const dayPhase =
    now.hour() < 6 ? '🌙 Notte fonda' :
    now.hour() < 12 ? '🌅 Mattina' :
    now.hour() < 18 ? '☀️ Pomeriggio' :
    now.hour() < 22 ? '🌇 Sera' : '🌙 Notte'

  return m.reply(
`🕐 *ORARIO*

⏰ Ora: *${now.format('HH:mm:ss')}*
📅 ${now.format('dddd D MMMM YYYY')}
${dayPhase}
📍 ${zone}
🕑 ${diff}

🇮🇹 Italia: ${italyNow.format('HH:mm')}`
  )
}

handler.help = ['orari [zona]']
handler.tags = ['utility', 'info']
handler.command = /^(orari|orario|ora|timezone)$/i

export default handler