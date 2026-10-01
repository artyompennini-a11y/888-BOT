// Plugin by elixir, punisher & 888 staff
import { parsePhoneNumberFromString } from 'libphonenumber-js'

const DEFAULT_COUNTRY = 'IT'

const handler = async (m, { conn, text, usedPrefix }) => {
  const raw = String(text || '').trim()

  if (!raw) {
    return m.reply(
`📱 *NUMERO 888*

Analizza numeri di telefono.

${usedPrefix}numero <numero> — info completa
${usedPrefix}numero <numero> it — forza nazione IT

_Esempio:_ ${usedPrefix}numero +39 333 1234567`
    )
  }

  const parts = raw.split(/\s+/)
  let input = parts[0]
  let country = DEFAULT_COUNTRY

  const countryArg = parts[1]?.toLowerCase()
  if (countryArg && /^[a-z]{2}$/.test(countryArg)) {
    country = countryArg.toUpperCase()
  } else {
    input = raw
  }

  const digits = input.replace(/[^\d+]/g, '')

  if (!digits.replace(/\D/g, '')) {
    return m.reply('❌ Nessun numero valido trovato.')
  }

  const phone = parsePhoneNumberFromString(digits, country)

  if (!phone) {
    return m.reply(`❌ Impossibile interpretare \`${digits}\` come numero.\n\n💡 Prova con il prefisso internazionale, es. *+393331234567*.`)
  }

  if (!phone.isValid()) {
    return m.reply(
`⚠️ *Numero non valido*

📞 *${phone.number || digits}*
🌍 Probabile nazione: *${phone.country || 'sconosciuta'}*
📝 Formato: ${phone.formatInternational()}

_Può essere un numero fisso, un errore di digitazione o un numero non assegnato._
❌ Non risulta un numero telefonico valido.`
    )
  }

  const typeMap = {
    MOBILE: 'Mobile',
    FIXED_LINE: 'Fisso',
    FIXED_LINE_OR_MOBILE: 'Fisso o mobile',
    TOLL_FREE: 'Numero verde',
    PREMIUM_RATE: 'Numero a tariffazione speciale',
    SHARED_COST: 'Numero a tariffa condivisa',
    VOIP: 'VoIP',
    PERSONAL_NUMBER: 'Numero personale',
    PAGER: 'Pager',
    UAN: 'Centralino',
    UNKNOWN: 'Sconosciuto'
  }

  const type = typeMap[phone.getType()] || 'Sconosciuto'

  const text2 = `📱 *ANALISI NUMERO*

📞 *${phone.number}*
🌍 Nazione: *${phone.country}* (${phone.countryCallingCode})
📝 Formato int.: ${phone.formatInternational()}
📝 Formato naz.: ${phone.formatNational()}
🏷️ Tipo: *${type}*
${phone.isPossible() ? '✅ Numero possibile e valido' : '⚠️ Numero possibile ma non valido'}${phone.getExtension() ? `\n🔌 Estensione: ${phone.getExtension()}` : ''}`

  return m.reply(text2)
}

handler.help = ['numero <numero>']
handler.tags = ['utility', 'info']
handler.command = /^(numero|number|tel)$/i

export default handler