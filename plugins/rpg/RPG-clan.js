//Plugin by Punisher

global.clans = global.clans || {};
global.db = global.db || {};
global.warHistory = global.warHistory || {};

const MAX_MEMBERS = 5;
const WAR_COST = 200;
const WIN_REWARD = 500;
const LOSE_PENALTY = 200;
const MAX_WARS = 5;
const COOLDOWN = 10 * 60 * 1000;

function getClanByUser(user, chat) {
  const clans = global.clans[chat] || {};
  return Object.values(clans).find(c => c.members.includes(user));
}

function getMoney(user) {
  const u = global.db.data.users[user];
  return (u?.bank || 0) + (u?.money || 0);
}

function payAmount(user, amount) {
  const u = global.db.data.users[user];
  if (!u) return false;

  if (amount < 0) {
    u.money = (u.money || 0) - amount;
    return true;
  }

  if ((u.bank || 0) >= amount) {
    u.bank -= amount;
    return true;
  }

  let restante = amount - (u.bank || 0);
  u.bank = 0;

  if ((u.money || 0) >= restante) {
    u.money -= restante;
    return true;
  }

  return false;
}

function msToTime(duration) {
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let seconds = Math.floor((duration / 1000) % 60);

  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return `${minutes}m ${seconds}s`;
}

let handler = async (m, { conn, command, text }) => {
  const sender = m.sender;
  const chat = m.chat;

  global.clans[chat] = global.clans[chat] || {};

  // ━━━━━━━━━━━━━━━━━━━
  // 📌 CREA CLAN
 // ━━━━━━━━━━━━━━━━━━━
  if (command === "clan") {
    if (getClanByUser(sender, chat))
      return m.reply("Sei già membro di un clan.");

    const tagged = m.mentionedJid || [];
    if (tagged.length !== 4)
      return m.reply("Un clan deve avere 5 membri. Tagga 4 utenti per fondarlo.");

    const name = text.split("@")[0].trim();
    if (!name)
      return m.reply("Scrivi il nome del clan prima dei tag.\nEsempio:\n.clan NomeClan @1 @2 @3 @4");

    const members = [sender, ...tagged];
    for (let u of members)
      if (getClanByUser(u, chat))
        return m.reply("Uno dei membri taggati è già in un clan.");

    const id = "clan_" + Date.now();

    global.clans[chat][id] = {
      id,
      chat,
      name,
      founder: sender,
      members,
      reputation: 0
    };

    let msg = `🏰 *Clan creato!*\n\n• Nome: ${name}\n• Fondatore: @${sender.split("@")[0]}\n\nComandi:\n• .esciclan — Esci dal clan\n• .guerra — Attacca un clan\n\nMembri:\n`;
    members.forEach(u => msg += `• @${u.split("@")[0]}\n`);

    return conn.sendMessage(chat, { text: msg, mentions: members });
  }

  //━━━━━━━━━━━━━━━━━━━
  // 🚪 ESCI DAL CLAN
  //━━━━━━━━━━━━━━━━━━━
  if (command === "esciclan") {
    const clan = getClanByUser(sender, chat);
    if (!clan) return m.reply("Non sei in nessun clan.");

    if (clan.founder === sender) {
      delete global.clans[chat][clan.id];
      return m.reply("Il fondatore è uscito. Il clan è stato sciolto.");
    }

    clan.members = clan.members.filter(u => u !== sender);
    return m.reply("Sei uscito dal clan.");
  }

  //━━━━━━━━━━━━━━━━━━━
  // ⚔️ GUERRA
  //━━━━━━━━━━━━━━━━━━━
  if (command === "guerra") {
    const clan = getClanByUser(sender, chat);
    if (!clan) return m.reply("Non fai parte di nessun clan.");

    global.db.data.users[sender] = global.db.data.users[sender] || {};
    const user = global.db.data.users[sender];

    const now = Date.now();
    const timePassed = now - (user.lastWar || 0);

    if (user.warCount >= MAX_WARS && timePassed < COOLDOWN) {
      const remaining = COOLDOWN - timePassed;
      return m.reply(`Hai raggiunto il limite di 5 guerre.\nRiprova tra ${msToTime(remaining)}.`);
    }

    if (timePassed >= COOLDOWN) {
      user.warCount = 0;
      user.lastWar = now;
    }

    const clans = global.clans[chat];
    const enemyClan = Object.values(clans).find(c => c.id !== clan.id);

    if (!enemyClan)
      return m.reply("Non ci sono clan da attaccare.");

    await conn.sendMessage(chat, {
      text: `⚔️ *Guerra iniziata!*\n\n${clan.name} VS ${enemyClan.name}`
    });

    for (let u of clan.members)
      if (getMoney(u) < WAR_COST)
        return m.reply("Ogni membro deve avere almeno 200 888COIN.");

    clan.members.forEach(u => payAmount(u, WAR_COST));

    const win = Math.random() > 0.5;

    if (win) {
      for (let u of enemyClan.members)
        if (getMoney(u) < WIN_REWARD)
          return m.reply("Il clan nemico non ha abbastanza fondi.");

      enemyClan.members.forEach(u => payAmount(u, WIN_REWARD));
      clan.members.forEach(u => payAmount(u, -WIN_REWARD));

      clan.reputation += 1;

      user.warCount = (user.warCount || 0) + 1;
      user.lastWar = now;

      return m.reply(
        `🏆 *Guerra vinta!*\n\n• +500 888COIN a testa\n• -200 888COIN al clan avversario\n• Reputazione +1`
      );
    } else {
      clan.members.forEach(u => payAmount(u, LOSE_PENALTY));
      enemyClan.reputation += 1;

      user.warCount = (user.warCount || 0) + 1;
      user.lastWar = now;

      return m.reply(
        `❌ *Guerra persa*\n\n• -200 888COIN al clan attaccante\n• +200 888COIN al clan vincente\n• Reputazione nemica +1`
      );
    }
  }

  //━━━━━━━━━━━━━━━━━━━
  // 🏆 CLASSIFICA CLAN
  //━━━━━━━━━━━━━━━━━━━
  if (command === "topclan") {
    const clans = Object.values(global.clans[chat] || {});
    if (!clans.length) return m.reply("Non ci sono clan in questo gruppo.");

    let msg = `🏆 *Classifica Clan*\n\n`;

    clans.forEach(c => {
      msg += `• ${c.name}\n  Fondatore: @${c.founder.split("@")[0]}\n  Membri: ${c.members.length}\n  Reputazione: ${c.reputation}\n\n`;
    });

    return conn.sendMessage(chat, {
      text: msg,
      mentions: clans.map(c => c.members).flat()
    });
  }
};

handler.command = /^(clan|esciclan|guerra|topclan)$/i;
handler.group = true;

export default handler;