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

/* =========================================================
   MODULE CHECK
   ========================================================= */

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

/* =========================================================
   PACKAGE INFO
   ========================================================= */

const { name, author } = require(join(__dirname, './package.json'));

/* =========================================================
   CFONTS
   ========================================================= */

let cfonts;

try {
  cfonts = (await import('cfonts')).default;
} catch (error) {
  console.error('Errore caricamento cfonts, reinstallazione...');
  execSync('npm install', { stdio: 'inherit' });
  cfonts = (await import('cfonts')).default;
}

/* =========================================================
   READLINE
   ========================================================= */

const rl = createInterface(process.stdin, process.stdout);

/* =========================================================
   UTILITIES
   ========================================================= */

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const clearScreen = () => { process.stdout.write('\x1b[2J\x1b[H'); };
const hideCursor = () => { process.stdout.write('\x1b[?25l'); };
const showCursor = () => { process.stdout.write('\x1b[?25h'); };
const resetTerminal = () => { process.stdout.write('\x1b[0m'); };

/* =========================================================
   STAFF
   ========================================================= */

const STAFF_ESCLUSO = ['mattia', 'fuma'];

const STAFF_PATHS = [
  join(__dirname, 'data', 'staff.json'),
  join(__dirname, 'staff.json'),
  join(__dirname, 'lib', 'staff.json'),
  join(__dirname, 'config', 'staff.json')
];

let staffDebug = '';

const normalizeStaff = (raw) => {
  let list = raw;

  if (!Array.isArray(list) && list && typeof list === 'object') {
    const arr = list.staff || list.team || list.members || list.membri;
    if (Array.isArray(arr)) {
      list = arr;
    } else {
      // formato { "Nome": { ruolo: "..." } } oppure { "Nome": "Ruolo" }
      list = Object.entries(list).map(([k, v]) =>
        typeof v === 'string' ? { nome: k, ruolo: v } : { nome: k, ...v }
      );
    }
  }

  if (!Array.isArray(list)) return [];

  return list
    .map(m => {
      if (typeof m === 'string') return { nome: m, ruolo: 'Staff', emoji: '👤' };
      return {
        nome:  m?.nome || m?.name || m?.nickname || m?.user || m?.username,
        ruolo: m?.ruolo || m?.role || m?.rank || m?.grado || 'Staff',
        emoji: m?.emoji || m?.icon || '👤'
      };
    })
    .filter(m => m.nome);
};

const loadStaff = () => {
  staffDebug = '';

  for (const p of STAFF_PATHS) {
    if (!existsSync(p)) continue;

    try {
      const staff = normalizeStaff(JSON.parse(readFileSync(p, 'utf8')));

      const filtered = staff.filter(m => {
        const nome = String(m.nome).toLowerCase();
        return !STAFF_ESCLUSO.some(x => nome.includes(x));
      });

      if (filtered.length) return filtered;
      staffDebug = `${p} trovato ma vuoto/non valido`;
    } catch (e) {
      staffDebug = `${p}: ${e.message}`;
    }
  }

  if (!staffDebug) staffDebug = 'data/staff.json non trovato';
  return [];
};

/* =========================================================
   TERMINAL HELPERS
   ========================================================= */

const getTerminalWidth = () => process.stdout.columns || 80;

const stripAnsi = (text) => text.replace(/\x1b\[[0-9;]*m/g, '');

const centerText = (text) => {
  const width = getTerminalWidth();
  const visibleLength = stripAnsi(text).length;
  const padding = Math.max(0, Math.floor((width - visibleLength) / 2));
  return ' '.repeat(padding) + text;
};

/* =========================================================
   CINEMATIC TEXT
   ========================================================= */

const cinematicText = async (
  text,
  { color = '\x1b[97m', delay = 50, hold = 700, clear = true } = {}
) => {
  if (clear) {
    clearScreen();
    await sleep(250);
  }

  let current = '';

  for (const char of text) {
    current += char;
    process.stdout.write('\r' + centerText(`${color}${current}\x1b[0m`));
    await sleep(delay);
  }

  process.stdout.write('\n');
  await sleep(hold);
};

/* =========================================================
   FADE EFFECT
   ========================================================= */

const fadeText = async (text, color = '\x1b[97m', duration = 900) => {
  const steps = 10;

  for (let i = 0; i <= steps; i++) {
    clearScreen();
    const progress = i / steps;

    console.log('\n\n\n');

    if (progress < 0.3) {
      console.log(
        centerText(`\x1b[90m${'░'.repeat(Math.max(1, text.length))}\x1b[0m`)
      );
    } else {
      console.log(centerText(`${color}${text}\x1b[0m`));
    }

    await sleep(duration / steps);
  }

  await sleep(300);
};

/* =========================================================
   CINEMATIC FLASH
   ========================================================= */

const cinematicFlash = async () => {
  for (let i = 0; i < 3; i++) {
    clearScreen();
    process.stdout.write('\x1b[97m');
    console.log('\n\n\n\n');
    console.log(centerText('████████████████████████████████████'));
    console.log(centerText('████████████████████████████████████'));
    resetTerminal();
    await sleep(35);
    clearScreen();
    await sleep(45);
  }
};

/* =========================================================
   GIANT TITLE (888 BOT v1.3 2K26)
   ========================================================= */

const renderLines = (text, font, letterSpacing = 1) =>
  cfonts.render(text, {
    font,
    gradient: ['#ff2bd6', '#00e5ff'],
    transitionGradient: true,
    letterSpacing,
    space: false,
    maxLength: '0' // niente wrap automatico di cfonts
  }).array.filter((l, i, a) => stripAnsi(l).trim() || (i > 0 && i < a.length - 1));

const maxWidth = (lines) =>
  Math.max(0, ...lines.map(l => stripAnsi(l).length));

const giantTitle = async () => {
  const avail = getTerminalWidth() - 2;

  // Dal più grande al più piccolo: il primo che ci sta viene usato
  const candidates = [
    () => renderLines('888 BOT', 'block', 1),
    () => renderLines('888 BOT', 'block', 0),
    () => [...renderLines('888', 'block', 1), '', ...renderLines('BOT', 'block', 1)],
    () => [...renderLines('888', 'block', 0), '', ...renderLines('BOT', 'block', 0)],
    () => renderLines('888 BOT', 'tiny', 1),
    () => ['\x1b[1m\x1b[95m8 8 8   B O T\x1b[0m']
  ];

  let lines = [];
  for (const build of candidates) {
    try {
      lines = build();
      if (maxWidth(lines) <= avail) break;
    } catch {}
  }

  for (const line of lines) {
    console.log(centerText(line));
    await sleep(70);
  }

  console.log('');
  console.log(centerText('\x1b[90m' + '━'.repeat(34) + '\x1b[0m'));
  console.log(centerText('\x1b[1m\x1b[97mv 1 . 3   •   2 K 2 6\x1b[0m'));
  console.log(centerText('\x1b[90m' + '━'.repeat(34) + '\x1b[0m'));
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
  console.log(centerText('\x1b[92m● BOT ONLINE\x1b[0m'));
  await sleep(400);
  console.log(centerText('\x1b[90mWHATSAPP BOT • STABLE • READY\x1b[0m'));
  await sleep(1800);
};

/* =========================================================
   CINEMATIC PROGRESS BAR
   ========================================================= */

const cinematicBar = async (label, duration = 800) => {
  const width = 34;
  const steps = 30;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const filled = Math.floor(width * progress);
    const empty = width - filled;

    const bar =
      '\x1b[96m' + '━'.repeat(filled) +
      '\x1b[90m' + '─'.repeat(empty) +
      '\x1b[0m';

    const percentage = Math.floor(progress * 100);

    clearScreen();
    console.log('\n\n\n');
    console.log(centerText(`\x1b[97m${label}\x1b[0m`));
    console.log('\n');
    console.log(centerText(`[${bar}] ${percentage}%`));

    await sleep(duration / steps);
  }

  await sleep(200);
};

/* =========================================================
   SYSTEM SCAN
   ========================================================= */

const systemScan = async (text, color = '\x1b[96m') => {
  clearScreen();
  console.log('\n\n\n');
  console.log(centerText('\x1b[90m────────────────────────────────────────\x1b[0m'));
  console.log(centerText(`${color}${text}\x1b[0m`));
  console.log(centerText('\x1b[90m────────────────────────────────────────\x1b[0m'));
  await sleep(550);
};

/* =========================================================
   STAFF CINEMATIC
   ========================================================= */

const roleStyle = (role = '') => {
  const r = role.toLowerCase();
  if (/owner|founder|fondatore|creat/.test(r)) return { c: '\x1b[93m', icon: '♛' };
  if (/dev|svilupp|coder/.test(r))             return { c: '\x1b[96m', icon: '⌬' };
  if (/admin|amministr/.test(r))               return { c: '\x1b[91m', icon: '✦' };
  if (/mod/.test(r))                           return { c: '\x1b[92m', icon: '✧' };
  if (/help|support|assist/.test(r))           return { c: '\x1b[94m', icon: '❖' };
  return { c: '\x1b[95m', icon: '◆' };
};

const spaced = (t) =>
  t.toUpperCase().split(' ').map(w => w.split('').join(' ')).join('   ');

const showStaffCinematic = async () => {
  const staff = loadStaff();

  if (!staff.length) {
    clearScreen();
    console.log('\n\n\n');
    console.log(centerText('\x1b[90mNessun membro dello staff\x1b[0m'));
    console.log(centerText(`\x1b[31m${staffDebug}\x1b[0m`));
    await sleep(2500);
    return;
  }

  for (let i = 0; i < staff.length; i++) {
    const m = staff[i];
    const nome  = String(m?.nome  || 'Membro staff');
    const ruolo = String(m?.ruolo || 'Staff');
    const emoji = m?.emoji || '👤';
    const { c, icon } = roleStyle(ruolo);

    const label = `${icon}  ${spaced(ruolo)}  ${icon}`;
    const inner = Math.max(nome.length, label.length) + 8;
    const pad = (t) => {
      const total = inner - t.length;
      const l = Math.floor(total / 2);
      return ' '.repeat(l) + t + ' '.repeat(total - l);
    };

    clearScreen();
    console.log('\n\n');
    console.log(centerText('\x1b[95mT E A M   8 8 8\x1b[0m'));
    console.log(centerText(`\x1b[90m${String(i + 1).padStart(2, '0')} / ${String(staff.length).padStart(2, '0')}\x1b[0m`));
    console.log('\n');
    console.log(centerText(emoji));
    console.log('');
    console.log(centerText(`${c}╭${'─'.repeat(inner)}╮\x1b[0m`));
    console.log(centerText(`${c}│\x1b[0m${' '.repeat(inner)}${c}│\x1b[0m`));
    console.log(centerText(`${c}│\x1b[1m\x1b[97m${pad(nome)}${c}\x1b[0m${c}│\x1b[0m`));
    console.log(centerText(`${c}│\x1b[0m${' '.repeat(inner)}${c}│\x1b[0m`));
    console.log(centerText(`${c}│${pad(label)}│\x1b[0m`));
    console.log(centerText(`${c}│\x1b[0m${' '.repeat(inner)}${c}│\x1b[0m`));
    console.log(centerText(`${c}╰${'─'.repeat(inner)}╯\x1b[0m`));

    await sleep(1100);
  }

  await sleep(300);
};

/* =========================================================
   EPIC CINEMATIC STARTUP
   ========================================================= */

async function epicStartup() {
  try {
    hideCursor();

    /* ACT I - THE AWAKENING */
    clearScreen();
    await sleep(1000);

    await cinematicText('A NEW SYSTEM', { color: '\x1b[97m', delay: 55, hold: 700 });
    await cinematicText('IS AWAKENING...', { color: '\x1b[90m', delay: 55, hold: 1000 });

    /* ACT II - POWER / PRECISION / SPEED */
    clearScreen();
    await sleep(600);
    await fadeText('POWER', '\x1b[95m', 850);

    clearScreen();
    await sleep(350);
    await fadeText('PRECISION', '\x1b[96m', 850);

    clearScreen();
    await sleep(350);
    await fadeText('SPEED', '\x1b[94m', 850);

    /* ACT III - IMPACT */
    clearScreen();
    await sleep(900);
    await cinematicFlash();
    await cinematicLogo();

    /* ACT IV - VERSION */
    clearScreen();
    console.log('\n\n\n');
    console.log(centerText('\x1b[90m888 BOT\x1b[0m'));
    await sleep(300);
    console.log(centerText('\x1b[97mVERSION 1.3 • 2K26\x1b[0m'));
    await sleep(500);
    console.log(centerText('\x1b[90mCINEMATIC SYSTEM INITIALIZATION\x1b[0m'));
    await sleep(700);

    /* ACT V - BOOT SEQUENCE */
    await cinematicBar('INITIALIZING CORE', 850);
    await cinematicBar('LOADING ENGINE', 850);
    await cinematicBar('ESTABLISHING CONNECTION', 900);
    await cinematicBar('VERIFYING SECURITY', 750);

    /* ACT VI - SYSTEM CHECK */
    await systemScan('CPU CORE ................ ONLINE', '\x1b[92m');
    await systemScan('MEMORY .................. ONLINE', '\x1b[92m');
    await systemScan('NETWORK ................. ONLINE', '\x1b[92m');
    await systemScan('WHATSAPP ENGINE ......... ONLINE', '\x1b[92m');
    await systemScan('PLUGIN SYSTEM ........... ONLINE', '\x1b[92m');

    /* ACT VII - TEAM 888 */
    await showStaffCinematic();

    /* ACT VIII - FINAL SYSTEM STATUS */
    clearScreen();
    await sleep(700);
    console.log('\n\n\n');
    console.log(centerText('\x1b[90mSYSTEM STATUS\x1b[0m'));
    await sleep(450);
    console.log('\n');
    console.log(centerText('\x1b[92m● ALL SYSTEMS OPERATIONAL\x1b[0m'));
    await sleep(650);

    /* FINAL REVEAL */
    await finalLogo();

    /* FINAL CLEAN STATUS */
    clearScreen();
    await sleep(300);
    console.log('\n\n');
    console.log(centerText('\x1b[95m888 BOT\x1b[0m'));
    console.log('\n');
    console.log(centerText('\x1b[92m● ONLINE\x1b[0m'));
    console.log(centerText('\x1b[90mVersion 1.3 • 2K26 • Stable • Ready\x1b[0m'));
    console.log('\n');
    console.log(centerText('\x1b[90m────────────────────────────────────────\x1b[0m'));
    console.log('\n');

  } finally {
    resetTerminal();
    showCursor();
  }
}

/* =========================================================
   BOT PROCESS
   ========================================================= */

let isRunning = false;

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  await epicStartup();

  const args = [join(__dirname, file), ...process.argv.slice(2)];

  console.log('\x1b[32m✓ Sistema pronto\x1b[0m');
  console.log('\x1b[32m✓ Bot online\x1b[0m');
  console.log('\x1b[32m✓ Tutti i sistemi operativi\x1b[0m\n');

  /* CLUSTER MASTER */
  setupMaster({
    exec: args[0],
    args: args.slice(1)
  });

  let processInstance = fork();

  /* IPC MESSAGE */
  processInstance.on('message', (data) => {
    console.log('\x1b[36m[→]\x1b[0m', data);

    switch (data) {
      case 'reset':
        console.log('\x1b[33m\n⟳ Riavvio in corso...\x1b[0m\n');
        processInstance.kill();
        isRunning = false;
        start(file);
        break;

      case 'uptime':
        processInstance.send(process.uptime());
        break;
    }
  });

  /* RESTART SYSTEM */
  let restartAttempts = 0;
  const MAX_RESTART_ATTEMPTS = 10;

  processInstance.on('exit', (_, code) => {
    isRunning = false;

    console.error('\n\x1b[31m✖ Processo terminato [' + code + ']\x1b[0m\n');

    /* Voluntary restart */
    if (code === 42) {
      console.log('\x1b[32m↻ Riavvio volontario...\x1b[0m\n');
      setTimeout(() => start(file), 2000);
      return;
    }

    /* Crash */
    if (code !== 0) {
      restartAttempts++;

      /* Too many attempts */
      if (restartAttempts > MAX_RESTART_ATTEMPTS) {
        console.error(
          '\x1b[31m✖ Troppi tentativi di restart. ' +
          'In attesa di modifiche al file...\x1b[0m\n'
        );

        watchFile(args[0], () => {
          unwatchFile(args[0]);
          restartAttempts = 0;
          console.log('\x1b[32m↻ Recupero automatico...\x1b[0m\n');
          start(file);
        });

        return;
      }

      /* Progressive restart delay */
      const delay = Math.min(3000 * restartAttempts, 15000);

      console.log(
        `\x1b[32m↻ Riavvio automatico tra ${delay / 1000} secondi... ` +
        `(tentativo ${restartAttempts}/${MAX_RESTART_ATTEMPTS})\x1b[0m\n`
      );

      setTimeout(() => {
        isRunning = false;
        start(file);
      }, delay);
    }
  });

  /* YARGS */
  let opts = new Object(
    yargs(process.argv.slice(2)).exitProcess(false).parse()
  );

  /* TERMINAL INPUT */
  if (!opts['test']) {
    rl.removeAllListeners('line');

    rl.on('line', (line) => {
      if (
        processInstance &&
        processInstance.connected &&
        typeof processInstance.send === 'function'
      ) {
        processInstance.send(line.trim());
      }
    });
  }
}

/* =========================================================
   START
   ========================================================= */

start('888.js');
