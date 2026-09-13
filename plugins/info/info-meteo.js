// Plugin by Elixir & 888 staff

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`⚠️ *Uso corretto:* ${usedPrefix + command} *[città]*\n\nEsempi:\n• ${usedPrefix + command} Roma\n• ${usedPrefix + command} Milano`)

  await m.reply(`🌤️ *Cerco il meteo per ${text}...*`)

  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=1&language=it&format=json`)
    if (!geoRes.ok) throw new Error('Errore geocoding')
    const geoData = await geoRes.json()

    const location = geoData.results?.[0]
    if (!location) return m.reply('❌ *Città non trovata.* Verifica il nome e riprova.')

    const { latitude, longitude, name, country, admin1 } = location

    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FRome&forecast_days=3`)
    if (!weatherRes.ok) throw new Error('Errore meteo')
    const weather = await weatherRes.json()

    const current = weather.current
    const daily = weather.daily

    const weatherDesc = getWeatherDesc(current.weather_code)
    const emoji = getWeatherEmoji(current.weather_code)
    const isDay = current.is_day === 1

    const days = ['Oggi', 'Domani', 'Dopodomani']
    const forecast = daily.time.map((date, i) => {
      const dayName = i === 0 ? 'Oggi' : i === 1 ? 'Domani' : new Date(date).toLocaleDateString('it-IT', { weekday: 'long' })
      return `┃ ${dayName}: ${getWeatherEmoji(daily.weather_code[i])} ${daily.temperature_2m_min[i]}°/${daily.temperature_2m_max[i]}° (💧 ${daily.precipitation_probability_max[i] || 0}%)`
    }).join('\n')

    const windDir = getWindDir(current.wind_direction_10m)

    const result = `🌤️ *METEO — ${name}${admin1 ? ` (${admin1})` : ''}*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `┃ ${emoji} *${weatherDesc}*\n` +
      `┃ 🌡️ *Temperatura:* ${current.temperature_2m}°C\n` +
      `┃ 🤔 *Percepita:* ${current.apparent_temperature}°C\n` +
      `┃ 💧 *Umidità:* ${current.relative_humidity_2m}%\n` +
      `┃ 💨 *Vento:* ${current.wind_speed_10m} km/h ${windDir}\n` +
      `┃ ☔ *Precipitazioni:* ${current.precipitation} mm\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📅 *PREVISIONI 3 GIORNI*\n` +
      `${forecast}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📍 ${country}\n` +
      `🕐 Aggiornato: ${weather.current.time?.replace('T', ' ')}`

    await m.reply(result)
  } catch (e) {
    m.reply('❌ *Errore durante il recupero del meteo.* Riprova più tardi.')
  }
}

function getWeatherDesc(code) {
  const codes = {
    0: 'Cielo sereno', 1: 'Prevalentemente soleggiato', 2: 'Parzialmente nuvoloso',
    3: 'Coperto', 45: 'Nebbia', 48: 'Nebbia gelida',
    51: 'Pioviggine leggera', 53: 'Pioviggine', 55: 'Pioviggine intensa',
    56: 'Pioviggine gelata', 57: 'Pioviggine gelata intensa',
    61: 'Pioggia leggera', 63: 'Pioggia moderata', 65: 'Pioggia intensa',
    66: 'Pioggia gelata', 67: 'Pioggia gelata intensa',
    71: 'Neve leggera', 73: 'Neve moderata', 75: 'Neve intensa',
    77: 'Granelli di neve',
    80: 'Rovesci leggeri', 81: 'Rovesci moderati', 82: 'Rovesci violenti',
    85: 'Rovesci di neve leggeri', 86: 'Rovesci di neve intensi',
    95: 'Temporale', 96: 'Temporale con grandine', 99: 'Temporale con grandine forte'
  }
  return codes[code] || 'Condizioni sconosciute'
}

function getWeatherEmoji(code) {
  const codes = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌧️',
    56: '🌧️', 57: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    66: '🌧️', 67: '🌧️',
    71: '🌨️', 73: '🌨️', 75: '❄️',
    77: '❄️',
    80: '🌦️', 81: '🌧️', 82: '⛈️',
    85: '🌨️', 86: '❄️',
    95: '⛈️', 96: '⛈️', 99: '⛈️'
  }
  return codes[code] || '🌡️'
}

function getWindDir(degrees) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']
  return dirs[Math.round(degrees / 22.5) % 16] || 'N'
}

handler.help = ['meteo']
handler.tags = ['utility']
handler.command = /^(meteo|tempo)$/i

export default handler
