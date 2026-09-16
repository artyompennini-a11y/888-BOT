//Plugin fatto da Axtral_WiZaRd
import _0x1a2b from 'axios';

const _0x9f1a = [
    'aHR0cHM6Ly93d3cuZXBvcm5lci5jb20vYXBpL3YyL3ZpZGVvL3NlYXJjaC8/cXVlcnk9',
    'JnBlcl9wYWdlPTUmdGh1bWJzaXplPWJpZw==',
    'dmlkZW9z',
    'aHR0cHM6Ly92aWEucGxhY2Vob2xkZXIuY29tLzMwMA==',
    'ZW1iZWQ=',
    'dXJs',
    'dGl0bGU=',
    'ZGVmYXVsdF90aHVtYg==',
    'c3Jj',
    'bGVuZ3RoX21pbg==',
    'dmlld3M=',
    'Y3RhX3VybA==',
    'Y3RhX2NvcHk=',
    'c3RyaW5naWZ5',
    'c2VuZE1lc3NhZ2U=',
    'cmVhY3Q=',
    'cmVwbHk=',
    'Y2hhdA==',
    'dXNlZHByZWZpeA==',
    'dGV4dA==',
    'Y29tbWFuZA==',
    'cGhzZWFyY2ggPHRlc3RvPg==',
    'KzE4',
    'cGhzZWFyY2g=',
    'cG9ybmh1YnNlYXJjaA==',
    'ZXBzZWFyY2g=',
    'aGVscA==',
    'dGFncw==',
    'b3duZXI=',
    'YXh0cmFsX3dpemFyZCB2aWRlbyBzZWFyY2g=',
    'wqnCuMOvw5figJzvuIcg4pygICpWxrtSUk9SUkXQkZNPIOKAoqogCvCfmZAgxbogwqc7ICjvuIcgbGF0aW5hCuKAu-KYv-KYuuKYveKYveKYveKYveKYveKYveKYveKYveKYveKYveKYvQ==',
    'wqnCuMOvw5figJzvuIcg4pygICpO0bNBU1VOIFJJU1VMVEFUTyDigJrigKogCsKnKuKAnSAgTMSZXNzdW4gdmlkZW8gdHJvdmF0byBwZXI6 *',
    'wqnCuMOvw5figJzvuIcg8J+QgSDCvOaxuOKAnSAgUsOkc3VsdGF0aSB0cm92Y3RpIHBlcjogKg==',
    '4pygIDHOtcKVcmnRlcmlWZW9sdG8=',
    '8J+SmCDvuIcgQ-KVkmlhIGxpbms='
];

const _0x3c2a = (_0x5d1e) => Buffer.from(_0x5d1e, 'base64').toString('utf-8');

let handler = async (_0x4f12, _0x2b3c) => {
    try {
        const _0x5c1a = _0x4f12[_0x3c2a(_0x9f1a[17])] || _0x4f12.chat;
        const _0x2f1d = _0x2b3c[_0x3c2a(_0x9f1a[18])] || '.';
        const _0x3b2a = _0x2b3c[_0x3c2a(_0x9f1a[19])];
        const _0x1c4d = _0x2b3c[_0x3c2a(_0x9f1a[20])];
        const _0x4e1a = _0x2b3c['conn'];

        if (!_0x3b2a) {
            let _formattedErr = `╭━━⊱「 ❌ *𝐄𝐑𝐑𝐎𝐑𝐄* 」\n┃ 𝐈𝐧𝐬𝐞rիսci il testo per cercare un video\n┃\n┃ 📝 *𝐄𝐬𝐞𝐦𝐩𝐢𝐨:*\n┃ ${_0x2f1d + _0x1c4d} latina\n╰━━━━━━━━━━━━━━⊱`;
            return _0x4f12[_0x3c2a(_0x9f1a[16])](_formattedErr);
        }

        const _0x5a1b = encodeURIComponent(_0x3b2a);
        const { data: _0x2e3d } = await _0x1a2b['get'](_0x3c2a(_0x9f1a[0]) + _0x5a1b + _0x3c2a(_0x9f1a[1]));
        const _0x1f4e = _0x2e3d?.[_0x3c2a(_0x9f1a[2])] || [];

        if (!_0x1f4e['length']) {
            await _0x4f12[_0x3c2a(_0x9f1a[15])]('❌');
            let _formattedNoRes = `╭━━⊱「 ❌ *𝐍𝐄𝐒𝐒𝐔𝐍 𝐑𝐈𝐒𝐔𝐋𝐓𝐀𝐓𝐎* 」\n┃ 𝐍essun video trovato per: *${_0x3b2a}*\n╰━━━━━━━━━━━━━━⊱`;
            return _0x4f12[_0x3c2a(_0x9f1a[16])](_formattedNoRes);
        }

        const _0xCustomFooter = _0x3c2a(_0x9f1a[29]);

        const _0x3d21 = _0x1f4e['map']((_0x1122, _0x3344) => {
            const _0x5566 = (_0x1122[_0x3c2a(_0x9f1a[6])] || _0x3b2a)['substring'](0, 50);
            const _0x7788 = _0x1122[_0x3c2a(_0x9f1a[7])]?.[_0x3c2a(_0x9f1a[8])] || _0x3c2a(_0x9f1a[3]);
            const _0x9900 = _0x1122[_0x3c2a(_0x9f1a[4])] || _0x1122[_0x3c2a(_0x9f1a[5])];

            return {
                'image': { 'url': _0x7788 },
                'title': `${_0x3344 + 1}. ${_0x5566}`,
                'body': `『 🕒 』 *Durata:* ${_0x1122[_0x3c2a(_0x9f1a[9])] || 'N/D'} min\n『 👀 』 *Visualizzazioni:* ${_0x1122[_0x3c2a(_0x9f1a[10])] || 'N/D'}`,
                'footer': _0xCustomFooter,
                'buttons': [
                    {
                        'name': _0x3c2a(_0x9f1a[11]),
                        'buttonParamsJson': JSON[_0x3c2a(_0x9f1a[13])]({
                            'display_text': '🎬 Apri video',
                            'url': _0x9900
                        })
                    },
                    {
                        'name': _0x3c2a(_0x9f1a[12]),
                        'buttonParamsJson': JSON[_0x3c2a(_0x9f1a[13])]({
                            'display_text': '📎 Copia link',
                            'copy_code': _0x9900
                        })
                    }
                ]
            };
        });

        let _0xResMsg = await _0x4e1a[_0x3c2a(_0x9f1a[14])](_0x5c1a, {
            'text': `『 🔞 』 Risultati trovati per: *${_0x3b2a}*`,
            'footer': _0xCustomFooter,
            'cards': _0x3d21
        }, { 'quoted': _0x4f12 });

        setTimeout(async () => {
            try {
                await _0x4e1a[_0x3c2a(_0x9f1a[14])](_0x5c1a, { 'delete': _0xResMsg.key });
            } catch (_0xErr) {}
        }, 10000);

        await _0x4f12[_0x3c2a(_0x9f1a[15])]('✅');

    } catch (_0x2a1b) {
        console['log'](_0x2a1b);
        await _0x4f12[_0x3c2a(_0x9f1a[15])]('❌');
        let _formattedErrCatch = `╭━━⊱「 ❌ *ERRORE* 」\n┃ Dettaglio: ${_0x2a1b.message}\n╰━━━━━━━━━━━━━━⊱`;
        return _0x4f12[_0x3c2a(_0x9f1a[16])](_formattedErrCatch);
    }
};

handler[_0x3c2a(_0x9f1a[26])] = [_0x3c2a(_0x9f1a[21])];
handler[_0x3c2a(_0x9f1a[27])] = [_0x3c2a(_0x9f1a[22])];
handler[_0x3c2a('Y29tbWFuZA==')] = [_0x3c2a(_0x9f1a[23]), _0x3c2a(_0x9f1a[24]), _0x3c2a(_0x9f1a[25])];
handler[_0x3c2a(_0x9f1a[28])] = true;

export default handler;