//Plugin by 888 BOT
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

const handler = async (m, { conn, text, usedPrefix, command }) => {
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
  let key = await conn.reply(m.chat, `╔══════════════════════════╗
║  ⚡ *888 BOT DOX ENGINE v4.0* ⚡
╚══════════════════════════╝

🔍 *Avvio scansione OSINT...*
📡 *Bypassando nodi di rete...*
🛡️ *Eludendo firewall target...*

_La scansione richiede qualche secondo..._`, m)

  await new Promise(resolve => setTimeout(resolve, 3500))

  // Genera dati
  const numero = target.type === 'jid' ? target.value.split('@')[0] : '39' + Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')
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
  const dataBreach = Math.random() > 0.5 ? `Sì - ${randomInt(1, 8)} database compromessi` : 'Nessun breach rilevato'
  const socialProfili = `Instagram: @${nomeCompleto.toLowerCase().replace(/[^a-z0-9]/g, '_')}\nFacebook: ${nomeCompleto.replace(/ /g, '.')}\nTikTok: @${nomeCompleto.split(' ')[0].toLowerCase()}_${randomInt(100, 999)}`

  const reportText = `╔══════════════════════════╗
║    ☢️ *888 BOT DOX REPORT* ☢️
╚══════════════════════════╝

━━━━━━━━━━━━━━━━━━━
*🎯 DATI ANAGRAFICI*
━━━━━━━━━━━━━━━━━━━
• Nome: ${nomeCompleto}
• Telefono: ${telefonoFormattato}
• Email: ${email}
• CF: ${cf}
• IP: ${ip}

━━━━━━━━━━━━━━━━━━━
*📱 DISPOSITIVO*
━━━━━━━━━━━━━━━━━━━
• Modello: ${dispositivo}
• OS: ${os}
• Browser: ${browser}
• Batteria: ${batteria}
• Storage: ${storage}
• WhatsApp: v${whVer}
• MAC: ${mac}

━━━━━━━━━━━━━━━━━━━
*🌐 RETE & GEOLOC*
━━━━━━━━━━━━━━━━━━━
• ISP: ${isp}
• Città: ${citta}
• Coordinate: ${lat}, ${lon}
• Piano: ${telefonoInfo}

━━━━━━━━━━━━━━━━━━━
*🔓 VULNERABILITÀ*
━━━━━━━━━━━━━━━━━━━
• Porte: ${porte}
• Vuln: ${vuln}
• Score: ${punteggioSicurezza}/100 (${passProb})
• Breach: ${dataBreach}

━━━━━━━━━━━━━━━━━━━
*📡 SOCIAL*
━━━━━━━━━━━━━━━━━━━
${socialProfili}

━━━━━━━━━━━━━━━━━━━
⚠️ Report simulato a scopo ricreativo
${new Date().toLocaleString('it-IT')} | 888 BOT`.trim()

  const mentions = target.type === 'jid' ? [target.value] : []
  
  await conn.sendMessage(m.chat, { text: reportText, edit: key, mentions })

  try {
    const pdfBuffer = generaPDFBuffer({ nomeCompleto, telefonoFormattato, email, cf, ip, dispositivo, os, browser, batteria, storage, whVer, mac, isp, citta, lat, lon, telefonoInfo, porte, vuln, punteggioSicurezza, passProb, dataBreach, socialProfili })
    
    await conn.sendMessage(m.chat, {
      document: pdfBuffer,
      mimetype: 'application/pdf',
      fileName: `Dox_Report_${nomeCompleto.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      caption: `📄 *Report DOX* — ${nomeCompleto}`
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
function pickRandomSet(arr, count) { const s = [...arr].sort(() => Math.random() - 0.5); return s.slice(0, count) }

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
  cf += ncf + randomInt(50, 99).toString() + pickRandom(['A','B','C','D','E','H','L','M','P','R','S','T']) + randomInt(1, 30).toString().padStart(2, '0') + 'H501' + pickRandom(chars)
  return cf
}

function generaPDFBuffer(data) {
  const ora = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length 5 0 R >>
stream
BT
/F1 18 Tf
0 800 Td
(888 BOT DOX REPORT) Tj
/F2 10 Tf
0 -20 Td
(================================) Tj
0 -30 Td
(CLIENTE: ${escapePDF(data.nomeCompleto)}) Tj
0 -15 Td
(TELEFONO: ${escapePDF(data.telefonoFormattato)}) Tj
0 -15 Td
(EMAIL: ${escapePDF(data.email)}) Tj
0 -15 Td
(CF: ${escapePDF(data.cf)}) Tj
0 -15 Td
(IP: ${escapePDF(data.ip)}) Tj
0 -25 Td
(DISPOSITIVO: ${escapePDF(data.dispositivo)}) Tj
0 -15 Td
(OS: ${escapePDF(data.os)}) Tj
0 -15 Td
(BROWSER: ${escapePDF(data.browser)}) Tj
0 -15 Td
(BATTERIA: ${escapePDF(data.batteria)}) Tj
0 -15 Td
(STORAGE: ${escapePDF(data.storage)}) Tj
0 -15 Td
(WHATSAPP: v${escapePDF(data.whVer)}) Tj
0 -15 Td
(MAC: ${escapePDF(data.mac)}) Tj
0 -25 Td
(ISP: ${escapePDF(data.isp)}) Tj
0 -15 Td
(CITTA: ${escapePDF(data.citta)}) Tj
0 -15 Td
(COORDINATE: ${escapePDF(data.lat)}, ${escapePDF(data.lon)}) Tj
0 -15 Td
(PIANO TEL: ${escapePDF(data.telefonoInfo)}) Tj
0 -25 Td
(PORTE: ${escapePDF(data.porte)}) Tj
0 -15 Td
(VULN: ${escapePDF(data.vuln)}) Tj
0 -15 Td
(SICUREZZA: ${escapePDF(data.punteggioSicurezza)}/100 - ${escapePDF(data.passProb)}) Tj
0 -15 Td
(BREACH: ${escapePDF(data.dataBreach)}) Tj
0 -25 Td
(SOCIAL: ${escapePDF(data.socialProfili.split('\n').join(' | '))}) Tj
0 -30 Td
(Report generato il: ${escapePDF(ora)} | 888 BOT) Tj
0 -15 Td
(DATI SIMULATI - SOLO A SCOPO RICREATIVO) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000800 00000 n 
0000000865 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
930
%%EOF`

  return Buffer.from(pdf, 'utf-8')
}

function escapePDF(str) {
  return String(str).replace(/[\\()]/g, '\\$&').replace(/\n/g, ' | ')
}
