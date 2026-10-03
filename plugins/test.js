const SECRETS = [
  'ha dimenticato le chiavi di casa ieri',
  'beve il caffè senza zucchero',
  'adora guardare le serie TV fino a tarda notte',
  'ha paura dei film horror',
  'legge sempre l\'ultima pagina di un libro prima di iniziare',
  'non riesce a svegliarsi senza tre sveglie',
  'preferisce la pizza all\'ananas',
  'ascolta musica ad alto volume mentre pulisce casa',
  'ha una collezione di fumetti rari',
  'usa ancora Internet Explorer',
  'crede ancora ai fantasmi',
  'ha cantato a squarciagola sotto la doccia stamattina'
];

let handler = async (m, { conn, groupMetadata }) => {
  if (!m.isGroup || global.db?.data?.chats?.[m.chat]?.spacobot === false) throw '';

  const botJid = conn.user.jid;
  const participants = groupMetadata?.participants?.map(p => p.id) || [];
  
  const targets = participants.filter(id => id !== botJid);
  if (!targets.length) throw '';

  const randomTarget = targets[Math.floor(Math.random() * targets.length)];
  const formatNumber = randomTarget.split('@')[0];

  await conn.sendMessage(m.chat, {
    text: `@${formatNumber} ${SECRETS[Math.floor(Math.random() * SECRETS.length)]}`,
    mentions: [randomTarget]
  }, { quoted: m });
};

handler.customPrefix = /segreto1/i;
handler.command = new RegExp();
handler.help = ['.  𝐬𝐞𝐠𝐫𝐞𝐭𝐨'];
handler.tags = ['fun'];

export default handler;
