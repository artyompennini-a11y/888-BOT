import { sendCarousel, sendInteractive } from './interactive.js';

function normalizeButtons(buttons) {
    return buttons.map(button => {
        if (button?.name && button.buttonParamsJson) return button;

        const text = button?.buttonText?.displayText ?? button?.displayText ?? button?.text;
        const id = button?.buttonId ?? button?.id;
        if (id != null) return { type: 'reply', id: String(id), text: String(text ?? id) };
        if (button?.url) return { type: 'url', text: String(text ?? 'Apri'), url: button.url };
        if (button?.code ?? button?.copy_code) {
            return { type: 'copy', text: String(text ?? 'Copia'), code: button.code ?? button.copy_code };
        }
        if (button?.phone ?? button?.phone_number) {
            return { type: 'call', text: String(text ?? 'Chiama'), phone: button.phone ?? button.phone_number };
        }
        if (Array.isArray(button?.sections)) {
            return { type: 'list', text: String(text ?? button.title ?? 'Menu'), sections: button.sections };
        }

        throw new TypeError('Formato pulsante non supportato: manca id, url, code, phone o sections');
    });
}

function normalizeCards(cards) {
    return cards.map(card => ({
        ...card,
        text: card.text ?? card.body ?? '',
        buttons: normalizeButtons(card.buttons ?? [])
    }));
}

export function installButtonAdapter(sock) {
    if (sock.__buttonAdapterInstalled) return;

    const sendMessage = sock.sendMessage.bind(sock);
    Object.defineProperty(sock, 'sendMessage', {
        configurable: true,
        writable: true,
        value(jid, content, options = {}) {
            if (!content || typeof content !== 'object') {
                return sendMessage(jid, content, options);
            }

            if (Array.isArray(content.cards)) {
                return sendCarousel(sock, jid, {
                    ...content,
                    text: content.text ?? content.caption ?? ' ',
                    cards: normalizeCards(content.cards)
                }, options);
            }

            const buttons = content.interactiveButtons?.length
                ? content.interactiveButtons
                : content.buttons;
            if (!Array.isArray(buttons) || buttons.length === 0) {
                return sendMessage(jid, content, options);
            }

            const {
                buttons: _legacyButtons,
                interactiveButtons: _interactiveButtons,
                headerType: _headerType,
                caption,
                ...interactiveContent
            } = content;

            return sendInteractive(sock, jid, {
                ...interactiveContent,
                text: content.text ?? caption ?? ' ',
                buttons: normalizeButtons(buttons)
            }, options);
        }
    });
    Object.defineProperty(sock, '__buttonAdapterInstalled', { value: true });
}
