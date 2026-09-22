import fs from 'fs'
import path from 'path'

let handler = async (m, { conn }) => {
    const from = m.chat

    const gameUrl = "https://artyompennini-a11y.github.io/888dinorunhtml/"

    await conn.sendMessage(from, {
        text: `🦖 *DINO RUNNER*\n\n🕹️ Salta con un tocco\n🏆 Batti il tuo record\n⚡ Sfida i tuoi amici\n\n_Buona fortuna!_ 🍀`,
        footer: "888 Games",
        headerType: 4,
        interactiveButtons: [
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "▶️ Apri Dino Runner",
                    url: gameUrl
                })
            }
        ]
    }, { quoted: m })
}

handler.help = ['dino']
handler.tags = ['fun', 'games']
handler.command = /^(dino)$/i

export default handler