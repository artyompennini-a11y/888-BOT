import fetch from "node-fetch";

const BOLD_MAP = {
  a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',
  n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
  A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',
  N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
  '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'🗝','6':'🗟','7':'🗠','8':'🗡','9':'🗢'
};

const bold = str => str.split('').map(c => BOLD_MAP[c] || c).join('');

let handler = async (m, { conn, usedPrefix, text }) => {

  const fake = {
    key: {
      participants: "0@s.whatsapp.net",
      fromMe: false,
      id: "888ListPlugins"
    },
    message: {
      locationMessage: {
        name: "🎰 SISTEMA 888",
        jpegThumbnail: await (await fetch("https://qu.ax/JKCXP.jpg")).buffer()
      }
    },
    participant: "0@s.whatsapp.net"
  };

  const plugins = global.plugins || {};
  const entries = Object.entries(plugins);

  if (!entries.length) {
    return conn.sendMessage(m.chat, { text: "❌ Nessun plugin caricato." }, { quoted: fake });
  }

  const filter = text?.trim().toLowerCase();
  const attivi = [];
  const disabilitati = [];

  for (const [name, p] of entries) {
    const short = name.replace(/^.*[\\/]/, "").replace(".js", "");
    if (filter && !short.toLowerCase().includes(filter)) continue;
    if (p.disabled) disabilitati.push(short);
    else attivi.push(short);
  }

  attivi.sort();
  disabilitati.sort();

  let out =
    `🎰 *Gestione Plugins*\n` +
    `📊 Totale: ${entries.length}\n` +
    `🟢 Attivi: ${attivi.length}\n` +
    `🔴 Disabilitati: ${disabilitati.length}\n\n`;

  if (attivi.length) {
    out += `🟢 *Moduli Attivi:*\n`;
    out += attivi.map(n => `• ${bold(n)}`).join("\n") + "\n\n";
  }

  if (disabilitati.length) {
    out += `🔴 *Moduli Disabilitati:*\n`;
    out += disabilitati.map(n => `• ${bold(n)}`).join("\n") + "\n\n";
  }

  out += `⚠️ In caso di problemi usa *${usedPrefix}segnala* per contattare lo staff.`;

  conn.sendMessage(m.chat, { text: out }, { quoted: fake });
};

handler.command = /^listpl$/i;
handler.rowner = true;

export default handler;