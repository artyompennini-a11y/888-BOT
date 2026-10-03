let handler = async (m, { conn, groupMetadata }) => {
  if (!m.isGroup) throw '';
  
  let gruppi = global.db.data.chats[m.chat];
  if (gruppi?.spacobot === false) throw '';
  
  let ps = groupMetadata.participants.map(v => v.id);
  let a = ps[Math.floor(Math.random() * ps.length)];
  
  let frasi = [
    'ha paura del buio ma non lo ammette a nessuno',
    'lascia sempre i piatti da lavare nel lavandino per giorni',
    'è segretamente innamorato/a di un personaggio dei cartoni animati',
    'canta a squarciagola sotto la doccia quando pensa di essere solo/a',
    'ha finto di stare male per evitare una chiamata di lavoro o di scuola',
    'spende metà del suo stipendio in oggetti inutili online',
    'guarda ancora i vecchi video nostalgici su YouTube alle tre di notte',
    'ha paura dei ragni anche se sono minuscoli',
    'usa ancora password facilmente indovinabili come 123456',
    'fa finta di lasciar vincere i cugini più piccoli alla PlayStation ma in realtà perde davvero',
    'mangia la pizza con l\'ananas e dichiara che è buonissima',
    'ascolta playlist musicali imbarazzanti quando va in palestra',
    'ha provato a fare una ricetta da internet fallendo miseramente',
    'non si ricorda mai dove ha parcheggiato l\'auto o lasciato le chiavi',
    'crede ancora alle catene di Sant\'Antonio su WhatsApp',
    'ha inviato un messaggio al gruppo sbagliato parlando male di qualcuno del gruppo stesso'
  ];

  let fraseCasuale = frasi[Math.floor(Math.random() * frasi.length)];

  m.reply(`@${a.split('@')[0]} ${fraseCasuale}`, null, {
    mentions: [a],
    contextInfo: { mentionedJid: [a] }
  });
};

handler.customPrefix = /segreto1/i;
handler.command = new RegExp();
handler.help = ['.𝐬𝐞𝐠𝐫𝐞𝐭𝐨'];
handler.tags = ['fun'];

export default handler;
