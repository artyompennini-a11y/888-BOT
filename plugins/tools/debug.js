// Plugin by Elixir (credit to Ghost)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../../');

const translateError = (message) => {
  const translations = {
    'Unexpected token }': 'Token inaspettato }',
    'Unexpected token {': 'Token inaspettato {',
    'Unexpected token )': 'Token inaspettato )',
    'Unexpected token (': 'Token inaspettato (',
    'Unexpected token ]': 'Token inaspettato ]',
    'Unexpected token [': 'Token inaspettato [',
    'Missing closing parenthesis': 'Parentesi di chiusura mancante',
    'Missing closing bracket': 'Parentesi quadra di chiusura mancante',
    'Missing closing brace': 'Parentesi graffa di chiusura mancante',
    'Unexpected end of input': 'Fine input inaspettata',
    'Invalid or unexpected token': 'Token non valido o inaspettato',
    'SyntaxError': 'Errore di sintassi',
    'Unexpected identifier': 'Identificatore inaspettato'
  };

  for (const [en, it] of Object.entries(translations)) {
    if (message.includes(en)) {
      return message.replace(en, it);
    }
  }
  return message;
};

const checkSyntax = (filePath) => {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    // parseOnly: true valida la sintassi senza eseguire il codice (Node.js 20+)
    new vm.Script(code, { parseOnly: true });
    return null;
  } catch (error) {
    const match = error.stack.match(/:(\d+):/);
    const line = match ? match[1] : 'sconosciuta';
    return {
      line,
      message: translateError(error.message)
    };
  }
};

const scanFolder = (folderPath, label) => {
  try {
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js') || f.endsWith('.mjs'));
    let result = '';
    
    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      const error = checkSyntax(fullPath);
      if (error) {
        result += `❌ ${label}/${file}\n   Riga ${error.line}: ${error.message}\n`;
      }
    }
    return result;
  } catch {
    return '';
  }
};

const scanFile = (baseDir, fileName) => {
  const filePath = path.join(baseDir, fileName);
  if (fs.existsSync(filePath)) {
    const error = checkSyntax(filePath);
    if (error) {
      return `❌ ${fileName}\n   Riga ${error.line}: ${error.message}\n`;
    }
  }
  return '';
};

let handler = async (m, { conn, usedPrefix, command }) => {
  let output = '```\n🤖 DEBUG BOT\n';
  
  output += scanFile(rootDir, 'handler.js');
  output += scanFile(rootDir, 'config.js');
  output += scanFile(rootDir, 'main.js');
  output += scanFile(rootDir, 'index.js');
  output += scanFile(rootDir, '888.js');
  
  output += scanFolder(path.join(rootDir, 'lib'), 'lib');
  output += scanFolder(path.join(rootDir, 'plugins'), 'plugins');
  
  if (output === '```\n🤖 DEBUG BOT\n') {
    output += '✅ Nessun errore di sintassi!';
  }
  
  output += '```';
  
  await m.reply(output);
};

handler.help = ['debug'];
handler.tags = ['tools'];
handler.command = ['debug'];

export default handler;

