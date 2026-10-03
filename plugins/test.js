const SECRETS = [
  'ha paura del buio ma non lo ammette a nessuno',
  'lascia sempre i piatti da lavare nel lavandino per giorni',
  'è segretamente innamorato/a di un personaggio dei cartoni animati',
  'canta a squarciagola sotto la doccia quando pensa di essere solo/a',
  'ha finto di stare male per evitare un impegno importante',
  'spende troppi soldi in oggetti completamente inutili online',
  'guarda ancora i vecchi video nostalgici su YouTube alle tre di notte',
  'ha paura dei ragni anche se sono minuscoli',
  'usa ancora password ridicole e facilmente indovinabili',
  'fa finta di lasciar vincere gli altri ai videogiochi ma in realtà è una sega',
  'mangia abbinamenti di cibo improponibili di nascosto',
  'ascolta playlist musicali imbarazzanti quando nessuno può sentirlo/a',
  'ha provato a fare una ricetta da chef fallendo miseramente',
  'non si ricorda mai dove lascia le chiavi o il telefono',
  'crede ancora a metà delle notizie palesemente false che vede online',
  'ha inviato un messaggio nella chat sbagliata parlando male del destinatario'
];

let handler = async (m, { conn, groupMetadata }) => {
  if (!m.isGroup || global.db?.data?.chats?.[m.chat]?.spacobot === false) throw '';

  const list = groupMetadata?.participants || [];
  if (!list.length) throw '';

  const target = list[Math.floor(Math.random() * list.length)].id;

  await conn.sendMessage(m.chat, {
    text: `@${target.split('@')[0]} ${SECRETS[Math.floor(Math.random() * SECRETS.length)]}`,
    mentions: [target]
  }, { quoted: m });
};

handler.customPrefix = /segreto1/i;
handler.command = new RegExp();
handler.help = ['.𝐬𝐞𝐠𝐫𝐞𝐭𝐨'];
handler.tags = ['fun'];

export default handler;
