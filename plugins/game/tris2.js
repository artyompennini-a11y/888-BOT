export default {
  name: 'tris2_nixel',
  command: ['tris2'],
  description: 'Mini-game Tris con FOAIDNixelButtonSheets e embedded_screens',

  async run(ctx) {
    const { sendMessage } = ctx;

    // Canvas iniziale 3x3
    const board = [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ];

    const currentPlayer = 'X';

    // Genera bottoni dal canvas
    function buildBoardButtons(board) {
      const buttons = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const value = board[r][c];

          buttons.push({
            id: `cell_${r}_${c}`,
            label: value === '' ? ' ' : value,
            disabled: value !== '',
            action: {
              type: 'tris2_move',
              row: r,
              col: c
            }
          });
        }
      }
      return buttons;
    }

    // Foglio principale stile "menu giochi"
    const mainSheet = {
      type: 'FOAIDNixelButtonSheets',
      sheet_id: 'tris2_menu',
      title: 'Mini Giochi',
      subtitle: 'Scegli un gioco',
      style: '888_minimal',
      layout: 'list',
      buttons: [
        {
          id: 'tris2_game',
          label: 'Tic Tac Toe',
          action: {
            type: 'open_embedded_screen',
            screen_id: 'tris2_main'
          }
        }
      ],
      footer_text: '888 • FOAID Game Menu'
    };

    // Screen del gioco Tris
    const trisScreen = {
      screen_id: 'tris2_main',
      type: 'embedded_screens',
      layout: 'sheet',
      title: 'Tic Tac Toe',
      subtitle: `Turno: ${currentPlayer}`,
      body: [
        {
          type: 'grid',
          layout: '3x3',
          buttons: buildBoardButtons(board)
        }
      ],
      actions: [
        {
          id: 'tris2_back',
          label: 'Torna al menu',
          action: {
            type: 'open_sheet',
            sheet_id: 'tris2_menu'
          }
        }
      ]
    };

    // Screen risultato
    const resultScreen = {
      screen_id: 'tris2_result',
      type: 'embedded_screens',
      layout: 'sheet',
      title: 'Risultato',
      body: [
        {
          type: 'text',
          id: 'tris2_result_text',
          content: 'Risultato da aggiornare lato handler.'
        }
      ],
      actions: [
        {
          id: 'tris2_restart',
          label: 'Nuova partita',
          action: {
            type: 'open_sheet',
            sheet_id: 'tris2_main'
          }
        }
      ]
    };

    // Payload finale
    await sendMessage(ctx.chatId, {
      screens: {
        tris2_menu: mainSheet,
        tris2_main: trisScreen,
        tris2_result: resultScreen
      },
      entrypoint: 'tris2_menu',
      meta: {
        board,
        currentPlayer
      }
    });
  }
};