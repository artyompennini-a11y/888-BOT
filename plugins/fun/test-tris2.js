module.exports = {
  name: 'tris2_nixel',
  command: ['tris2'],
  description: 'Tris2 con FOAIDNixelButtonSheets + embedded_screens',

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
          const cellId = `cell_${r}_${c}`;
          const value = board[r][c];

          buttons.push({
            id: cellId,
            label: value === '' ? ' ' : value,
            row: r,
            col: c,
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

    // Foglio principale
    const mainSheet = {
      type: 'FOAIDNixelButtonSheets',
      sheet_id: 'tris2_main',
      title: 'Tris2',
      subtitle: `Turno: ${currentPlayer}`,
      style: '888_minimal',
      layout: 'grid_3x3',
      buttons: buildBoardButtons(board),
      footer_text: 'Tris2 • FOAIDNixelButtonSheets'
    };

    // Screen risultato
    const embeddedScreens = [
      {
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
            label: '🔁 Nuova partita',
            action: {
              type: 'open_sheet',
              sheet_id: 'tris2_main'
            }
          }
        ]
      }
    ];

    // Payload finale
    const payload = {
      screens: {
        tris2_main: mainSheet,
        embedded_screens
      },
      entrypoint: 'tris2_main',
      meta: {
        game_type: 'tris2',
        board,
        currentPlayer
      }
    };

    await sendMessage(ctx.chatId, payload);
  }
};