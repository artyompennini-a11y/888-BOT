import Genius from 'genius-lyrics';

const genius = new Genius.Client();

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`❌ Uso: ${usedPrefix + command} <nome canzone>\n\nEsempio: ${usedPrefix + command} Bohemian Rhapsody`)
  }

  try {
    const searches = await genius.songs.search(text);
    
    if (!searches || searches.length === 0) {
      return m.reply('❌ Nessun risultato trovato.')
    }

    const song = searches[0];
    const lyrics = await song.lyrics();

    if (!lyrics || lyrics.length === 0) {
      return m.reply('❌ Testo non disponibile per questa canzone.')
    }

    let lyricsText = lyrics
      .replace(/\\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (lyricsText.length > 4000) {
      lyricsText = lyricsText.substring(0, 4000) + '\n\n... (testo troncato)'
    }

    const caption = `🎵 *${song.title}* 🎵\n👤 ${song.artist}\n\n${lyricsText}`

    await conn.sendMessage(m.chat, { text: caption }, { quoted: m })
  } catch (e) {
    m.reply(`❌ Errore nella ricerca del testo: ${e.message}`)
  }
}

handler.command = ['lyrics', 'testo', 'text']
handler.help = ['lyrics <canzone>']
handler.tags = ['music', 'utility']

export default handler
