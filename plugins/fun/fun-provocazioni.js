// Plugin by elixir & Axtral_WiZaRd

const EMOJI_PROVOCATORIE = [
  '🤢', '🤡', '🥴', '🫪', '🫩',
  '👀', '🥶', '😈',
  '💩', '🥱', '🤮', '🤥', '😵', '🤫', '🤐', '😱', '💀'
]

const PROBABILITA = 0.05
const COOLDOWN_CHAT = 10000
const COOLDOWN_USER = 10000

const ultimoChat = new Map()
const ultimoUser = new Map()

export async function all(m) {
  const conn = this
  if (!conn) return

  try {
    if (!m?.chat || !m?.key) return
    if (!m.isGroup || m.fromMe || m.isBaileys) return

    const chat = global.db?.data?.chats?.[m.chat]
    if (!chat?.reazioni || chat.isBanned) return

    const haTesto = typeof m.text === 'string' && m.text.trim().length > 0
    const haMedia = ['imageMessage', 'videoMessage', 'stickerMessage', 'audioMessage', 'pttMessage'].includes(m.mtype)
    if (!haTesto && !haMedia) return

    const ora = Date.now()
    if (ora - (ultimoChat.get(m.chat) ?? 0) < COOLDOWN_CHAT) return
    if (ora - (ultimoUser.get(m.sender) ?? 0) < COOLDOWN_USER) return
    if (Math.random() > PROBABILITA) return

    ultimoChat.set(m.chat, ora)
    ultimoUser.set(m.sender, ora)

    const emoji = EMOJI_PROVOCATORIE[Math.floor(Math.random() * EMOJI_PROVOCATORIE.length)]

    await conn.sendMessage(m.chat, {
      react: {
        text: emoji,
        key: m.key
      }
    }).catch(() => {})
  } catch (e) {
    console.error('[reazioni]', e?.message || e)
  }
}

export default { all }
