let B = null

export function init(baileysModule) {
  B = baileysModule
}

async function lib() {
  if (!B) {
    const mod = await import('@whiskeysockets/baileys')
    B = { ...(mod.default && typeof mod.default === 'object' ? mod.default : {}), ...mod }
  }
  return B
}

const isPrivateChat = (jid) => jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid')
const json = (o) => JSON.stringify(o)
const styleOf = (options) => String(options?.style ?? process.env.SFR_STYLE ?? 'v2').toLowerCase()

export function buildButton(b) {
  if (b.name && b.buttonParamsJson) return b
  const type = b.type || (b.url ? 'url' : b.code ? 'copy' : b.phone ? 'call' : b.sections ? 'list' : 'reply')
  switch (type) {
    case 'reply':
      return { name: 'quick_reply', buttonParamsJson: json({ display_text: b.text, id: b.id }) }
    case 'url':
      return {
        name: 'cta_url',
        buttonParamsJson: json({ display_text: b.text, url: b.url, merchant_url: b.url })
      }
    case 'copy':
      return {
        name: 'cta_copy',
        buttonParamsJson: json({ display_text: b.text, id: b.id || 'copy', copy_code: b.code })
      }
    case 'call':
      return {
        name: 'cta_call',
        buttonParamsJson: json({ display_text: b.text, phone_number: b.phone })
      }
    case 'list':
      return { name: 'single_select', buttonParamsJson: json({ title: b.text, sections: b.sections }) }
    default:
      throw new Error(`Tipo di pulsante sconosciuto: ${type}`)
  }
}

async function toBuffer(src) {
  if (typeof src !== 'string' || !/^https?:\/\//i.test(src)) return src
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10000)
  try {
    const res = await fetch(src, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  } finally {
    clearTimeout(timer)
  }
}

async function buildHeader(sock, { title = '', image, video }, attempts = 2) {
  const header = { title, subtitle: '', hasMediaAttachment: false }
  const src = image || video
  if (!src) return header
  const kind = image ? 'image' : 'video'
  let lastError
  for (let i = 0; i < attempts; i++) {
    try {
      const data = await toBuffer(src)
      const media = await (await lib()).prepareWAMessageMedia(
        { [kind]: Buffer.isBuffer(data) ? data : typeof data === 'string' ? { url: data } : data },
        { upload: sock.waUploadToServer }
      )
      header.hasMediaAttachment = true
      header.title = ''
      if (media.imageMessage) header.imageMessage = media.imageMessage
      if (media.videoMessage) {
        media.videoMessage.gifPlayback = true
        header.videoMessage = media.videoMessage
      }
      return header
    } catch (err) {
      lastError = err
    }
  }
  console.warn(`[sfr-baileys] media non caricato (${lastError?.message}), invio senza`)
  return header
}

function cleanHeader(h) {
  if (!h) return undefined
  const out = {}
  if (h.title) out.title = h.title
  if (h.subtitle) out.subtitle = h.subtitle
  if (h.hasMediaAttachment) out.hasMediaAttachment = true
  if (h.imageMessage) out.imageMessage = h.imageMessage
  if (h.videoMessage) out.videoMessage = h.videoMessage
  if (!out.title && !out.hasMediaAttachment) return undefined
  return out
}

function withHeader(obj, header) {
  const clean = cleanHeader(header)
  return clean ? { header: clean, ...obj } : obj
}

function wrapInteractive(interactiveMessage, style) {
  if (style === 'v2') {
    const nf = interactiveMessage.nativeFlowMessage
    if (nf) {
      delete nf.messageParamsJson
      if (nf.messageVersion === undefined) nf.messageVersion = 1
    }
    const h = interactiveMessage.header
    if (h) {
      if (!h.hasMediaAttachment && !h.title) delete interactiveMessage.header
      else delete h.subtitle
    }
    return { viewOnceMessageV2: { message: { interactiveMessage } } }
  }
  return {
    viewOnceMessage: {
      message: {
        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
        interactiveMessage
      }
    }
  }
}

function botNode(jid) {
  return isPrivateChat(jid) && process.env.SFR_BOT_NODE !== '0'
    ? [{ tag: 'bot', attrs: { biz_bot: '1' } }]
    : []
}

async function relay(sock, jid, interactiveMessage, options = {}) {
  const content = wrapInteractive(interactiveMessage, styleOf(options))
  const msg = (await lib()).generateWAMessageFromContent(jid, content, {
    userJid: sock.user.id,
    quoted: options.quoted
  })
  const additionalNodes = [
    {
      tag: 'biz',
      attrs: {},
      content: [
        {
          tag: 'interactive',
          attrs: { type: 'native_flow', v: '1' },
          content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
        }
      ]
    },
    ...botNode(jid)
  ]
  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id, additionalNodes })
  return msg
}

function withContext(interactiveMessage, { mentions, newsletter, contextInfo: originalContextInfo } = {}) {
  const contextInfo = { ...(originalContextInfo || {}) }
  if (mentions?.length) {
    contextInfo.mentionedJid = [...new Set([...(contextInfo.mentionedJid || []), ...mentions])]
  }
  if (newsletter?.jid) {
    Object.assign(contextInfo, {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: newsletter.jid,
        newsletterName: newsletter.name || '',
        serverMessageId: -1
      }
    })
  }
  if (Object.keys(contextInfo).length) interactiveMessage.contextInfo = contextInfo
  return interactiveMessage
}

export async function sendInteractive(sock, jid, content, options) {
  const { text = ' ', footer = '', buttons = [] } = content
  const interactive = withContext(
    withHeader(
      {
        body: { text },
        footer: { text: footer },
        nativeFlowMessage: { buttons: buttons.map(buildButton), messageParamsJson: '' }
      },
      await buildHeader(sock, content)
    ),
    content
  )
  return relay(sock, jid, interactive, options)
}

export const CAROUSEL_VARIANTS = ['classic', 'classic-nobiz', 'direct', 'v2-header']

function plainHeader(h) {
  const out = { title: h.title || '', hasMediaAttachment: Boolean(h.hasMediaAttachment) }
  if (h.imageMessage) out.imageMessage = h.imageMessage
  if (h.videoMessage) out.videoMessage = h.videoMessage
  return out
}

function bizNodes(jid) {
  return [
    {
      tag: 'biz',
      attrs: {},
      content: [
        {
          tag: 'interactive',
          attrs: { type: 'native_flow', v: '1' },
          content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
        }
      ]
    },
    ...botNode(jid)
  ]
}

async function relayCarousel(sock, jid, interactive, variant, quoted) {
  let content
  if (variant === 'direct') {
    content = { interactiveMessage: interactive }
  } else if (variant === 'v2-header') {
    content = { viewOnceMessageV2: { message: { interactiveMessage: interactive } } }
  } else {
    content = {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: interactive
        }
      }
    }
  }
  const msg = (await lib()).generateWAMessageFromContent(jid, content, {
    userJid: sock.user.id,
    quoted
  })
  const relayOptions = { messageId: msg.key.id }
  if (variant !== 'classic-nobiz') relayOptions.additionalNodes = bizNodes(jid)
  await sock.relayMessage(jid, msg.message, relayOptions)
  return msg
}

export async function sendCarousel(sock, jid, content, options = {}) {
  const requested = String(options.variant ?? process.env.SFR_CAROUSEL ?? 'direct').toLowerCase()
  const variant = CAROUSEL_VARIANTS.includes(requested) ? requested : 'direct'
  const clean = variant === 'direct' || variant === 'v2-header'
  const { text = ' ', footer = '', cards = [] } = content

  const built = await Promise.all(
    cards.map(async (c) => {
      const header = await buildHeader(sock, c)
      if ((c.image || c.video) && !header.hasMediaAttachment) return null
      const card = {
        body: { text: c.text || '' },
        footer: { text: c.footer || '' },
        nativeFlowMessage: { buttons: (c.buttons || []).map(buildButton) }
      }
      const cardHeader = clean ? cleanHeader(header) : plainHeader(header)
      return cardHeader ? { header: cardHeader, ...card } : card
    })
  )
  const ready = built.filter(Boolean)
  if (!ready.length) throw new Error('nessuna copertina caricata')

  const carouselMessage = { cards: ready }
  if (clean) carouselMessage.messageVersion = 1
  if (variant === 'direct') carouselMessage.carouselCardType = 1

  const interactive = withContext(
    {
      header: { title: content.title || 'Risultati', hasMediaAttachment: false },
      body: { text },
      footer: { text: footer },
      carouselMessage
    },
    content
  )
  return relayCarousel(sock, jid, interactive, variant, options.quoted)
}

export async function sendNativeList(sock, jid, { buttonText = 'Menu', sections = [], ...rest }, options) {
  return sendInteractive(
    sock,
    jid,
    { ...rest, buttons: [{ type: 'list', text: buttonText, sections }] },
    options
  )
}

export async function sendListMessage(sock, jid, content, options = {}) {
  const { title = '', text = ' ', footer = '', buttonText = 'Menu', sections = [] } = content
  const message = {
    listMessage: {
      title,
      description: text,
      footerText: footer,
      buttonText,
      listType: 1,
      sections: sections.map((s) => ({
        title: s.title || '',
        rows: (s.rows || []).map((r) => ({
          title: r.title,
          description: r.description || '',
          rowId: r.rowId ?? r.id
        }))
      }))
    }
  }
  const msg = (await lib()).generateWAMessageFromContent(jid, message, {
    userJid: sock.user.id,
    quoted: options.quoted
  })
  const additionalNodes = []
  if (process.env.SFR_LIST_NODE !== '0') {
    additionalNodes.push({
      tag: 'biz',
      attrs: {},
      content: [{ tag: 'list', attrs: { type: 'product_list', v: '2' } }]
    })
  }
  const relayOptions = { messageId: msg.key.id, additionalNodes }
  if (options.asMedia) relayOptions.additionalAttributes = { type: 'media' }
  await sock.relayMessage(jid, msg.message, relayOptions)
  return msg
}

export function getButtonReply(m) {
  const msg = m?.message
  if (!msg) return null
  const flow = msg.interactiveResponseMessage?.nativeFlowResponseMessage
  if (flow?.paramsJson) {
    try {
      const p = JSON.parse(flow.paramsJson)
      return p.id ?? p.selectedId ?? null
    } catch {
      return null
    }
  }
  return (
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg.templateButtonReplyMessage?.selectedId ||
    null
  )
}

export function getText(m) {
  const msg = m?.message
  if (!msg) return ''
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    ''
  )
}
