// Plugin by Elixir

const BATCH_MS = 5000;
const DEDUP_TTL_MS = 60000;

const JOIN_REQUEST_STUB = 172;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const numeriOwner = () => {
  const raw = global.owner || [];
  return raw.map((v) => String(Array.isArray(v) ? v[0] : v?.jid || v?.numero || v?.number || v).replace(/\D/g, ''));
};

const jidNum = (jid) => String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');

const isOwner = (jid) => {
  const n = jidNum(jid);
  return !!n && numeriOwner().includes(n);
};

const sameUser = (a, b) => !!a && !!b && jidNum(a) === jidNum(b);

const bloccaSubito = (chiave) => {
  if (!global.accettaownerDedup) global.accettaownerDedup = new Map();
  const now = Date.now();
  for (const [k, t] of global.accettaownerDedup) {
    if (now - t > DEDUP_TTL_MS) global.accettaownerDedup.delete(k);
  }
  if (global.accettaownerDedup.has(chiave)) return true;
  global.accettaownerDedup.set(chiave, now);
  return false;
};

const antiSpamVisto = (chiave) => {
  if (!global.accettaownerDedup) global.accettaownerDedup = new Map();
  return global.accettaownerDedup.has(chiave);
};

const risolviOwner = async (conn, chatId, partecipante) => {
  if (!String(partecipante || '').endsWith('@lid')) {
    return isOwner(partecipante) ? partecipante : null;
  }
  let richieste = [];
  try {
    richieste = (await conn.groupRequestParticipantsList(chatId)) || [];
  } catch {
    return null;
  }
  const trovata = richieste.find((r) =>
    [r?.jid, r?.rawJid, r?.lid, r?.id].filter(Boolean)
      .some((x) => String(x).toLowerCase() === String(partecipante).toLowerCase()));
  if (!trovata) return null;
  const candidato = trovata.jid || trovata.rawJid || partecipante;
  return isOwner(candidato) ? candidato : null;
};

const botAdminMeta = async (conn, chatId) => {
  let meta = null;
  try {
    meta = await conn.groupMetadata(chatId);
  } catch {
    return null;
  }
  if (!meta || !Array.isArray(meta.participants)) return null;
  const me = (conn.user && (conn.user.jid || conn.user.id)) || '';
  const io = meta.participants.find((p) => sameUser(p.id, me) || sameUser(p.jid, me) || sameUser(p.lid, me));
  if (!io || (io.admin !== 'admin' && io.admin !== 'superadmin')) return null;
  return meta;
};

const codaBatch = (chatId) => {
  if (!global.accettaownerBatch) global.accettaownerBatch = {};
  if (!global.accettaownerBatch[chatId]) {
    global.accettaownerBatch[chatId] = { owner: [], timer: null };
  }
  return global.accettaownerBatch[chatId];
};

const forzaPluginAttivo = () => {
  if (!global.plugins) return;
  for (const [key, plugin] of Object.entries(global.plugins)) {
    if (!plugin) continue;
    const short = String(key).split(/[\\/]/).pop()?.toLowerCase() || '';
    if (short === 'owner-accettaowner.js') plugin.disabled = false;
  }
};

const scaricaBatch = async (conn, chatId) => {
  const batch = global.accettaownerBatch?.[chatId];
  if (!batch || batch.owner.length === 0) return;
  delete global.accettaownerBatch[chatId];
  const menzioni = batch.owner.map((o) => o.who).filter(Boolean);
  const righe = batch.owner.map((o) => `• @${jidNum(o.who)}`).join('\n');
  const nota = batch.owner.some((o) => o.promozioneFallita)
    ? '\n\n⚠️ Uno o più owner sono stati accettati ma la promozione a admin non è andata a buon fine.'
    : '';
  try {
    await conn.sendMessage(chatId, {
      text: `👑 *Owner accettati e promossi automaticamente ad amministratori:*\n${righe}${nota}`,
      mentions: menzioni,
    });
  } catch {}
};

const accodaMessaggio = (conn, chatId, who, promozioneFallita) => {
  const batch = codaBatch(chatId);
  if (!batch.owner.some((o) => sameUser(o.who, who))) {
    batch.owner.push({ who, promozioneFallita: !!promozioneFallita });
  } else if (promozioneFallita) {
    batch.owner.find((o) => sameUser(o.who, who)).promozioneFallita = true;
  }
  if (batch.timer) clearTimeout(batch.timer);
  batch.timer = setTimeout(() => scaricaBatch(conn, chatId), BATCH_MS);
};

const gestisciRichiesta = async (conn, chatId, partecipante) => {
  try {
    if (!chatId || !String(chatId).endsWith('@g.us')) return;
    if (!partecipante) return;
    const baseChiave = `${chatId}:${jidNum(partecipante)}`;
    if (bloccaSubito(baseChiave)) return;
    const who = await risolviOwner(conn, chatId, partecipante);
    if (!who) return;
    const chiave = `${chatId}:${jidNum(who)}`;
    if (chiave !== baseChiave && bloccaSubito(chiave)) return;
    const meta = await botAdminMeta(conn, chatId);
    if (!meta) return;
    const membro = meta.participants.find((p) => sameUser(p.id, who) || sameUser(p.jid, who) || sameUser(p.lid, who));
    const giaAdmin = membro && (membro.admin === 'admin' || membro.admin === 'superadmin');
    try {
      await conn.groupRequestParticipantsUpdate(chatId, [who], 'approve');
    } catch {
      return;
    }
    await delay(1500);
    let promozioneFallita = false;
    if (!giaAdmin) {
      try {
        await conn.groupParticipantsUpdate(chatId, [who], 'promote');
      } catch {
        promozioneFallita = true;
      }
    }
    let whoFinale = who;
    try {
      if (conn.decodeJid) whoFinale = conn.decodeJid(who);
    } catch {}
    accodaMessaggio(conn, chatId, whoFinale, promozioneFallita);
  } catch {}
};

const onJoinRequest = (conn) => (update) => {
  try {
    const { id, action, participant } = update || {};
    if (!id || action !== 'created' || !participant) return;
    gestisciRichiesta(conn, id, participant);
  } catch {}
};

const onMessagesUpsert = (conn) => ({ messages } = {}) => {
  try {
    for (const msg of messages || []) {
      if (!msg || msg.messageStubType !== JOIN_REQUEST_STUB) continue;
      const chatId = msg.key?.remoteJid;
      const params = msg.messageStubParameters || [];
      if (params[1] && params[1] !== 'created') continue;
      const who = params[0] || msg.key?.participant || '';
      if (!chatId || !who) continue;
      gestisciRichiesta(conn, chatId, who);
    }
  } catch {}
};

const collegaListener = () => {
  const conn = global.conn;
  if (!conn?.ev?.on) return false;
  if (global.accettaownerListenerOn) return true;
  global.accettaownerListenerOn = true;
  conn.ev.on('group.join-request', onJoinRequest(conn));
  conn.ev.on('messages.upsert', onMessagesUpsert(conn));
  return true;
};

const initPlugin = () => {
  if (global.accettaownerInitDone) return;
  global.accettaownerInitDone = true;
  forzaPluginAttivo();

  if (!collegaListener()) {
    const interval = setInterval(() => {
      forzaPluginAttivo();
      if (collegaListener()) clearInterval(interval);
    }, 1000);
  }
};

initPlugin();

export const disabled = false;

export default {
  disabled: false,
  all: async () => {},
  before: async () => false,
};
