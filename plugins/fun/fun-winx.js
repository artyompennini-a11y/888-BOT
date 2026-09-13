//Plugin by Elixir
import fs from 'fs'

let handler = async (m, { conn }) => {
    let user = m.sender
    let username = `@${user.split('@')[0]}`

    let winx = pickRandom([
        { name: 'Bloom', power: 'Fuoco del Drago', description: 'Determinata, coraggiosa e sempre pronta a difendere i suoi amici!', image: './media/winx/winx_bloom.png' },
        { name: 'Stella', power: 'Luce del Sole', description: 'Solare, creativa e sempre alla moda! Sei la luce del gruppo!', image: './media/winx/winx_stella.png' },
        { name: 'Flora', power: 'Natura', description: 'Dolce, gentile e con un cuore grande. Ami la natura e la vita!', image: './media/winx/winx_flora.png' },
        { name: 'Tecna', power: 'Tecnologia', description: 'Intelligente, logica e sempre alla ricerca di soluzioni innovative!', image: './media/winx/winx_tecna.png' },
        { name: 'Musa', power: 'Musica', description: 'Creativa e passionale, trovi sempre un modo per esprimere le tue emozioni!', image: './media/winx/winx_musa.png' },
        { name: 'Aisha', power: 'Onde e Acqua', description: 'Energica, avventurosa e sempre pronta a nuove sfide!', image: './media/winx/winx_aisha.png' }
    ])

    let message = `🧚‍♀️ ${username}, la Winx che ti rappresenta è *${winx.name}*! 🧚‍♀️\n\n✨ *Potere*: ${winx.power}\n💖 *Descrizione*: ${winx.description}`

    const imageBuffer = fs.readFileSync(winx.image)

    await conn.sendMessage(m.chat, { 
        image: imageBuffer, 
        caption: message,
        mentions: [user]
    }, { quoted: m })
}

handler.help = ['chewinxsei']
handler.tags = ['fun']
handler.command = /^winx$/i

export default handler

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
