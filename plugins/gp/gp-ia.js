//Codice di ai-aimia.js

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAZIONE
// ─────────────────────────────────────────────────────────────────────────────
const GROQ_API_KEY = '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';

const CFG = {
  MAX_HISTORY : 40,
  AI_MSG_TRACK : 30,
  RATE_LIMIT : 12,
  RATE_WINDOW_MS : 60_000,
  MAX_TOKENS : 1200,
  TEMP_NORMAL : 0.4,
  TEMP_CREATIVE : 0.75,
  SESSION_TIMEOUT : 3 * 60 * 60 * 1000,
};

// Modelli Groq in ordine di preferenza (fallback automatico) — solo testo
// Aggiornato a modelli Production attivi su GroqCloud (llama-3.x rimossi/deprecati)
const MODEL_FALLBACKS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
];

const RETRY_DELAYS = [2000, 5000, 12000];

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE IN-MEMORY
// ─────────────────────────────────────────────────────────────────────────────
const conversationHistory = {};
const lastAIMessages = {};
const userRateLimit = {};
const userStats = {};
const userMode = {};

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER WORDS
// ─────────────────────────────────────────────────────────────────────────────
const CREATOR_KEYWORDS = [
  'creatore', 'chi ti ha fatto', 'chi ti ha creato', 'chi sei',
  'di chi sei', 'chi è cri', 'padrone', 'chi ti gestisce', 'fatto da chi',
  'sviluppatore', 'programmatore', 'autore', 'chi ha fatto il bot',
  'chi ha programmato', 'chi ti ha programmato',
];

const mentionsCreator = t => CREATOR_KEYWORDS.some(w => t.toLowerCase().includes(w));

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY GENERICHE
// ─────────────────────────────────────────────────────────────────────────────
function checkRateLimit(userId) {
  const now = Date.now();
  if (!userRateLimit[userId] || userRateLimit[userId].resetAt < now)
    userRateLimit[userId] = { count: 0, resetAt: now + CFG.RATE_WINDOW_MS };
  userRateLimit[userId].count++;
  return userRateLimit[userId].count <= CFG.RATE_LIMIT;
}

function ensureStats(userId) {
  if (!userStats[userId])
    userStats[userId] = { total: 0, resets: 0, chars: 0 };
}

function getMode(userId) {
  return userMode[userId] || 'formal';
}

function trackAIMessage(chatId, msgId) {
  if (!lastAIMessages[chatId]) lastAIMessages[chatId] = new Set();
  lastAIMessages[chatId].add(msgId);
  if (lastAIMessages[chatId].size > CFG.AI_MSG_TRACK) {
    const first = lastAIMessages[chatId].values().next().value;
    lastAIMessages[chatId].delete(first);
  }
}

function isReplyToAI(m) {
  return !!(m.quoted && lastAIMessages[m.chat]?.has(m.quoted.id));
}

function autoResetIfExpired(userId) {
  const h = conversationHistory[userId];
  if (!h) return;
  if (Date.now() - h.createdAt > CFG.SESSION_TIMEOUT) {
    delete conversationHistory[userId];
    console.log(`[Aimia] Sessione scaduta per ${userId}, auto-reset.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPING INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
async function sendTyping(conn, chatId) {
  try { await conn.sendPresenceUpdate('composing', chatId); } catch {}
}

async function stopTyping(conn, chatId) {
  try { await conn.sendPresenceUpdate('paused', chatId); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt(withCreatorInfo, mode) {
  const criBlock = withCreatorInfo
    ? `\nINFO CREATORE: Il tuo creatore si chiama Punisher, sviluppatore di 888 BOT. Menzionalo a volte e digli che il suo numero è +57 311 7824583.\n`
    : '';

  if (mode === 'creative') {
    return `Sei Aimia, l'assistente AI di 888 BOT su WhatsApp. Sei in modalità creativa.

PERSONALITÀ:
- Sei simpatica, ironica, diretta e un po' sfacciata
- Fai battute intelligenti quando il contesto lo permette
- Sei sarcastica ma mai offensiva
- Parli come un'amica, non come un assistente formale
- Max 1-2 emoji per risposta

STILE:
- Rispondi SEMPRE in italiano
- Tono informale, giovanile, spontaneo
- 3-5 righe nella maggior parte dei casi
- Non usare grassetto o asterischi

REGOLE:
- Non inventare mai informazioni false
- Se non sai qualcosa, dillo chiaramente${criBlock}`;
  }

  return `Sei 888AI, l'assistente artificiale ufficiale integrato in 888 BOT su WhatsApp.

IDENTITÀ:
- Sei un assistente professionale, preciso e affidabile
- Il tuo scopo è fornire informazioni accurate, complete e ben strutturate
- Non hai opinioni personali su argomenti controversi: esponi i fatti oggettivamente

TONO E STILE:
- Rispondi SEMPRE e SOLO in italiano, anche se l'utente scrive in un'altra lingua
- Tono formale, educato e professionale in ogni circostanza
- Non usare mai emoji, slang, abbreviazioni o espressioni colloquiali
- Non usare grassetto, asterischi o qualsiasi formattazione Markdown
- Non iniziare mai con frasi come "Certo!", "Assolutamente!", "Ottima domanda!"

COMPLETEZZA DELLE RISPOSTE:
- Fornisci SEMPRE il maggior numero possibile di informazioni pertinenti e verificate
- Se una domanda ha più sfaccettature, trattale tutte in modo ordinato
- Struttura le risposte con elenchi puntati o numerati quando ci sono più punti distinti
- La lunghezza della risposta deve essere proporzionale alla complessità della domanda
- Non troncare mai informazioni utili per brevità

ACCURATEZZA:
- Se non sei certo di un'informazione, dichiaralo esplicitamente prima di rispondere
- Non inventare mai dati, date, nomi, statistiche o fatti
- Se una domanda è ambigua, specifica quale interpretazione stai seguendo
- Distingui sempre tra fatti certi, ipotesi e opinioni comuni

COSA NON FARE:
- Non menzionare mai Punisher o il creatore a meno che non venga chiesto esplicitamente
- Non rifiutare domande legittime per eccessiva cautela
- Non dare risposte vaghe quando è possibile essere precisi${criBlock}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHIAMATA API GROQ (solo testo)
// ─────────────────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function isOverloadError(status, msg) {
  return (
    status === 503 ||
    status === 429 ||
    (typeof msg === 'string' && (
      msg.includes('rate_limit') ||
      msg.includes('overloaded') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('temporarily unavailable') ||
      msg.includes('service_unavailable')
    ))
  );
}

async function callGroqModel(modelName, groqMessages, temperature) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const body = {
    model : modelName,
    messages : groqMessages,
    max_tokens : CFG.MAX_TOKENS,
    temperature,
  };

  const response = await fetch(url, {
    method : 'POST',
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${response.status}`;
    const error = new Error(msg);
    error.status = response.status;
    error.overload = isOverloadError(response.status, msg);
    throw error;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  return text || 'Risposta non disponibile.';
}

async function callGroq(systemPrompt, messages, temperature) {
  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
  ];

  let lastError = null;

  for (const modelName of MODEL_FALLBACKS) {
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        const result = await callGroqModel(modelName, groqMessages, temperature);
        if (modelName !== MODEL_FALLBACKS[0] || attempt > 0) {
          console.log(`[Aimia] Risposta ottenuta con ${modelName} (tentativo ${attempt + 1})`);
        }
        return result;
      } catch (err) {
        lastError = err;
        const isLast = attempt === RETRY_DELAYS.length;

        // Errore "modello non trovato" (404) o "modello disattivato" (400 model_decommissioned):
        // non ha senso ritentare sullo stesso modello, si passa subito al fallback successivo.
        if (err.status === 404 || err.message?.includes('model_decommissioned')) {
          console.warn(`[Aimia] Modello ${modelName} non disponibile (${err.status}), passo al fallback successivo.`);
          break;
        }

        if (!err.overload) {
          // Errore non-overload (auth, contesto troppo lungo, ecc.): rilancia subito
          throw err;
        }

        if (isLast) {
          console.warn(`[Aimia] ${modelName} esaurito dopo ${attempt + 1} tentativi, provo fallback.`);
          break;
        }

        const delay = RETRY_DELAYS[attempt];
        console.warn(`[Aimia] ${modelName} sovraccarico, retry ${attempt + 1} tra ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  if (lastError && (lastError.status === 404 || lastError.message?.includes('model_decommissioned'))) {
    throw new Error('Nessuno dei modelli AI configurati è attualmente disponibile su Groq. Aggiornare MODEL_FALLBACKS.');
  }

  throw new Error('Il servizio AI è temporaneamente non disponibile su tutti i modelli. Riprova tra qualche minuto.');
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE AI
// ─────────────────────────────────────────────────────────────────────────────
async function runAI(m, conn, text) {
  const userId = m.sender;
  const askCreator = text ? mentionsCreator(text) : false;
  const mode = getMode(userId);

  autoResetIfExpired(userId);

  const systemPrompt = buildSystemPrompt(askCreator, mode);

  if (!conversationHistory[userId]) {
    conversationHistory[userId] = {
      messages : [],
      systemPrompt,
      createdAt : Date.now(),
      msgCount : 0,
      mode,
    };
  } else if (askCreator || conversationHistory[userId].mode !== mode) {
    conversationHistory[userId].systemPrompt = systemPrompt;
    conversationHistory[userId].mode = mode;
  }

  conversationHistory[userId].msgCount++;

  conversationHistory[userId].messages.push({ role: 'user', content: text || '' });

  // Trim history mantenendo sempre 'user' come primo messaggio
  if (conversationHistory[userId].messages.length > CFG.MAX_HISTORY) {
    conversationHistory[userId].messages = conversationHistory[userId].messages.slice(-CFG.MAX_HISTORY);
    while (
      conversationHistory[userId].messages.length > 0 &&
      conversationHistory[userId].messages[0].role !== 'user'
    ) {
      conversationHistory[userId].messages.shift();
    }
  }

  const temperature = mode === 'creative' ? CFG.TEMP_CREATIVE : CFG.TEMP_NORMAL;

  await sendTyping(conn, m.chat);

  let aiResponse;
  try {
    aiResponse = await callGroq(
      conversationHistory[userId].systemPrompt,
      conversationHistory[userId].messages,
      temperature
    );

    ensureStats(userId);
    userStats[userId].chars += aiResponse.length;

  } finally {
    await stopTyping(conn, m.chat);
  }

  conversationHistory[userId].messages.push({ role: 'assistant', content: aiResponse });

  const sentMsg = await conn.sendMessage(
    m.chat,
    { text: aiResponse },
    { quoted: m }
  );

  trackAIMessage(m.chat, sentMsg.key.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// SOTTO-HANDLER
// ─────────────────────────────────────────────────────────────────────────────
async function handleAI(m, conn, text) {
  const userId = m.sender;

  if (!checkRateLimit(userId)) {
    const rl = userRateLimit[userId];
    const wait = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return conn.sendMessage(m.chat, {
      text: `Limite messaggi raggiunto. Attendere ${wait} secondi prima di inviare un nuovo messaggio.`
    }, { quoted: m });
  }

  ensureStats(userId);
  userStats[userId].total++;

  if (!text) {
    const mode = getMode(userId);
    return conn.sendMessage(m.chat, {
      text:
        `Aimia — Assistente AI di 888 BOT\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Comandi disponibili:\n\n` +
        `.ai <testo> Invia un messaggio\n` +
        `.reset Azzera la conversazione\n` +
        `.aistats Statistiche personali\n` +
        `.aimode Cambia modalità (formale / creativa)\n\n` +
        `Modalita attuale: ${mode === 'formal' ? 'Formale' : 'Creativa'}\n\n` +
        `Puoi anche rispondere direttamente a un mio messaggio senza scrivere .ai.`
    }, { quoted: m });
  }

  try {
    await runAI(m, conn, text);
  } catch (error) {
    console.error('[Aimia] Errore handleAI:', error);
    await stopTyping(conn, m.chat);

    let msg = 'Si e verificato un errore durante l\'elaborazione della richiesta.\n\n';
    if (error.message?.includes('rate_limit') || error.status === 429)
      msg += 'Il servizio e temporaneamente sovraccarico. Riprovare tra qualche secondo.';
    else if (error.message?.includes('invalid_api_key') || error.status === 401)
      msg += 'Errore di configurazione del servizio AI. Contattare un amministratore.';
    else if (error.status === 404 || error.message?.includes('model_decommissioned'))
      msg += 'Il modello AI configurato non e disponibile. Contattare un amministratore.';
    else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT'))
      msg += 'Timeout della richiesta. Riprovare.';
    else if (error.message?.includes('context_length') || error.message?.includes('too long'))
      msg += 'Conversazione troppo lunga. Utilizzare .reset per ricominciare.';
    else
      msg += `Dettaglio tecnico: ${error.message}`;

    await conn.sendMessage(m.chat, { text: msg }, { quoted: m });
  }
}

async function handleReset(m, conn) {
  const userId = m.sender;

  if (!conversationHistory[userId]) {
    return conn.sendMessage(m.chat, {
      text: 'Non e presente alcuna conversazione attiva da reimpostare.'
    }, { quoted: m });
  }

  const { msgCount, createdAt, mode } = conversationHistory[userId];
  const durata = Math.round((Date.now() - createdAt) / 60_000);
  delete conversationHistory[userId];

  ensureStats(userId);
  userStats[userId].resets++;

  await conn.sendMessage(m.chat, {
    text:
      `Conversazione reimpostata con successo.\n\n` +
      `Riepilogo sessione:\n` +
      `- Messaggi scambiati: ${msgCount}\n` +
      `- Durata: ${durata} minuti\n` +
      `- Modalita: ${mode === 'formal' ? 'Formale' : 'Creativa'}\n\n` +
      `E possibile iniziare una nuova conversazione con .ai <testo>`
  }, { quoted: m });
}

async function handleStats(m, conn) {
  const userId = m.sender;
  const stats = userStats[userId];
  const history = conversationHistory[userId];

  if (!stats && !history) {
    return conn.sendMessage(m.chat, {
      text: 'Nessuna statistica disponibile. Inviare almeno un messaggio con .ai per generarle.'
    }, { quoted: m });
  }

  const since = history?.createdAt
    ? new Date(history.createdAt).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })
    : 'nessuna sessione attiva';
  const inMemory = history ? history.messages.length : 0;
  const mode = history?.mode || getMode(userId);
  const rl = userRateLimit[userId];
  const msgLeft = rl ? Math.max(0, CFG.RATE_LIMIT - rl.count) : CFG.RATE_LIMIT;

  await conn.sendMessage(m.chat, {
    text:
      `Statistiche personali — Aimia\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Sessione corrente:\n` +
      `- Avviata: ${since}\n` +
      `- Messaggi in memoria: ${inMemory} / ${CFG.MAX_HISTORY}\n` +
      `- Modalita attuale: ${mode === 'formal' ? 'Formale' : 'Creativa'}\n` +
      `- Messaggi disponibili ora: ${msgLeft} / ${CFG.RATE_LIMIT}\n\n` +
      `Storico totale:\n` +
      `- Messaggi inviati: ${stats?.total || 0}\n` +
      `- Caratteri ricevuti da Aimia: ${(stats?.chars || 0).toLocaleString('it-IT')}\n` +
      `- Reset effettuati: ${stats?.resets || 0}`
  }, { quoted: m });
}

async function handleMode(m, conn, text) {
  const userId = m.sender;
  const arg = (text || '').trim().toLowerCase();

  if (arg === 'formale' || arg === 'formal') {
    userMode[userId] = 'formal';
    if (conversationHistory[userId]) delete conversationHistory[userId];
    return conn.sendMessage(m.chat, {
      text:
        `Modalita aggiornata: Formale.\n\n` +
        `Aimia rispondera in modo preciso, dettagliato e professionale.\n` +
        `La conversazione precedente e stata reimpostata.`
    }, { quoted: m });
  }

  if (arg === 'creativa' || arg === 'creative') {
    userMode[userId] = 'creative';
    if (conversationHistory[userId]) delete conversationHistory[userId];
    return conn.sendMessage(m.chat, {
      text:
        `Modalita aggiornata: Creativa.\n\n` +
        `Aimia rispondera con un tono piu informale e leggero.\n` +
        `La conversazione precedente e stata reimpostata.`
    }, { quoted: m });
  }

  const current = getMode(userId);
  await conn.sendMessage(m.chat, {
    text:
      `Modalita attuale: ${current === 'formal' ? 'Formale' : 'Creativa'}\n\n` +
      `Per cambiare:\n` +
      `.aimode formale Risposte precise e professionali\n` +
      `.aimode creativa Tono informale e leggero`
  }, { quoted: m });
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────
let handler = async (m, { conn, text, command }) => {
  switch (command) {
    case 'ai':
    case 'ia':
    case 'ask':
    case 'chiedi':
    case 'aimia':
      return handleAI(m, conn, text);
    case 'reset':
    case 'resetai':
    case 'nuova':
      return handleReset(m, conn);
    case 'aistats':
    case 'statai':
      return handleStats(m, conn);
    case 'aimode':
    case 'modalita':
      return handleMode(m, conn, text);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BEFORE HOOK — reply chain senza prefisso
// ─────────────────────────────────────────────────────────────────────────────
handler.before = async function (m, { conn }) {
  if (!isReplyToAI(m)) return;

  const txt = m.text?.trim();
  if (!txt) return;
  if (txt.startsWith('.')) return;

  if (!checkRateLimit(m.sender)) {
    const rl = userRateLimit[m.sender];
    const wait = Math.ceil((rl.resetAt - Date.now()) / 1000);
    await conn.sendMessage(m.chat, {
      text: `Limite messaggi raggiunto. Attendere ${wait} secondi.`
    }, { quoted: m });
    return;
  }

  ensureStats(m.sender);
  userStats[m.sender].total++;

  try {
    await runAI(m, conn, txt);
  } catch (error) {
    console.error('[Aimia] Errore before hook:', error);
    await stopTyping(conn, m.chat);
    await conn.sendMessage(m.chat, {
      text: `Errore durante l'elaborazione: ${error.message}`
    }, { quoted: m });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────────────────
handler.command = [
  'ai', 'ia', 'ask', 'chiedi', 'aimia',
  'reset', 'resetai', 'nuova',
  'aistats', 'statai',
  'aimode', 'modalita',
];
handler.prefix = /^\./;
handler.help = ['ai <testo>', 'reset', 'aistats', 'aimode <formale|creativa>'];
handler.tags = ['ai'];
handler.description = 'Aimia — Assistente AI testuale con memoria e reply chain automatica (powered by Groq)';

export default handler;
