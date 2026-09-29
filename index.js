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

// ———————————————————————————————————————————————
// AUTO INSTALL MODULI
// ———————————————————————————————————————————————

const checkAndInstallModules = () => {
  const nodeModulesPath = join(__dirname, 'node_modules');

  if (!existsSync(nodeModulesPath)) {
    console.clear();
    console.log("\x1b[35mInstallazione moduli...\x1b[0m\n");

    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log("\x1b[32m✓ Moduli installati\x1b[0m\n");
    } catch (error) {
      console.error("\x1b[31mErrore installazione moduli\x1b[0m");
      process.exit(1);
    }
  }
};

checkAndInstallModules();

let cfonts;
try {
  cfonts = (await import('cfonts')).default;
} catch {
  execSync('npm install', { stdio: 'inherit' });
  cfonts = (await import('cfonts')).default;
}

const rl = createInterface(process.stdin, process.stdout);

// ———————————————————————————————————————————————
// FUNZIONI UTILI
// ———————————————————————————————————————————————

const sleep = ms => new Promise(r => setTimeout(r, ms));

const loadStaff = () => {
  try {
    const staff = JSON.parse(readFileSync(join(__dirname, 'data', 'staff.json'), 'utf8'));
    return Array.isArray(staff) ? staff : [];
  } catch {
    return [];
  }
};

// ———————————————————————————————————————————————
// NUOVA ANIMAZIONE: PHASE‑REVEAL 888 + SCRITTA ENORME
// ———————————————————————————————————————————————

async function startupPhaseReveal() {
  console.clear();

  const phases = [
    { label: "BOOT SEQUENCE", color: "\x1b[35m" },
    { label: "CORE ENGINE ONLINE", color: "\x1b[36m" },
    { label: "SECURITY LAYER ACTIVE", color: "\x1b[34m" },
    { label: "WHATSAPP LINK READY", color: "\x1b[32m" },
    { label: "888 BOT SYSTEM READY", color: "\x1b[35m" }
  ];

  // Fade-in iniziale
  for (let i = 0; i < 20; i++) {
    process.stdout.write(`\r\x1b[35mInitializing${".".repeat(i % 4)}\x1b[0m`);
    await sleep(80);
  }
  console.clear();

  // Fasi in successione
  for (const p of phases) {
    process.stdout.write(`${p.color}▶ ${p.label}\x1b[0m\n`);
    await sleep(350);
  }

  console.log();
  await sleep(300);

  // SCRITTA ENORME — 888 BOT v1.3 2K26
  cfonts.say('888 BOT', {
    font: 'block',
    align: 'center',
    gradient: ['#8b5cf6', '#60a5fa'],
    transitionGradient: true,
  });

  await sleep(300);

  cfonts.say('v1.3', {
    font: 'block',
    align: 'center',
    gradient: ['#60a5fa', '#c084fc'],
    transitionGradient: true,
  });

  await sleep(300);

  cfonts.say('2K26', {
    font: 'block',
    align: 'center',
    gradient: ['#c084fc', '#8b5cf6'],
    transitionGradient: true,
  });

  await sleep(400);

  // Mini loading
  const frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
  for (let i = 0; i < 20; i++) {
    process.stdout.write(`\r\x1b[36m${frames[i % frames.length]} Avvio moduli...\x1b[0m`);
    await sleep(70);
  }
  console.log(`\r\x1b[32m✓ Moduli pronti\x1b[0m\n`);

  // Final reveal
  await sleep(200);
  console.log("\x1b[35mSistema operativo 888 attivo\x1b[0m");
  await sleep(150);
  console.log("\x1b[36mConnessione WA stabile\x1b[0m");
  await sleep(150);
  console.log("\x1b[32mBot online\x1b[0m\n");
}

// ———————————————————————————————————————————————
// AVVIO BOT
// ———————————————————————————————————————————————

let isRunning = false;

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  await startupPhaseReveal();

  const args = [join(__dirname, file), ...process.argv.slice(2)];

  console.log("\x1b[32m✓ Sistema pronto\x1b[0m");
  console.log("\x1b[32m✓ Bot online\x1b[0m");
  console.log("\x1b[32m✓ Tutti i sistemi operativi\x1b[0m\n");

  setupMaster({
    exec: args[0],
    args: args.slice(1),
  });

  let processInstance = fork();

  processInstance.on('message', (data) => {
    console.log('\x1b[36m[→]\x1b[0m', data);

    switch (data) {
      case 'reset':
        console.log('\x1b[33mRiavvio...\x1b[0m');
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
    console.error(`\n\x1b[31m✖ Processo terminato [${code}]\x1b[0m\n`);

    if (code !== 0) {
      if (code === 42) {
        console.log("\x1b[32m↻ Riavvio volontario...\x1b[0m");
        setTimeout(() => start(file), 2000);
        return;
      }

      restartAttempts++;
      if (restartAttempts > MAX_RESTART_ATTEMPTS) {
        console.error("\x1b[31m✖ Troppi restart, attesa modifiche...\x1b[0m");
        watchFile(args[0], () => {
          unwatchFile(args[0]);
          restartAttempts = 0;
          console.log("\x1b[32m↻ Recupero...\x1b[0m");
          start(file);
        });
        return;
      }

      const delay = Math.min(3000 * restartAttempts, 15000);
      console.log(`\x1b[32m↻ Riavvio tra ${delay / 1000}s (${restartAttempts}/${MAX_RESTART_ATTEMPTS})\x1b[0m`);
      setTimeout(() => start(file), delay);
    }
  });

  let opts = new Object(
    yargs(process.argv.slice(2)).exitProcess(false).parse()
  );

  if (!opts['test']) {
    rl.removeAllListeners('line');
    rl.on('line', (line) => {
      if (processInstance && processInstance.connected) {
        try {
          processInstance.send(line.trim());
        } catch (err) {
          console.log("\x1b[33m[!] IPC chiuso\x1b[0m");
        }
      } else {
        console.log("\x1b[33m[!] Bot in riavvio, input ignorato\x1b[0m");
      }
    });
  }
}

// ———————————————————————————————————————————————
// HANDLER ERRORI
// ———————————————————————————————————————————————

process.on('uncaughtException', (err) => {
  if (err.code !== 'ERR_IPC_CHANNEL_CLOSED') {
    console.error('\x1b[31m[Cluster] Eccezione:\x1b[0m', err);
  }
});

process.on('unhandledRejection', (reason) => {
  if (reason?.code !== 'ERR_IPC_CHANNEL_CLOSED') {
    console.error('\x1b[31m[Cluster] Rejection:\x1b[0m', reason);
  }
});

process.setMaxListeners(50);

// ———————————————————————————————————————————————
// AVVIO FINALE
// ———————————————————————————————————————————————

start('888.js');