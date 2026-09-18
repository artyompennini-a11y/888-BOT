import fetch from 'node-fetch';

let handler = async (m, { conn, usedPrefix, command, args: [evento], text }) => {
    if (!evento) return await m.reply(
`${usedPrefix + command} benvenuto @user
${usedPrefix + command} addio @user
${usedPrefix + command} promozione/p @user
${usedPrefix + command} retrocessione/r @user`
    );

    let mentions = text.replace(evento, '').trimStart();
    let who = mentions ? conn.parseMention(mentions) : [];
    let part = who.length ? who : [m.sender];
    let act = false;
    let testoEvento = '';

    switch (evento.toLowerCase()) {

        case 'benvenuto':
        case 'welcome':
        case 'add':
        case 'invite':
        case 'bienvenida': {

            act = 'add';
            testoEvento = "benvenuto";

            let groupMetadata = await conn.groupMetadata(m.chat);
            let chat = global.db.data.chats[m.chat];

            for (let user of part) {

                let profilePic;
                try {
                    profilePic = await conn.profilePictureUrl(user, 'image');
                } catch {
                    profilePic = 'https://telegra.ph/file/8ca14ef9fa43e99d1d196.jpg';
                }

                let ppBuffer = await (await fetch(profilePic)).buffer();

                let welcomeText = chat.sWelcome || 
`👋 Benvenuto @user
Gruppo: @group
Membri: @count
Descrizione: @desc`;

                let welcome = welcomeText
                    .replace('@user', `@${user.split('@')[0]}`)
                    .replace('@group', groupMetadata.subject)
                    .replace('@count', groupMetadata.participants.length)
                    .replace('@desc', groupMetadata.desc?.toString() || 'Nessuna descrizione');

                await conn.sendMessage(m.chat, {
                    text: welcome,
                    contextInfo: {
                        mentionedJid: [user],
                        externalAdReply: {
                            title: 'Nuovo Membro',
                            body: 'Benvenuto nel gruppo',
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            thumbnail: ppBuffer,
                            sourceUrl: 'https://whatsapp.com/channel/0029VaeW5Tw4yltWm1NBJV3g'
                        }
                    }
                });
            }
            return;
        }

        case 'addio':
        case 'bye':
        case 'kick':
        case 'leave':
        case 'remove': {

            act = 'remove';
            testoEvento = "addio";

            let groupMeta = await conn.groupMetadata(m.chat);
            let chatData = global.db.data.chats[m.chat];

            for (let user of part) {

                let profilePic;
                try {
                    profilePic = await conn.profilePictureUrl(user, 'image');
                } catch {
                    profilePic = 'https://telegra.ph/file/8ca14ef9fa43e99d1d196.jpg';
                }

                let ppBuffer = await (await fetch(profilePic)).buffer();

                let byeText = chatData.sBye || 
`👋 Addio @user
Gruppo: @group
Membri: @count`;

                let bye = byeText
                    .replace('@user', `@${user.split('@')[0]}`)
                    .replace('@group', groupMeta.subject)
                    .replace('@count', groupMeta.participants.length);

                await conn.sendMessage(m.chat, {
                    text: bye,
                    contextInfo: {
                        mentionedJid: [user],
                        externalAdReply: {
                            title: 'Addio',
                            body: 'Un membro ha lasciato il gruppo',
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            thumbnail: ppBuffer,
                            sourceUrl: 'https://whatsapp.com/channel/0029VaeW5Tw4yltWm1NBJV3g'
                        }
                    }
                });
            }
            return;
        }

        case 'promozione':
        case 'promote':
        case 'p': {
            act = 'promote';
            testoEvento = "promozione";
            break;
        }

        case 'retrocessione':
        case 'demote':
        case 'r': {
            act = 'demote';
            testoEvento = "retrocessione";
            break;
        }

        default:
            return m.reply(
`${usedPrefix + command} benvenuto @user
${usedPrefix + command} addio @user
${usedPrefix + command} promozione/p @user
${usedPrefix + command} retrocessione/r @user`
            );
    }

    m.reply(
`Evento: ${testoEvento}
Simulazione in corso.
Nessun effetto reale verrà applicato.`
    );

    if (act) return conn.participantsUpdate({
        id: m.chat,
        participants: part,
        action: act
    });
};

handler.help = ['simula'];
handler.tags = ['owner'];
handler.command = /^sim|simula$/i;
handler.group = true;

export default handler;