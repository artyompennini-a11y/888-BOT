import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { setupMaster, fork } from 'cluster';
import { watchFile, unwatchFile, existsSync } from 'fs';
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
    console.log('\x1b[33m\n   Bro e senza moduli come avvi il bot? \x1b[0m');
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
} catch (e) {
  console.error('Errore caricamento cfonts, reinstallazione...');
  execSync('npm install', { stdio: 'inherit' });
  cfonts = (await import('cfonts')).default;
}

const rl = createInterface(process.stdin, process.stdout);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const typeWriterBig = async (text, delay = 100) => {
  let current = '';
  for (let char of text) {
    current += char;
    console.clear();
    console.log('\n\n');
    cfonts.say(current, {
      font: 'block',
      align: 'center',
      gradient: ['magenta', 'cyan'],
      transitionGradient: true,
    });
    await sleep(delay);
  }
};

const loading = async (text, duration = 1000) => {
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  const startTime = Date.now();
  let i = 0;

  return new Promise(resolve => {
    const interval = setInterval(() => {
      process.stdout.write(`\r\x1b[35m${frames[i]} \x1b[36m${text}\x1b[0m`);
      i = (i + 1) % frames.length;

      if (Date.now() - startTime >= duration) {
        clearInterval(interval);
        process.stdout.write(`\r\x1b[32m✓ \x1b[36m${text}\x1b[0m\n`);
        resolve();
      }
    }, 60);
  });
};

const typeWriter = async (text, delay = 25, color = '\x1b[36m') => {
  const reset = '\x1b[0m';
  for (let char of text) {
    process.stdout.write(color + char + reset);
    await sleep(delay);
  }
  console.log();
};

const sparkleLine = async () => {
  const sparkles = ['✦','✧','★','☆','•'];
  let line = '';
  for (let i = 0; i < 40; i++) {
    line += sparkles[Math.floor(Math.random() * sparkles.length)] + ' ';
  }
  process.stdout.write(`\r\x1b[35m${line}\x1b[0m`);
  await sleep(40);
};

const progressBar = async (label, duration = 1200) => {
  const barLength = 40;
  const steps = 50;
  const stepDuration = duration / steps;

  for (let i = 0; i <= steps; i++) {
    const filled = Math.floor((i / steps) * barLength);
    const empty = barLength - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percent = Math.floor((i / steps) * 100);
    process.stdout.write(`\r\x1b[36m${label} \x1b[35m[${bar}] \x1b[33m${percent}%\x1b[0m`);
    await sleep(stepDuration);
  }
  console.log();
};

const showDigitalRain = async (lines = 5) => {
  const colors = ['\x1b[35m','\x1b[36m'];
  const chars = '01アイウエオカキクケコサシスセソタチツテト';
  for (let i = 0; i < lines; i++) {
    let line = '';
    for (let j = 0; j < 60; j++) {
      line += chars[Math.floor(Math.random() * chars.length)] + ' ';
    }
    const color = colors[Math.floor(Math.random() * colors.length)];
    process.stdout.write(`\r${color}${line}\x1b[0m\n`);
    await sleep(50);
  }
};

async function epicStartup() {
  console.clear();

  const introColors = ['\x1b[35m','\x1b[36m'];

  for (let i = 0; i < 6; i++) {
    const c = introColors[i % introColors.length];
    process.stdout.write(`\r${c}▶ Avvio sistema 888-BOT 2026 • Versione 1.2...`);
    await sleep(80);
  }

  console.clear();

  const grid = '▧▨'.repeat(30);
  for (let i = 0; i < 4; i++) {
    const c = introColors[i % introColors.length];
    console.log(c + grid + '\x1b[0m');
    await sleep(60);
  }

  console.clear();
  await typeWriterBig('888\nBOT\n2026\nv1.2', 60);
  await sleep(200);

  await loading('Inizializzazione moduli', 350);
  await loading('Connessione rete WA', 300);
  await loading('Autenticazione 888 Staff', 300);

  console.log('\n\x1b[90m' + '━'.repeat(60) + '\x1b[0m\n');

  await typeWriter('▸ Versione: 1.2-STABLE', 25, '\x1b[35m');
  await typeWriter('▸ Developer: Ghost & Punisher', 25, '\x1b[36m');
  await typeWriter('▸ Fondatore: Elixir 👑', 25, '\x1b[35m');
  await typeWriter('▸ Rete: WhatsApp Web OK', 25, '\x1b[36m');

  console.log('\n');

  for (let i = 0; i < 4; i++) {
    const c = introColors[i % introColors.length];
    process.stdout.write(`\r${c}[ SYSTEM ] 888-BOT 2026 • Versione 1.2 ONLINE 🟢`);
    await sleep(120);
  }

  console.log('\n\x1b[35mAutorizzato dal Fondatore: Elixir 👑\x1b[0m\n');
  console.log('\n\x1b[90m' + '━'.repeat(60) + '\x1b[0m\n');
}

let isRunning = false;

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  await epicStartup();

  const args = [join(__dirname, file), ...process.argv.slice(2)];

  console.log('\x1b[32m✓ Sistema pronto\x1b[0m');
  console.log('\x1b[32m✓ Bot online\x1b[0m');
  console.log('\x1b[32m✓ Tutti i sistemi operativi\x1b[0m\n');

  setupMaster({
    exec: args[0],
    args: args.slice(1),
  });

  let processInstance = fork();

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

  let restartAttempts = 0;
  const MAX_RESTART_ATTEMPTS = 10;

  processInstance.on('exit', (_, code) => {
    isRunning = false;
    console.error('\n\x1b[31m✖ Processo terminato [' + code + ']\x1b[0m\n');

    if (code !== 0) {
      if (code === 42) {
        console.log('\x1b[32m↻ Riavvio volontario...\x1b[0m\n');
        setTimeout(() => start(file), 2000);
        return;
      }

      restartAttempts++;
      if (restartAttempts > MAX_RESTART_ATTEMPTS) {
        console.error('\x1b[31m✖ Troppi tentativi di restart. In attesa di modifiche al file...\x1b[0m\n');
        watchFile(args[0], () => {
          unwatchFile(args[0]);
          restartAttempts = 0;
          console.log('\x1b[32m↻ Recupero automatico...\x1b[0m\n');
          start(file);
        });
        return;
      }

      const delay = Math.min(3000 * restartAttempts, 15000);
      console.log(`\x1b[32m↻ Riavvio automatico tra ${delay/1000} secondi... (tentativo ${restartAttempts}/${MAX_RESTART_ATTEMPTS})\x1b[0m\n`);
      setTimeout(() => {
        isRunning = false;
        start(file);
      }, delay);
    }
  });

  let opts = new Object(
    yargs(process.argv.slice(2)).exitProcess(false).parse()
  );

  if (!opts['test']) {
    rl.removeAllListeners('line'); 
    rl.on('line', (line) => {
      if (processInstance && processInstance.connected && typeof processInstance.send === 'function') {
        try {
          processInstance.send(line.trim());
        } catch (err) {
          if (err.code === 'ERR_IPC_CHANNEL_CLOSED') {
            console.log('\x1b[33m[!] Impossibile inviare: canale IPC chiuso.\x1b[0m');
          } else {
            console.error('\x1b[31m[!] Errore IPC:\x1b[0m', err);
          }
        }
      } else {
        console.log('\x1b[33m[!] Il bot si sta riavviando, input ignorato.\x1b[0m');
      }
    });
  }
}

process.on('uncaughtException', (err) => {
  if (err.code !== 'ERR_IPC_CHANNEL_CLOSED') {
    console.error('\x1b[31m[Cluster] Eccezione non gestita:\x1b[0m', err);
  }
});

process.on('unhandledRejection', (reason) => {
  if (reason?.code === 'ERR_IPC_CHANNEL_CLOSED') return;
  console.error('\x1b[31m[Cluster] Promise rejection non gestita:\x1b[0m', reason instanceof Error ? reason.message : reason);
});

process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    if (warning.emitter && typeof warning.emitter.setMaxListeners === 'function') {
      warning.emitter.setMaxListeners(warning.emitter.getMaxListeners() + 10);
    }
    return;
  }
  if (warning.name !== 'DeprecationWarning') {
    console.warn('\x1b[33m[Cluster] Warning:\x1b[0m', warning.message);
  }
});

process.setMaxListeners(50);

start('888.js');