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
    console.log('\x1b[33m\n Bro e senza moduli come avvi il bot?\x1b[0m');
    console.log('\x1b[36m Menomale che ci sono io! 😎\x1b[0m\n');
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
const clearScreen = () => { process.stdout.write('\x1b[2J\x1b[H'); };
const hideCursor = () => { process.stdout.write('\x1b[?25l'); };
const showCursor = () => { process.stdout.write('\x1b[?25h'); };
const resetTerminal = () => { process.stdout.write('\x1b[0m'); };
const getTerminalWidth = () => process.stdout.columns || 80;
const stripAnsi = (text) => text.replace(/[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]+)*)?\u0007)|(?:(?:\d{1,4}(?:[;:]\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g, '');
const visibleLength = (text) => stripAnsi(text).replace(/\r/g, '').length;

const centerText = (text) => {
  const width = getTerminalWidth();
  const visible = visibleLength(text);
  const padding = Math.max(0, Math.floor((width - visible) / 2));
  return ' '.repeat(padding) + text;
};

const centerAsciiBlock = (lines) => {
  const terminalWidth = getTerminalWidth();
  if (!lines || lines.length === 0) return [];
  const cleanedLines = lines.map(line => String(line).replace(/\r/g, ''));
  const blockWidth = Math.max(0, ...cleanedLines.map(line => visibleLength(line)));
  const blockPadding = Math.max(0, Math.floor((terminalWidth - blockWidth) / 2)); // ← FIX APPLICATO QUI
  return cleanedLines.map(line => {
    const lineWidth = visibleLength(line);
    const internalPadding = Math.max(0, Math.floor((blockWidth - lineWidth) / 2));
    return ' '.repeat(blockPadding + internalPadding) + line;
  });
};

const cinematicText = async (text, { color = '\x1b[97m', delay = 50, hold = 700, clear = true } = {}) => {
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

const fadeText = async (text, color = '\x1b[97m', duration = 900) => {
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    clearScreen();
    const progress = i / steps;
    console.log('\n\n\n');
    if (progress < 0.3) {
      console.log(centerText(`\x1b[90m${'░'.repeat(Math.max(1, text.length))}\x1b[0m`));
    } else {
      console.log(centerText(`${color}${text}\x1b[0m`));
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
    console.log(centerText('████████████████████████████████████'));
    console.log(centerText('████████████████████████████████████'));
    resetTerminal();
    await sleep(35);
    clearScreen();
    await sleep(45);
  }
};

const renderLines = (text, font, letterSpacing = 1) => cfonts.render(text, { font, gradient: ['#ff2bd6', '#00e5ff'], transitionGradient: true, letterSpacing, space: false, maxLength: '0' }).array.filter((l, i, a) => stripAnsi(l).trim() || (i > 0 && i < a.length - 1));

const maxWidth = (lines) => Math.max(0, ...lines.map(line => visibleLength(line)));

const giantTitle = async () => {
  const avail = getTerminalWidth() - 2;
  const candidates = [
    () => renderLines('888 BOT', 'block', 1),
    () => renderLines('888 BOT', 'block', 0),
    () => [...renderLines('888', 'block', 1), '', ...renderLines('BOT', 'block', 1)],
    () => [...renderLines('888', 'block', 0), '', ...renderLines('BOT', 'block', 0)],
    () => renderLines('888 BOT', 'tiny', 1),
    () => ['\x1b[1m\x1b[95m8 8 8 B O T\x1b[0m']
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
  console.log(centerText('\x1b[90m' + '━'.repeat(34) + '\x1b[0m'));
  console.log(centerText('\x1b[1m\x1b[97m' + 'v 1 . 3 • 2 K 2 6' + '\x1b[0m'));
  console.log(centerText('\x1b[90m' + '━'.repeat(34) + '\x1b[0m'));
};
const systemStartup = async () => {
  hideCursor();
  clearScreen();
  await cinematicFlash();
  clearScreen();
  console.log('\n\n');
  await cinematicText('\x1b[36m⚡ SYSTEM STARTUP\x1b[0m', { delay: 30, hold: 200 });
  await sleep(100);
  await cinematicText('\x1b[33m◆ ALL SYSTEMS OPERATIONAL\x1b[0m', { delay: 25, hold: 200 });
  await sleep(100);
  clearScreen();
  console.log('\n');
  await giantTitle();
  await sleep(600);
  clearScreen();
  console.log('\n');
  await giantTitle();
  await fadeText('\x1b[92m» Ready to serve\x1b[0m', '\x1b[92m', 1200);
  showCursor();
};

const startBot = async () => {
  clearScreen();
  hideCursor();
  console.log('\n\n\n\n');
  console.log(centerText('\x1b[97m Initializing core systems...\x1b[0m'));
  await sleep(800);
  clearScreen();
  console.log('\n');
  console.log(centerText('\x1b[36m⚡ SYSTEM STARTUP\x1b[0m'));
  console.log(centerText('\x1b[33m◆ ALL SYSTEMS OPERATIONAL\x1b[0m'));
  await sleep(500);
  await giantTitle();
  await sleep(500);
  showCursor();
  console.log(centerText('\x1b[92m✓ Bot initialized successfully!\x1b[0m'));
  console.log(centerText('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m'));
  console.log(centerText(`\x1b[97mBot Name: \x1b[1m${name}\x1b[0m`));
  console.log(centerText(`\x1b[97mAuthor: \x1b[1m${author}\x1b[0m`));
  console.log(centerText('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m'));
};

const startProcess = (file) => {
  const child = fork(file);
  child.on('restart', () => {
    child.kill();
    startProcess(file);
  });
};

const runMaster = async () => {
  const argv = await yargs(process.argv.slice(2)).argv;
  const botFile = argv.file || 'index.js';
  const mainFile = join(__dirname, botFile);

  if (!existsSync(mainFile)) {
    console.error(`❌ File not found: ${mainFile}`);
    process.exit(1);
  }

  setupMaster({ exec: mainFile });

  if (argv.noscreen) {
    console.log(`[${new Date().toLocaleTimeString()}] Avviando ${botFile} in background...`);
    startProcess(mainFile);
  } else {
    await systemStartup();
    await sleep(800);
    console.log(centerText('\x1b[36m💻 Starting main process...\x1b[0m'));
    await sleep(500);
    startProcess(mainFile);
  }

  console.log(centerText('\x1b[90mPress Ctrl+C to stop\x1b[0m'));

  watchFile(mainFile, () => {
    console.log(`\n\x1b[33m[${new Date().toLocaleTimeString()}] ${botFile} has been modified. Restarting...\x1b[0m\n`);
  });

  process.on('SIGINT', () => {
    console.log('\n\x1b[31m🛑 Shutting down...\x1b[0m');
    unwatchFile(mainFile);
    process.exit(0);
  });
};

if (process.argv.includes('--start-fresh')) {
  await systemStartup();
} else {
  runMaster();
}