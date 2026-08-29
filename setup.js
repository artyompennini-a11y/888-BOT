/**
 * Setup cross-platform per Mio Bot WhatsApp
 * Funziona su: Windows, macOS, Linux, Termux
 * 
 * Uso: node setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const basedMainPath = path.join(__dirname, 'based-main');
const symlinkPath = path.join(__dirname, 'node_modules', '888baileys');

function run(command, cwd) {
    console.log(`\n> ${command}`);
    execSync(command, { stdio: 'inherit', cwd: cwd || __dirname });
}

function createSymlink() {
    // Rimuovi symlink/cartella esistente
    if (fs.existsSync(symlinkPath)) {
        if (isWindows) {
            // Su Windows usiamo rmdir /s /q per rimuovere junction
            execSync(`rmdir /s /q "${symlinkPath}"`, { stdio: 'ignore' });
        } else {
            fs.unlinkSync(symlinkPath);
        }
    }

    // Crea il symlink
    if (isWindows) {
        // Su Windows: junction (non richiede admin)
        execSync(`mklink /J "${symlinkPath}" "${basedMainPath}"`, { stdio: 'inherit' });
    } else {
        // Linux/macOS/Termux
        fs.symlinkSync(basedMainPath, symlinkPath, 'junction');
    }
    console.log('✅ Symlink creato con successo!');
}

async function main() {
    console.log('🚀 Setup Mio Bot WhatsApp\n');

    // 1. Verifica Node.js
    const nodeVersion = process.version;
    console.log(`📦 Node.js ${nodeVersion}`);
    const major = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (major < 20) {
        console.error('❌ Richiesto Node.js 20+');
        process.exit(1);
    }

    // 2. Inizializza submodule se necessario
    if (!fs.existsSync(basedMainPath)) {
        console.log('\n📥 Inizializzazione submodule...');
        run('git submodule update --init --recursive');
    }

    // 3. Installa dipendenze based-main
    console.log('\n📦 Installazione dipendenze 888Baileys...');
    run('npm install --legacy-peer-deps', basedMainPath);

    // 4. Crea symlink
    console.log('\n🔗 Creazione symlink...');
    createSymlink();

    // 5. Installa dipendenze mio-bot
    console.log('\n📦 Installazione dipendenze bot...');
    run('npm install');

    console.log('\n✅ Setup completato!');
    console.log('\nPer avviare il bot:');
    console.log('  node bot.js');
}

main().catch(err => {
    console.error('\n❌ Errore:', err.message);
    process.exit(1);
});