global.scramblePoints = global.scramblePoints || {};

const handler = async (m, { conn }) => {
  const chatId = m.chat;

  const groupPoints = global.scramblePoints[chatId];
  if (!groupPoints || Object.keys(groupPoints).length === 0) {
    return m.reply("ℹ️ 𝐍𝐞𝐬𝐬𝐮𝐧 𝐩𝐮𝐧𝐭𝐞𝐠𝐠𝐢𝐨 𝐩𝐫𝐞𝐬𝐞𝐧𝐭𝐞 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.");
  }

  const leaderboardEntries = Object.entries(groupPoints)
    .sort((a, b) => b[1] - a[1]);

  const leaderboardText = leaderboardEntries
    .map(([id, pts], i) => `• ${i + 1} — @${id.split("@")[0]} • ${pts} 𝐩𝐮𝐧𝐭𝐢`)
    .join("\n");

  await conn.sendMessage(chatId, {
    text: `📊 𝐓𝐎𝐏 𝐒𝐂𝐑𝐀𝐌𝐁𝐋𝐄\n${leaderboardText}`,
    contextInfo: { mentionedJid: leaderboardEntries.map(([id]) => id) }
  });
};

handler.command = /^topscramble$/i;
handler.group = true;
export default handler;