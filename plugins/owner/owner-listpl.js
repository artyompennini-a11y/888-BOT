import fetch from "node-fetch";
import { readdirSync, statSync } from "fs";
import { join } from "path";

const BOLD_MAP = {
  a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',
  n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
  A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',
  N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭'
};

const bold = str => str.split('').map(c => BOLD_MAP[c] || c).join('');

let handler = async (m, { conn, usedPrefix, text, __dirname }) => {
  const allPlugins = global.plugins || {};
  const entries = Object.entries(allPlugins);
  const filterLower = text?.trim().toLowerCase();

  if (filterLower) {
    return showFilteredList(m, conn, usedPrefix, text.trim(), filterLower, entries);
  }

  const folders = getPluginFolders(__dirname);

  if (folders.length === 0) {
    return conn.sendMessage(m.chat, { text: "❌ Nessuna cartella plugin trovata." }, { quoted: m });
  }

  const fake = {
    key: { participants: "0@s.whatsapp.net", fromMe: false, id: "888ListPlugins" },
    message: {
      locationMessage: {
        name: "🇰 SISTEMA 888",
        jpegThumbnail: await (await fetch("https://qu.ax/JKCXP.jpg")).buffer()
      }
    },
    participant: "0@s.whatsapp.net"
  };

  const sections = folders.map(folder => {
    const folderPath = join(__dirname, folder);
    const pluginsInFolder = getPluginsInFolder(folderPath);
    const totalCount = pluginsInFolder.length;
    const attiviCount = pluginsInFolder.filter(p => {
      const fullKey = Object.keys(allPlugins).find(k => k === folder + "/" + p + ".js" || k.endsWith("/" + p + ".js"));
      return fullKey && !allPlugins[fullKey]?.disabled;
    }).length;

    return {
      title: "📁 " + folder.toUpperCase() + " [" + totalCount + "]",
      highlight_label: attiviCount + "/" + totalCount,
      rows: [{
        id: usedPrefix + "listpl " + folder,
        title: "📂 " + bold(folder),
        description: totalCount + " plugin • " + attiviCount + " attivi • Seleziona per vedere"
      }]
    };
  });

  sections.unshift({
    title: "📋 TUTTI I PLUGIN",
    highlight_label: "" + Object.keys(allPlugins).length,
    rows: [{
      id: usedPrefix + "listpl _all",
      title: "📋 Mostra tutti",
      description: Object.keys(allPlugins).length + " plugin totali • Seleziona per vedere tutto"
    }]
  });

  const buttonParamsJson = JSON.stringify({ title: "🇰 PLUGIN MANAGER 888", sections });

  await conn.sendMessage(m.chat, {
    text: "🇰 *PLUGIN MANAGER 888*\n\n📊 " + folders.length + " cartelle • " + Object.keys(allPlugins).length + " plugin totali\n\nSeleziona una cartella dal menu:",
    footer: "888 Bot • Gestione Plugins",
    headerType: 1,
    interactiveButtons: [{ name: "single_select", buttonParamsJson }]
  }, { quoted: fake });
};

function getPluginFolders(pluginsDir) {
  try {
    return readdirSync(pluginsDir)
      .filter(item => {
        try { return statSync(join(pluginsDir, item)).isDirectory(); } catch { return false; }
      })
      .sort();
  } catch { return []; }
}

function getPluginsInFolder(folderPath) {
  try {
    return readdirSync(folderPath)
      .filter(f => f.endsWith('.js'))
      .map(f => f.replace('.js', ''))
      .sort();
  } catch { return []; }
}

async function showFilteredList(m, conn, usedPrefix, filter, filterLower, entries) {
  const fake = {
    key: { participants: "0@s.whatsapp.net", fromMe: false, id: "888ListPluginsFiltered" },
    message: {
      locationMessage: {
        name: "🇰 SISTEMA 888",
        jpegThumbnail: await (await fetch("https://qu.ax/JKCXP.jpg")).buffer()
      }
    },
    participant: "0@s.whatsapp.net"
  };

  let filtered;
  if (filterLower === '_all') {
    filtered = entries;
  } else {
    filtered = entries.filter(([name]) => {
      const parts = name.split('/');
      const folder = parts.length > 1 ? parts[0].toLowerCase() : 'root';
      const pluginName = parts[parts.length - 1].replace('.js', '').toLowerCase();
      return folder === filterLower || name.toLowerCase().includes(filterLower) || pluginName.includes(filterLower);
    });
  }

  if (filtered.length === 0) {
    return conn.sendMessage(m.chat, { text: "❌ Nessun plugin trovato per: *" + filter + "*\n\n💡 Usa *.listpl* per vedere le cartelle disponibili." }, { quoted: fake });
  }

  const attivi = [];
  const disabilitati = [];

  for (const [name, p] of filtered) {
    const short = name.replace(/^.*[\\/]/, "").replace(".js", "");
    if (p.disabled) disabilitati.push(short);
    else attivi.push(short);
  }

  attivi.sort();
  disabilitati.sort();

  const title = filterLower === '_all' ? 'Tutti i Plugin' : 'Cartella: ' + filter;
  const BOLD_MAP = {
    a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',
    n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
    A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',
    N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭'
  };
  const bold = str => str.split('').map(c => BOLD_MAP[c] || c).join('');

  let out = "🇰 *PLUGIN MANAGER 888*\n📂 " + title + "\n📊 Trovati: " + filtered.length + "\n🟢 Attivi: " + attivi.length + "\n🔴 Disabilitati: " + disabilitati.length + "\n\n";

  if (attivi.length) {
    out += "🟢 *Attivi:*\n";
    out += attivi.map(n => "• " + bold(n)).join("\n") + "\n\n";
  }

  if (disabilitati.length) {
    out += "🔴 *Disabilitati:*\n";
    out += disabilitati.map(n => "• " + bold(n)).join("\n") + "\n\n";
  }

  out += "💡 Usa *.listpl* per tornare al menu cartelle.";
  conn.sendMessage(m.chat, { text: out }, { quoted: fake });
}

handler.command = /^listpl$/i;
handler.tags = ['owner'];
handler.help = ['listpl [cartella]', 'listpl [plugin]', 'listpl all'];
handler.rowner = true;

export default handler;
