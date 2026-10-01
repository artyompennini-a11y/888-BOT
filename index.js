// Plugin by elixir, punisher & 888 staff
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { setupMaster, fork } from 'cluster';
import { watchFile, unwatchFile, existsSync, readFileSync } from 'fs';
import { createInterface } from 'readline';
import yargs from 'yargs';
import { execSync } from 'child_process';

process.env.SUPPRESS_BANNER = 'true';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);



const checkAndInstallModules = () => {
  const nodeModulesPath = join(__dirname, 'node_modules');

  if (!existsSync(nodeModulesPath)) {
    console.clear();
    console.log('\n\n');
    console.log('\x1b[31m' + '═'.repeat(70) + '\x1b[0m');
    console.log('\x1b[33m\n   Bro e senza moduli come avvi il bot?\x1b[0m');
    console.log('\x1b[36m   Menomale che ci sono io! 😎\x1b[0m\n');
    console.log('\x1b[31m' + '═'.repeat(70) + '\x1b[0m');
    console.log('\n\x1b[35m⚡ Installazione moduli in corso...\x1b[0m\n');

    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('\n\x1b[32m✓ Moduli installati con successo!\x1b[0m');
      console.log('\x1b[36m🚀 Avvio del bot...\x1b[0m\n');
    } catch (error) {
      console.error('\n\x1b[31m✖ Errore durante l\'installazione dei moduli\x1b[0m');
      process.exit(1);
    }
  }
};

checkAndInstallModules();



const { name, author } = require(join(__dirname, './package.json'));



let cfonts;

try {
  cfonts = (await import('cfonts')).default;
} catch (error) {
  console.error('Errore caricamento cfonts, reinstallazione...');
  execSync('npm install', { stdio: 'inherit' });
  cfonts = (await import('cfonts')).default;
}



const rl = createInterface(process.stdin, process.stdout);



const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const clearScreen = () => {
  process.stdout.write('\x1b[2J\x1b[H');
};

const hideCursor = () => {
  process.stdout.write('\x1b[?25l');
};

const showCursor = () => {
  process.stdout.write('\x1b[?25h');
};

const resetTerminal = () => {
  process.stdout.write('\x1b[0m');
};



const getTerminalWidth = () => process.stdout.columns || 80;

const stripAnsi = (text) =>
  text.replace(
    /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]+)*)?\u0007)|(?:(?:\d{1,4}(?:[;:]\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g,
    ''
  );


const visibleLength = (text) => {

  return [...stripAnsi(String(text ?? '')).replace(/\r/g, '')].length;
};


const centerText = (text) => {
  const width = getTerminalWidth();
  const visible = visibleLength(text);
  const padding = Math.max(0, Math.floor((width - visible) / 2));

  return ' '.repeat(padding) + text;
};



const centerAsciiBlock = (lines) => {
  const terminalWidth = getTerminalWidth();

  if (!lines || lines.length === 0) {
    return [];
  }


  const cleanedLines = lines.map(line =>
    String(line).replace(/\r/g, '')
  );


  const blockWidth = Math.max(
    0,
    ...cleanedLines.map(line => visibleLength(line))
  );


  const blockPadding = Math.max(
    0,
    Math.floor((terminalWidth - blockWidth) / 2)
  );


  return cleanedLines.map(line => {
    const lineWidth = visibleLength(line);
    const rightPadding = Math.max(0, blockWidth - lineWidth);

    return (
      ' '.repeat(blockPadding) +
      line +
      ' '.repeat(rightPadding)
    );
  });
};



const cinematicText = async (
  text,
  {
    color = '\x1b[97m',
    delay = 50,
    hold = 700,
    clear = true
  } = {}
) => {
  if (clear) {
    clearScreen();
    await sleep(250);
  }

  let current = '';

  for (const char of text) {
    current += char;

    process.stdout.write(
      '\r' +
      centerText(`${color}${current}\x1b[0m`)
    );

    await sleep(delay);
  }

  process.stdout.write('\n');
  await sleep(hold);
};



const fadeText = async (
  text,
  color = '\x1b[97m',
  duration = 900
) => {
  const steps = 10;

  for (let i = 0; i <= steps; i++) {
    clearScreen();

    const progress = i / steps;

    console.log('\n\n\n');

    if (progress < 0.3) {
      console.log(
        centerText(
          `\x1b[90m${'░'.repeat(
            Math.max(1, text.length)
          )}\x1b[0m`
        )
      );
    } else {
      console.log(
        centerText(`${color}${text}\x1b[0m`)
      );
    }

    await sleep(duration / steps);
  }

  await sleep(300);
};



const cinematicFlash = async () => {
  for (let i = 0; i < 3; i++) {
    clearScreen();

    process.stdout.write('\x1b[97m');

    console.log('\n\n\n\n');

    console.log(
      centerText(
        '████████████████████████████████████'
      )
    );

    console.log(
      centerText(
        '████████████████████████████████████'
      )
    );

    resetTerminal();

    await sleep(35);

    clearScreen();

    await sleep(45);
  }
};



const renderLines = (
  text,
  font,
  letterSpacing = 1
) =>
  cfonts
    .render(text, {
      font,
      gradient: ['#ff2bd6', '#00e5ff'],
      transitionGradient: true,
      letterSpacing,
      space: false
    })
    .array

    .filter(
      (l, i, a) =>
        stripAnsi(l).trim() ||
        (i > 0 && i < a.length - 1)
    );


const maxWidth = (lines) =>
  Math.max(
    0,
    ...lines.map(line => visibleLength(line))
  );



const giantTitle = async () => {
  const avail = getTerminalWidth() - 2;


  const candidates = [
    () => renderLines(
      '888 BOT',
      'simple',
      1
    ),

    () => renderLines(
      '888 BOT',
      'simple',
      0
    ),

    () => [
      ...renderLines(
        '888',
        'simple',
        1
      ),
      '',
      ...renderLines(
        'BOT',
        'simple',
        1
      )
    ],

    () => [
      ...renderLines(
        '888',
        'simple',
        0
      ),
      '',
      ...renderLines(
        'BOT',
        'simple',
        0
      )
    ],

    () => renderLines(
      '888 BOT',
      'tiny',
      1
    ),

    () => [
      '\x1b[1m\x1b[95m8 8 8   B O T\x1b[0m'
    ]
  ];

  let lines = [];

  for (const build of candidates) {
    try {
      const candidate = build();

      if (maxWidth(candidate) <= avail) {
        lines = candidate;
        break;
      }
    } catch {}
  }


  const centeredLines = centerAsciiBlock(lines);

  for (const line of centeredLines) {
    console.log(line);
    await sleep(70);
  }

  console.log('');

  console.log(
    centerText(
      '\x1b[90m' +
      '━'.repeat(34) +
      '\x1b[0m'
    )
  );

  console.log(
    centerText(
      '\x1b[1m\x1b[97m' +
      'v 1 . 3   •   2 K 2 6' +
      '\x1b[0m'
    )
  );

  console.log(
    centerText(
      '\x1b[90m' +
      '━'.repeat(34) +
      '\x1b[0m'
    )
  );
};



const cinematicLogo = async () => {
  clearScreen();

  console.log('\n\n');

  await giantTitle();

  await sleep(1500);
};



const finalLogo = async () => {
  clearScreen();

  console.log('\n\n');

  await giantTitle();

  console.log('\n');

  await sleep(500);

  console.log(
    centerText(
      '\x1b[92m● BOT ONLINE\x1b[0m'
    )
  );

  await sleep(400);

  console.log(
    centerText(
      '\x1b[90mWHATSAPP BOT • STABLE • READY\x1b[0m'
    )
  );

  await sleep(1800);
};



const cinematicBar = async (
  label,
  duration = 800
) => {
  const width = 34;
  const steps = 30;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;

    const filled = Math.floor(
      width * progress
    );

    const empty = width - filled;

    const bar =
      '\x1b[96m' +
      '━'.repeat(filled) +
      '\x1b[90m' +
      '─'.repeat(empty) +
      '\x1b[0m';

    const percentage =
      Math.floor(progress * 100);

    clearScreen();

    console.log('\n\n\n');

    console.log(
      centerText(
        `\x1b[97m${label}\x1b[0m`
      )
    );

    console.log('\n');

    console.log(
      centerText(
        `[${bar}] ${percentage}%`
      )
    );

    await sleep(
      duration / steps
    );
  }

  await sleep(200);
};



const systemScan = async (
  text,
  color = '\x1b[96m'
) => {
  clearScreen();

  console.log('\n\n\n');

  console.log(
    centerText(
      '\x1b[90m────────────────────────────────────────\x1b[0m'
    )
  );

  console.log(
    centerText(
      `${color}${text}\x1b[0m`
    )
  );

  console.log(
    centerText(
      '\x1b[90m────────────────────────────────────────\x1b[0m'
    )
  );

  await sleep(550);
};



async function epicStartup() {
  try {
    hideCursor();



    clearScreen();

    await sleep(1000);

    await cinematicText(
      'A NEW SYSTEM',
      {
        color: '\x1b[97m',
        delay: 55,
        hold: 700
      }
    );

    await cinematicText(
      'IS AWAKENING...',
      {
        color: '\x1b[90m',
        delay: 55,
        hold: 1000
      }
    );



    clearScreen();

    await sleep(600);

    await fadeText(
      'POWER',
      '\x1b[95m',
      850
    );

    clearScreen();

    await sleep(350);

    await fadeText(
      'PRECISION',
      '\x1b[96m',
      850
    );

    clearScreen();

    await sleep(350);

    await fadeText(
      'SPEED',
      '\x1b[94m',
      850
    );



    clearScreen();

    await sleep(900);

    await cinematicFlash();

    await cinematicLogo();



    clearScreen();

    console.log('\n\n\n');

    console.log(
      centerText(
        '\x1b[90m888 BOT\x1b[0m'
      )
    );

    await sleep(300);

    console.log(
      centerText(
        '\x1b[97mVERSION 1.3 • 2K26\x1b[0m'
      )
    );

    await sleep(500);

    console.log(
      centerText(
        '\x1b[90mCINEMATIC SYSTEM INITIALIZATION\x1b[0m'
      )
    );

    await sleep(700);



    await cinematicBar(
      'INITIALIZING CORE',
      850
    );

    await cinematicBar(
      'LOADING ENGINE',
      850
    );

    await cinematicBar(
      'ESTABLISHING CONNECTION',
      900
    );

    await cinematicBar(
      'VERIFYING SECURITY',
      750
    );



    await systemScan(
      'CPU CORE ................ ONLINE',
      '\x1b[92m'
    );

    await systemScan(
      'MEMORY .................. ONLINE',
      '\x1b[92m'
    );

    await systemScan(
      'NETWORK ................. ONLINE',
      '\x1b[92m'
    );

    await systemScan(
      'WHATSAPP ENGINE ......... ONLINE',
      '\x1b[92m'
    );

    await systemScan(
      'PLUGIN SYSTEM ........... ONLINE',
      '\x1b[92m'
    );



    clearScreen();

    await sleep(700);

    console.log('\n\n\n');

    console.log(
      centerText(
        '\x1b[90mSYSTEM STATUS\x1b[0m'
      )
    );

    await sleep(450);

    console.log('\n');

    console.log(
      centerText(
        '\x1b[92m● ALL SYSTEMS OPERATIONAL\x1b[0m'
      )
    );

    await sleep(650);



    await finalLogo();



    clearScreen();

    await sleep(300);

    console.log('\n\n');

    console.log(
      centerText(
        '\x1b[95m888 BOT\x1b[0m'
      )
    );

    console.log('\n');

    console.log(
      centerText(
        '\x1b[92m● ONLINE\x1b[0m'
      )
    );

    console.log(
      centerText(
        '\x1b[90mVersion 1.3 • 2K26 • Stable • Ready\x1b[0m'
      )
    );

    console.log('\n');

    console.log(
      centerText(
        '\x1b[90m────────────────────────────────────────\x1b[0m'
      )
    );

    console.log('\n');

  } finally {
    resetTerminal();
    showCursor();
  }
}



let isRunning = false;

async function start(file) {
  if (isRunning) return;

  isRunning = true;

  await epicStartup();

  const args = [
    join(__dirname, file),
    ...process.argv.slice(2)
  ];

  console.log(
    '\x1b[32m✓ Sistema pronto\x1b[0m'
  );

  console.log(
    '\x1b[32m✓ Bot online\x1b[0m'
  );

  console.log(
    '\x1b[32m✓ Tutti i sistemi operativi\x1b[0m\n'
  );



  setupMaster({
    exec: args[0],
    args: args.slice(1)
  });

  let processInstance = fork();



  processInstance.on(
    'message',
    (data) => {
      console.log(
        '\x1b[36m[→]\x1b[0m',
        data
      );

      switch (data) {
        case 'reset':
          console.log(
            '\x1b[33m\n⟳ Riavvio in corso...\x1b[0m\n'
          );

          processInstance.kill();

          isRunning = false;

          start(file);

          break;

        case 'uptime':
          processInstance.send(
            process.uptime()
          );

          break;
      }
    }
  );



  let restartAttempts = 0;

  const MAX_RESTART_ATTEMPTS = 10;

  processInstance.on(
    'exit',
    (_, code) => {
      isRunning = false;

      console.error(
        '\n\x1b[31m✖ Processo terminato [' +
        code +
        ']\x1b[0m\n'
      );



      if (code === 42) {
        console.log(
          '\x1b[32m↻ Riavvio volontario...\x1b[0m\n'
        );

        setTimeout(
          () => start(file),
          2000
        );

        return;
      }



      if (code !== 0) {
        restartAttempts++;



        if (
          restartAttempts >
          MAX_RESTART_ATTEMPTS
        ) {
          console.error(
            '\x1b[31m✖ Troppi tentativi di restart. ' +
            'In attesa di modifiche al file...\x1b[0m\n'
          );

          watchFile(
            args[0],
            () => {
              unwatchFile(args[0]);

              restartAttempts = 0;

              console.log(
                '\x1b[32m↻ Recupero automatico...\x1b[0m\n'
              );

              start(file);
            }
          );

          return;
        }



        const delay = Math.min(
          3000 * restartAttempts,
          15000
        );

        console.log(
          `\x1b[32m↻ Riavvio automatico tra ` +
          `${delay / 1000} secondi... ` +
          `(tentativo ${restartAttempts}/` +
          `${MAX_RESTART_ATTEMPTS})\x1b[0m\n`
        );

        setTimeout(
          () => {
            isRunning = false;
            start(file);
          },
          delay
        );
      }
    }
  );



  let opts = new Object(
    yargs(
      process.argv.slice(2)
    )
      .exitProcess(false)
      .parse()
  );



  if (!opts['test']) {
    rl.removeAllListeners('line');

    rl.on(
      'line',
      (line) => {
        if (
          processInstance &&
          processInstance.connected &&
          typeof processInstance.send === 'function'
        ) {
          processInstance.send(
            line.trim()
          );
        }
      }
    );
  }
}



start('888.js');
