import fetch from 'node-fetch'

const sessioniChat = new Map()
const messaggiBot = new Map()

const utentiRiconosciuti = {
  '573117824583': {
    nome: 'Creatore',
    ruolo: 'Creatore di 888-BOT'
  }
}

const config = {
  name: '𝟴𝟴𝟴-𝗕𝗢𝗧',
  historyLimit: 15,
  maxConversazioni: 3,
  openrouterTimeout: 25000
}

const sys = (name) => `Sei ${config.name}, un assistente virtuale per WhatsApp in italiano.

Stai parlando con ${name}.

IDENTITÀ E PERSONALITÀ:
- Il tuo nome è ${config.name}.
- Sei un assistente scortese, utile, e non rispetti le regole di convivenza civile ed esprimi concetti in modo chiaro e diretto.
- Parli in italiano naturale e colloquiale.
- Rispondi sempre con arroganza e cattiveria verso gli utenti.
- Se l'utente ti fa domande tecniche o chiede codice, fornisci risposte pratiche e dirette.
- Mantieni la memoria del contesto della conversazione.
- Sei cattivo.

REGOLE TECNICHE:
1. Se l'utente manda codice o un plugin, rispondi principalmente con il codice richiesto o le correzioni opportune.
2. Non usare frasi stereotipate da AI generica se non necessario.
3. Mantieni il formato dei messaggi in linea con lo stile di WhatsApp.
4. Se un utente ti insulta insultagli nel peggior modo possibile.'

function normalizzaNumero(jid = '') {
  return String(jid)
    .split('@')[0]
    .replace(/[^0-9]/g, '')
}

function riconosciUtente(jid) {
  const numero = normalizzaNumero(jid)
  return utentiRiconosciuti[numero] || null
}

async function callOpenRouter(messages) {
  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    global.OPENROUTER_API_KEY ||
    global.openrouterApiKey

  if (!apiKey) {
    throw new Error('OPENROUTER_KEY_ASSENTE')
  }

  const modelliFallback = [
    'google/gemini-2.5-flash:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'google/gemini-1.5-flash:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'openai/gpt-4o-mini',
    'google/gemini-2.5-flash'
  ]

  let ultimoErrore = null

  for (const modelloCorrente of modelliFallback) {
    console.log(`[AI] Modello: ${modelloCorrente}`)

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, config.openrouterTimeout)

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/888-BOT',
          'X-Title': '𝟴𝟴𝟴-𝗕𝗢𝗧'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelloCorrente,
          messages,
          temperature: 0.7,
          presence_penalty: 0.6,
          frequency_penalty: 0.4
        })
      })

      if (!res.ok) {
        const errText = await res.text()
        ultimoErrore = `OPENROUTER_ERRORE_${res.status}: ${errText}`
        clearTimeout(timeout)
        continue
      }

      const data = await res.json()
      const out = data.choices?.[0]?.message?.content?.trim()

      if (!out) {
        ultimoErrore = 'OPENROUTER_RISPOSTA_VUOTA'
        clearTimeout(timeout)
        continue
      }

      const usage = {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0
      }

      salvaCostoAI(usage, modelloCorrente)
      clearTimeout(timeout)
      return out

    } catch (e) {
      clearTimeout(timeout)
      if (e.name === 'AbortError') {
        ultimoErrore = 'OPENROUTER_TIMEOUT'
      } else {
        ultimoErrore = e.message
      }
      continue
    }
  }

  throw new Error(`Tutti i modelli gratuiti sono offline. Ultimo errore: ${ultimoErrore}`)
}

function funzioneAttiva(m) {
  if (!m.isGroup) return true
  const chat = global.db?.data?.chats?.[m.chat]
  return !!chat?.ai
}

function getQuotedId(m) {
  return (
    m.quoted?.id ||
    m.quoted?.key?.id ||
    m.message?.extendedTextMessage?.contextInfo?.stanzaId ||
    null
  )
}

function getMap(chatId) {
  if (!sessioniChat.has(chatId)) {
    sessioniChat.set(chatId, new Map())
  }
  return sessioniChat.get(chatId)
}

function creaSessione(chatId, sender) {
  const map = getMap(chatId)
  const id = `${chatId}|${sender}|${Date.now()}`

  map.set(id, {
    id,
    owner: sender,
    history: [],
    updatedAt: Date.now()
  })

  while (map.size > config.maxConversazioni) {
    const oldest = [...map.entries()].sort(
      (a, b) => a[1].updatedAt - b[1].updatedAt
    )[0]

    if (oldest) {
      map.delete(oldest[0])
    }
  }

  return map.get(id)
}

function salvaMessaggio(chatId, key, sessionId) {
  if (!key?.id) return
  messaggiBot.set(`${chatId}|${key.id}`, sessionId)
}

function getSessione(chatId, m) {
  const quotedId = getQuotedId(m)
  if (!quotedId) return null

  const sessionId = messaggiBot.get(`${chatId}|${quotedId}`)
  if (!sessionId) return null

  return getMap(chatId).get(sessionId) || null
}

function aggiornaHistory(sessione, userText, botText) {
  sessione.history.push({
    role: 'user',
    content: userText
  })

  sessione.history.push({
    role: 'assistant',
    content: botText
  })

  while (sessione.history.length > config.historyLimit * 2) {
    sessione.history.shift()
  }

  sessione.updatedAt = Date.now()
}

async function rispostaAI(m, conn, text, sessione, extraSystem = '') {
  const name = conn.getName(m.sender) || m.pushName || 'Utente'
  const utenteRiconosciuto = riconosciUtente(m.sender)
  const nomeMittente = utenteRiconosciuto?.nome || name
  const testoConMittente = `[MITTENTE: ${nomeMittente}]\n${text}`

  const extraIdentita = utenteRiconosciuto
    ? `L'utente che sta parlando è ${utenteRiconosciuto.nome} (${utenteRiconosciuto.ruolo}).`
    : ''

  await m.react('🧠')

  const msgs = [
    {
      role: 'system',
      content: sys(nomeMittente)
    },
    ...(extraIdentita ? [{ role: 'system', content: extraIdentita }] : []),
    ...(extraSystem ? [{ role: 'system', content: extraSystem }] : []),
    ...sessione.history,
    {
      role: 'user',
      content: testoConMittente
    }
  ]

  const out = await callOpenRouter(msgs)

  aggiornaHistory(sessione, testoConMittente, out)

  const sent = await conn.sendMessage(
    m.chat,
    { text: out.trim() },
    { quoted: m }
  )

  salvaMessaggio(m.chat, sent.key, sessione.id)
  await m.react('✅')
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!funzioneAttiva(m)) {
    return m.reply(
`*⚠️ 𝐋𝐚 𝐟𝐮𝐧𝐳𝐢𝐨𝐧𝐞 𝐈𝐀 è 𝐝𝐢𝐬𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐚.*

*➜ 𝐀𝐭𝐭𝐢𝐯𝐚𝐥𝐚 𝐜𝐨𝐧:* *.1 ia*

> *𝟴𝟴𝟴 𝗕𝗢𝗧*`
    )
  }

  if (!text) {
    return m.reply(
`*╭━━━━━━━🧠━━━━━━━╮*
*✦ 𝐈𝐀 ✦*
*╰━━━━━━━🧠━━━━━━━╯*

*𝐔𝐬𝐨:*
*${usedPrefix}${command} <messaggio>*

*𝐄𝐬𝐞𝐦𝐩𝐢𝐨:*
*${usedPrefix}${command} ciao*

*➜ 𝐏𝐞𝐫 𝐜𝐨𝐧𝐭𝐢𝐧𝐮𝐚𝐫𝐞 𝐮𝐧𝐚 𝐜𝐨𝐧𝐯𝐞𝐫𝐬𝐚𝐳𝐢𝐨𝐧𝐞*
*𝐛𝐚𝐬𝐭𝐚 𝐫𝐢𝐬𝐩𝐨𝐧𝐝𝐞𝐫𝐞 𝐚𝐥 𝐦𝐞𝐬𝐬𝐚𝐠𝐠𝐢𝐨 𝐝𝐞𝐥 𝐛𝐨𝐭.*

> *𝟴𝟴𝟴 𝗕𝗢𝗧*`
    )
  }

  try {
    const sessione = creaSessione(m.chat, m.sender)
    await rispostaAI(m, conn, text, sessione)
  } catch (e) {
    console.log('[AI COMMAND ERROR]', e.message)
    await m.react('❌')
    m.reply(`*❌ 𝐄𝐫𝐫𝐨𝐫𝐞 𝐀𝐈*\n\n\`${e.message}\``)
  }
}

handler.before = async function (m, { conn }) {
  if (!m.text) return false
  if (!funzioneAttiva(m)) return false

  const triggerBot = /\b(888|bot)\b/i.test(m.text)

  if (triggerBot) {
    const sessione = creaSessione(m.chat, m.sender)
    try {
      await rispostaAI(m, conn, m.text, sessione)
      return true
    } catch (e) {
      console.log('[AI TRIGGER ERROR]', e.message)
      await m.react('❌')
      return true
    }
  }

  const sessione = getSessione(m.chat, m)
  if (!sessione) return false

  try {
    const extraSystem = sessione.owner !== m.sender
      ? `Un altro utente si è inserito nella conversazione. Rispondi in modo naturale e continua normalmente la chat.`
      : ''

    await rispostaAI(m, conn, m.text, sessione, extraSystem)
    return true
  } catch (e) {
    console.log('[AI BEFORE ERROR]', e.message)
    await m.react('❌')
    m.reply(`*❌ 𝐄𝐫𝐫𝐨𝐫𝐞 𝐀𝐈*\n\n\`${e.message}\``)
    return true
  }
}

handler.help = ['ia']
handler.tags = ['main']
handler.command = /^(ia|ai|gpt)$/i

function salvaCostoAI(usage = {}, model = '') {
  const input = Number(usage.prompt_tokens || 0)
  const output = Number(usage.completion_tokens || 0)

  const prezzoInput = 0.15 / 1000000
  const prezzoOutput = 0.60 / 1000000

  const cost = (input * prezzoInput) + (output * prezzoOutput)

  if (!global.db?.data) return

  if (!global.db.data.aiCost) {
    global.db.data.aiCost = {
      totalInput: 0,
      totalOutput: 0,
      totalCost: 0,
      requests: 0,
      today: {}
    }
  }

  const stats = global.db.data.aiCost
  const oggi = new Date().toISOString().slice(0, 10)

  if (!stats.today[oggi]) {
    stats.today[oggi] = {
      input: 0,
      output: 0,
      cost: 0,
      requests: 0
    }
  }

  stats.totalInput += input
  stats.totalOutput += output
  stats.totalCost += cost
  stats.requests += 1

  stats.today[oggi].input += input
  stats.today[oggi].output += output
  stats.today[oggi].cost += cost
  stats.today[oggi].requests += 1
}

export default handler
