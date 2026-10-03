'use strict'

const HTML_ENTITIES = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
  '&quot;': '"', "'": "'", '&apos;': "'", '&copy;': '©',
  '&reg;': '®', '&euro;': '€', '&pound;': '£', '&yen;': '¥'
}

const ALLOWED_TAGS = new Set([
  'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
  'img', 'video', 'source', 'table', 'tr', 'td', 'th', 'tbody',
  'thead', 'form', 'input', 'button', 'select', 'textarea',
  'iframe'
])

const DANGEROUS_ATTRIBUTES = /on\w+|javascript:|data:|vbscript:/gi

function sanitizeHtml(html = '') {
  if (typeof html !== 'string') return ''
  
  let result = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  result = result.replace(/<(\w+)([^>]*)>/g, (match, tag, attrs) => {
    if (!ALLOWED_TAGS.has(tag.toLowerCase())) {
      return ''
    }
    
    const cleanAttrs = attrs
      .replace(DANGEROUS_ATTRIBUTES, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    return `<${tag}${cleanAttrs ? ' ' + cleanAttrs : ''}>`
  })

  return result.trim()
}

function stripHtml(html = '') {
  if (typeof html !== 'string') return ''
  
  let text = sanitizeHtml(html)
    .replace(/<\/?(p|div|h1|h2|h3|h4|h5|h6|li|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')

  Object.entries(HTML_ENTITIES).forEach(([entity, char]) => {
    text = text.split(entity).join(char)
  })
  
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))

  return text.trim()
}

function renderLife(life = 5, max = 5) {
  const current = Math.max(0, Math.min(max, Math.floor(Number(life) || 0)))
  const empty = Math.max(0, max - current)
  
  if (max <= 0) return ''
  return '❤️'.repeat(current) + '🖤'.repeat(empty)
}

function normalizeButtons(buttons = []) {
  return (Array.isArray(buttons) ? buttons : [])
    .slice(0, 3)
    .filter(b => b && (b.id || b.buttonId || b.text || b.title))
    .map((b, i) => {
      const id = String(b.id ?? b.buttonId ?? `btn_${i + 1}`)
      const text = String(b.text ?? b.title ?? `Opzione ${i + 1}`).slice(0, 20)
      
      return {
        buttonId: id,
        buttonText: { displayText: text },
        type: 1
      }
    })
}

function validateMessageData(data = {}) {
  if (typeof data !== 'object' || data === null) {
    return {}
  }

  return {
    title: typeof data.title === 'string' ? data.title.slice(0, 50) : '',
    status: typeof data.status === 'string' ? data.status : '',
    life: Number.isFinite(data.life) ? data.life : undefined,
    html: typeof data.html === 'string' ? sanitizeHtml(data.html) : '',
    body: typeof data.body === 'string' ? sanitizeHtml(data.body) : '',
    text: typeof data.text === 'string' ? data.text : '',
    footer: typeof data.footer === 'string' ? data.footer.slice(0, 60) : '',
    url: typeof data.url === 'string' ? data.url : '',
    trustedSources: Array.isArray(data.trustedSources) ? data.trustedSources : [],
    buttons: Array.isArray(data.buttons) ? data.buttons : [],
    quoted: data.quoted || null,
    mentions: Array.isArray(data.mentions) ? data.mentions : []
  }
}

function buildPlain(validated = {}) {
  const parts = []
  
  if (validated.title) parts.push(validated.title)
  if (validated.status) parts.push(validated.status)
  if (validated.life !== undefined) {
    parts.push(`Vita: ${renderLife(validated.life)}`)
  }
  
  const htmlBody = validated.html || validated.body || validated.text
  if (htmlBody) {
    parts.push(stripHtml(htmlBody))
  }
  
  if (validated.footer) parts.push(validated.footer)
  
  return parts.join('\n').trim()
}

async function sendHtmlApp(conn, jid, data = {}, options = {}) {
  if (!conn || typeof conn.sendMessage !== 'function') {
    throw new Error('[sendHtmlApp] Connection non valida')
  }
  if (typeof jid !== 'string') {
    throw new Error('[sendHtmlApp] JID non valido')
  }

  const validated = validateMessageData(data)
  const plainText = buildPlain(validated)
  const buttons = normalizeButtons(validated.buttons)
  
  const msgOptions = {
    quoted: validated.quoted || options.quoted || undefined,
    mentions: validated.mentions.length ? validated.mentions : (options.mentions || []),
    ...options
  }

  try {
    if (typeof conn.sendRichMessage === 'function' && validated.html) {
      try {
        return await conn.sendRichMessage(jid, validated.html, {
          title: validated.title || 'App',
          footer: validated.footer,
          url: validated.url,
          trustedSources: validated.trustedSources,
          buttons,
          ...msgOptions
        })
      } catch (e) {
        console.warn('[sendHtmlApp] RichMessage non supportato dal ricevente:', e.message)
      }
    }

    if (buttons.length && typeof conn.sendButton === 'function') {
      try {
        return await conn.sendButton(jid, plainText, validated.footer, buttons, msgOptions)
      } catch (e) {
        console.warn('[sendHtmlApp] sendButton fallito:', e.message)
      }
    }

    return await conn.sendMessage(jid, { text: plainText }, msgOptions)
    
  } catch (error) {
    console.error('[sendHtmlApp] Errore critico:', error.message)
    throw error
  }
}

export default {
  sendHtmlApp,
  stripHtml,
  renderLife,
  sanitizeHtml,
  normalizeButtons,
  validateMessageData,
  buildPlain
}
