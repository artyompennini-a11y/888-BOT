// Plugin DOX — 888 Premium Edition (PDF fix)
const providerISP = ['TIM SpA', 'Vodafone Italia', 'Wind Tre S.p.A', 'Fastweb S.p.A', 'Iliad Italia', 'Tiscali Italia', 'Eolo S.p.A']
const sistemiOp = ['Windows 11 Pro', 'macOS Sonoma 14.5', 'Ubuntu 24.04 LTS', 'Android 14', 'iOS 17.5', 'ChromeOS 128']
const browserUA = ['Chrome 125.0.6422.60', 'Safari 17.5', 'Firefox 127.0', 'Edge 125.0.2535.51', 'Opera 111.0']
const cittaItaliane = ['Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Firenze', 'Bologna', 'Venezia', 'Catania']
const coordCitta = {
  'Roma': [41.9028, 12.4964], 'Milano': [45.4642, 9.1900], 'Napoli': [40.8518, 14.2681],
  'Torino': [45.0703, 7.6869], 'Palermo': [38.1157, 13.3615], 'Genova': [44.4056, 8.9463],
  'Firenze': [43.7696, 11.2558], 'Bologna': [44.4949, 11.3426], 'Venezia': [45.4408, 12.3155],
  'Catania': [37.5079, 15.0900]
}
const porteAperte = ['21 (FTP)', '22 (SSH)', '80 (HTTP)', '443 (HTTPS)', '3306 (MySQL)', '8080 (HTTP-Alt)', '8443 (HTTPS-Alt)']
const vulnerabilita = ['CVE-2024-3094 (XZ Utils)', 'CVE-2023-44487 (HTTP/2 Rapid Reset)', 'CVE-2024-27198 (JetBrains)', 'CVE-2024-6387 (OpenSSH regreSSHion)']

const handler = async (m, { conn, text }) => {
  let target;

  if (m.mentionedJid && m.mentionedJid[0]) {
    target = { type: 'jid', value: m.mentionedJid[0], name: await conn.getName(m.mentionedJid[0]) || 'Sconosciuto' }
  } else if (m.quoted) {
    target = { type: 'jid', value: m.quoted.sender, name: await conn.getName(m.quoted.sender) || 'Sconosciuto' }
  } else if (text) {
    target = { type: 'text', value: text, name: text }
  } else {
    target = { type: 'jid', value: m.sender, name: await conn.getName(m.sender) || 'Sconosciuto' }
  }

  let key = await conn.reply(m.chat,
`⚡ 888 BOT DOX ENGINE v4.0

Avvio scansione OSINT...
Fingerprinting dispositivo...
Analisi rete e geolocalizzazione...

Attendere qualche secondo...`, m)

  await new Promise(resolve => setTimeout(resolve, 3500))

  const numero = target.type === 'jid'
    ? target.value.split('@')[0]
    : '39' + Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')

  const telefonoFormattato = `+${numero.substring(0, 2)} ${numero.substring(2, 5)} ${numero.substring(5, 8)} ${numero.substring(8)}`
  const nomeCompleto = target.name
  const citta = pickRandom(cittaItaliane)
  const [baseLat, baseLon] = coordCitta[citta] || [41.9, 12.5]
  const lat = (baseLat + (Math.random() - 0.5) * 0.05).toFixed(6)
  const lon = (baseLon + (Math.random() - 0.5) * 0.05).toFixed(6)
  const isp = pickRandom(providerISP)
  const ip = `${randomInt(10, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`
  const mac = Array(6).fill(0).map(() => randomHex()).join(':').toUpperCase()
  const os = pickRandom(sistemiOp)
  const browser = pickRandom(browserUA)
  const dispositivo = pickRandom(['Samsung Galaxy S24 Ultra', 'iPhone 15 Pro Max', 'Xiaomi 14 Pro', 'Google Pixel 9 Pro', 'OnePlus 12', 'Nothing Phone 3', 'Huawei Mate 60 Pro'])
  const batteria = `${randomInt(7, 98)}%`
  const storage = `${randomInt(20, 95)}% pieno`
  const whVer = `2.24.${randomInt(10, 85)}`
  const email = `${nomeCompleto.toLowerCase().replace(/[^a-z0-9]/g, '.')}@${pickRandom(['gmail.com', 'outlook.it', 'yahoo.com', 'icloud.com', 'live.it'])}`
  const cf = generaCF(nomeCompleto)
  const telefonoInfo = pickRandom(['Contratto TIM Power 200GB', 'Vodafone Unlimited Max 5G', 'Wind Tre Senza Limiti 150GB', 'Iliad 200GB 5G', 'Fastweb Fibra 1Gbps + Mobile 100GB'])
  const porte = pickRandomSet(porteAperte, randomInt(3, 5)).join(', ')
  const vuln = pickRandomSet(vulnerabilita, randomInt(1, 3)).join(', ')
  const punteggioSicurezza = randomInt(23, 89)
  const passProb = pickRandom(['ALTA', 'MEDIA', 'BASSA', 'CRITICA'])
  const dataBreach = Math.random() > 0.5 ? `Sì — ${randomInt(1, 8)} database compromessi` : 'Nessun breach rilevato'
  const socialProfili = `Instagram: @${nomeCompleto.toLowerCase().replace(/[^a-z0-9]/g, '_')}\nFacebook: ${nomeCompleto.replace(/ /g, '.')}\nTikTok: @${nomeCompleto.split(' ')[0].toLowerCase()}_${randomInt(100, 999)}`

  const reportText = `
⚡ 888 BOT DOX REPORT

🎯 DATI ANAGRAFICI
• Nome: ${nomeCompleto}
• Telefono: ${telefonoFormattato}
• Email: ${email}
• Codice Fiscale: ${cf}
• IP: ${ip}

📱 DISPOSITIVO
• Modello: ${dispositivo}
• Sistema: ${os}
• Browser: ${browser}
• Batteria: ${batteria}
• Storage: ${storage}
• WhatsApp: v${whVer}
• MAC: ${mac}

🌐 RETE & GEOLOCALIZZAZIONE
• ISP: ${isp}
• Città: ${citta}
• Coordinate: ${lat}, ${lon}
• Piano Mobile: ${telefonoInfo}

🔓 VULNERABILITÀ
• Porte Aperte: ${porte}
• Vulnerabilità: ${vuln}
• Sicurezza: ${punteggioSicurezza}/100 (${passProb})
• Data Breach: ${dataBreach}

📡 PROFILI SOCIAL
${socialProfili}

Report generato il ${new Date().toLocaleString('it-IT')}
(Dati simulati a scopo ricreativo)
`.trim()

  const mentions = target.type === 'jid' ? [target.value] : []
  await conn.sendMessage(m.chat, { text: reportText, edit: key, mentions })

  try {
    const pdfBuffer = generaPDFBuffer({
      nomeCompleto, telefonoFormattato, email, cf, ip, dispositivo, os, browser,
      batteria, storage, whVer, mac, isp, citta, lat, lon, telefonoInfo,
      porte, vuln, punteggioSicurezza, passProb, dataBreach, socialProfili
    })

    await conn.sendMessage(m.chat, {
      document: pdfBuffer,
      mimetype: 'application/pdf',
      fileName: `Dox_Report_${nomeCompleto.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      caption: `📄 Report DOX — ${nomeCompleto}`
    }, { quoted: m })
  } catch (e) {
    console.error('[DOX PDF] Errore:', e)
  }
}

handler.help = ['dox']
handler.tags = ['giochi']
handler.command = /^dox/i
handler.group = true

export default handler

function pickRandom(list) { return list[Math.floor(Math.random() * list.length)] }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randomHex() { return Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0') }
function pickRandomSet(arr, count) { return [...arr].sort(() => Math.random() - 0.5).slice(0, count) }

function generaCF(nome) {
  const cons = 'BCDFGHJKLMNPQRSTVWXYZ'
  const vows = 'AEIOU'
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let cf = ''
  const parts = nome.split(' ')
  const cognome = parts[parts.length - 1] || 'ROSSI'
  const nomePart = parts[0] || 'MARIO'
  for (let c of cognome.toUpperCase()) if (cons.includes(c) && cf.length < 3) cf += c
  for (let c of cognome.toUpperCase()) if (vows.includes(c) && cf.length < 3) cf += c
  while (cf.length < 3) cf += 'X'
  let ncf = ''
  for (let c of nomePart.toUpperCase()) if (cons.includes(c) && ncf.length < 3) ncf += c
  for (let c of nomePart.toUpperCase()) if (vows.includes(c) && ncf.length < 3) ncf += c
  while (ncf.length < 3) ncf += 'X'
  cf += ncf + randomInt(50, 99) + pickRandom(['A','B','C','D','E','H','L','M','P','R','S','T']) + randomInt(1, 30).toString().padStart(2, '0') + 'H501' + pickRandom(chars)
  return cf
}

// ---------- PDF ----------

// Rende il testo compatibile con WinAnsi/latin1 (accenti ok, simboli strani -> equivalenti)
function pdfSafe(str) {
  return String(str)
    .replace(/[—–]/g, '-')
    .replace(/[─━]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/•/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
}

function escapePDF(str) {
  return pdfSafe(str).replace(/[\\()]/g, '\\$&')
}

// A capo automatico
function wrapLine(line, max = 82) {
  const out = []
  let cur = ''
  for (const word of String(line).split(' ')) {
    if ((cur + ' ' + word).trim().length > max) {
      if (cur) out.push(cur)
      cur = word
    } else {
      cur = (cur + ' ' + word).trim()
    }
  }
  out.push(cur)
  return out
}

function generaPDFBuffer(data) {
  const ora = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })

  // Ogni riga: { t: testo, b: grassetto, s: dimensione }
  const righe = []
  const titolo = t => righe.push({ t, b: true, s: 20 })
  const sezione = t => { righe.push({ t: '', s: 11 }); righe.push({ t, b: true, s: 13 }) }
  const voce = (k, v) => wrapLine(`${k}: ${v}`).forEach(t => righe.push({ t, s: 11 }))

  titolo('888 BOT - DOX REPORT')

  sezione('IDENTITA')
  voce('Nome', data.nomeCompleto)
  voce('Telefono', data.telefonoFormattato)
  voce('Email', data.email)
  voce('Codice Fiscale', data.cf)
  voce('IP', data.ip)

  sezione('DISPOSITIVO')
  voce('Modello', data.dispositivo)
  voce('Sistema', data.os)
  voce('Browser', data.browser)
  voce('Batteria', data.batteria)
  voce('Storage', data.storage)
  voce('WhatsApp', 'v' + data.whVer)
  voce('MAC', data.mac)

  sezione('RETE & GEOLOCALIZZAZIONE')
  voce('ISP', data.isp)
  voce('Città', data.citta)
  voce('Coordinate', `${data.lat}, ${data.lon}`)
  voce('Piano Mobile', data.telefonoInfo)

  sezione('SICUREZZA')
  voce('Porte Aperte', data.porte)
  voce('Vulnerabilità', data.vuln)
  voce('Livello Sicurezza', `${data.punteggioSicurezza}/100 (${data.passProb})`)
  voce('Data Breach', data.dataBreach)

  sezione('SOCIAL')
  data.socialProfili.split('\n').forEach(l => voce(l.split(': ')[0], l.split(': ').slice(1).join(': ')))

  righe.push({ t: '', s: 11 })
  righe.push({ t: `Report generato il ${ora}`, s: 9 })
  righe.push({ t: 'Dati simulati - uso ricreativo', s: 9 })

  // Impaginazione
  const PAGE_W = 595, PAGE_H = 842, MARGIN_X = 50, TOP = 790, BOTTOM = 50
  const pagine = [[]]
  let y = TOP
  for (const r of righe) {
    const lh = r.s + 6
    if (y - lh < BOTTOM) { pagine.push([]); y = TOP }
    pagine[pagine.length - 1].push({ ...r, y })
    y -= lh
  }

  // Oggetti PDF: 1 catalog, 2 pages, 3 Helvetica, 4 Helvetica-Bold, poi (page, content) per ogni pagina
  const n = pagine.length
  const objs = []
  const kids = pagine.map((_, i) => `${5 + i * 2} 0 R`).join(' ')
  objs.push('<< /Type /Catalog /Pages 2 0 R >>')
  objs.push(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`)
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')

  pagine.forEach((righePag, i) => {
    const contentNum = 6 + i * 2
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentNum} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`)
    const stream = righePag
      .filter(r => r.t)
      .map(r => `BT /${r.b ? 'F2' : 'F1'} ${r.s} Tf ${MARGIN_X} ${r.y} Td (${escapePDF(r.t)}) Tj ET`)
      .join('\n')
    objs.push(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`)
  })

  // Costruzione file con offset reali
  let out = '%PDF-1.4\n'
  const offsets = []
  objs.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, 'latin1'))
    out += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xrefPos = Buffer.byteLength(out, 'latin1')
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  offsets.forEach(o => { out += `${String(o).padStart(10, '0')} 00000 n \n` })
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`

  return Buffer.from(out, 'latin1')
}
