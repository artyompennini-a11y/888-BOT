import axios from 'axios'

const GROQ_KEY = global.APIKeys?.groq && global.APIKeys.groq !== '333' ? global.APIKeys.groq : 'AQ.Ab8RN6IZFlErNXaaHoNHtNOrMwbcyga-Ept5SzzEs2qfKgNF9w'

let ON = false

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!m.isGroup) {
        return m.reply('❌ Il Groq AI funziona solo nei gruppi.', m)
    }

    if (text === '.bot on' || text === '.groq on') {
        ON = true
        return m.reply('✅ Groq AI ATTIVA')
    }
    if (text === '.bot off' || text === '.groq off') {
        ON = false
        return m.reply('❌ Groq AI DISATTIVATA')
    }
    if (text.startsWith('.bot ') || text.startsWith('.groq ')) {
        if (!ON) return m.reply('❌ Groq AI disattivata. Usa .bot on o .groq on per attivarla.')
        let domanda = text.replace(/^\.(bot|groq)\s+/, '')
        let risposta = await ia(domanda)
        return m.reply(risposta)
    }
}

handler.all = async (m) => {
    if (!ON) return
    if (m.fromMe) return
    if (!m.isGroup) return
    if (m.text && m.text.startsWith('.')) return

    await conn.sendPresenceUpdate('composing', m.chat)
    let risposta = await ia(m.text)
    m.reply(risposta)
}

handler.command = /^(bot|groq)$/i
handler.group = true

export default handler

async function ia(prompt) {
    try {
        let { data } = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: "Sei 888 BOT. Italiano, diretto, max 3 righe." },
                { role: "user", content: prompt }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        })
        return data.choices[0].message.content
    } catch (e) {
        console.log("GROQ ERROR:", e.response?.data || e.message)
        return "Errore API. Controlla la key"
    }
}
