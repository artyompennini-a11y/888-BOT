'use strict'

import htmlApp from '../lib/htmlApp.js'

const handler = async (m, { conn, command, args, text, usedPrefix }) => {
  if (!/^(myapp|htmlapp)$/i.test(command)) return
  
  const jid = m.chat
  const senderJid = m.sender
  
  try {
    const lifeValue = args[0] ? parseInt(args[0]) : 5
    
    const htmlContent = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h2>🎮 Dinosaur Game</h2>
        <p>Vita rimasta: ${htmlApp.renderLife(lifeValue, 10)}</p>
        <p style="color: #666; font-size: 14px;">Salta gli ostacoli e raccogli monete!</p>
      </div>
    `
    
    const messageData = {
      title: '🎮 Dinosaur Game',
      status: 'In corso...',
      life: lifeValue,
      html: htmlContent,
      body: 'Gioco in esecuzione',
      text: 'Testo di fallback',
      footer: 'Usa i pulsanti per controllare',
      url: 'https://example.com/dino',
      trustedSources: ['example.com'],
      buttons: [
        { buttonId: 'jump', text: 'Salta' },
        { buttonId: 'duck', text: 'Abbassati' },
        { buttonId: 'restart', text: 'Ricomincia' }
      ],
      quoted: m,
      mentions: [senderJid]
    }
    
    await htmlApp.sendHtmlApp(conn, jid, messageData)
    
  } catch (error) {
    console.error('[dino.js] Errore:', error)
    await conn.reply(m.chat, `❌ Errore nel gioco: ${error.message}`, m)
  }
}

export default {
  command: /^(myapp|htmlapp)$/i,
  operate: handler
}
