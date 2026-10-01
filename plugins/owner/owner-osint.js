import axios from 'axios'
let handler = async (m) => {
    let user = m.text.split(' ')[1]
    if(!user) return m.reply('Esempio:.osint marco')
    let siti = {
        'Instagram': `https://instagram.com/${user}`,
        'GitHub': `https://github.com/${user}`,
        'TikTok': `https://tiktok.com/@${user}`,
        'Twitter': `https://twitter.com/${user}`,
        'Reddit': `https://reddit.com/user/${user}`
    }
    let res = '🔎 *CHECK USERNAME*\n'
    for(let [nome,link] of Object.entries(siti)){
        try {
            await axios.get(link, {validateStatus: () => true})
            res += `✅ ${nome}: ${link}\n`
        } catch {}
    }
    m.reply(res)
}
handler.command = /^osint$/i
export default handler
handler.rowner = true