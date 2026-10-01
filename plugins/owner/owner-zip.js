// Plugin by elixir, punisher & 888 staff

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handler = async (m, { conn }) => {
  await m.reply(`🔄 Backup in corso, riceverai il file a breve...`);

  setImmediate(async () => {
    const sanitizeName = (name) => {
      return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    };

    const archiveName = sanitizeName(`backup_${new Date().toISOString().split('T')[0]}`);
    const archivePath = path.join(__dirname, `${archiveName}.zip`);

    try {
      const rootDir = process.cwd();
      const ignoreList = [
        'node_modules',
        '888BotSession',
        '.git',
        '.env',
        '.gitignore',
        'package-lock.json'
      ];

      const getFiles = (dir) => {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach((file) => {
          const filePath = path.join(dir, file);
          const relativePath = path.relative(rootDir, filePath);

          if (ignoreList.some(ignore => relativePath === ignore || relativePath.startsWith(ignore + '/')) || file.endsWith('.zip')) {
            return;
          }

          const stat = fs.statSync(filePath);
          if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(filePath));
          } else {
            results.push({ fullPath: filePath, relativePath });
          }
        });
        return results;
      };

      const files = getFiles(rootDir);
      
      if (files.length === 0) {
        return m.reply(`❌ Errore: Nessun file trovato per il backup.`);
      }

      const zipBuffer = createSimpleZip(files, rootDir);
      fs.writeFileSync(archivePath, zipBuffer);

      const stats = fs.statSync(archivePath);

      await conn.sendMessage(m.chat, {
        document: { url: archivePath },
        mimetype: 'application/zip',
        fileName: `${archiveName}.zip`
      }, { quoted: m });

      await m.reply(`✅ Backup completato (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);

    } catch (e) {
      try { await m.reply(`❌ Errore durante il backup: ${e.message}`); } catch (err) {}
    } finally {
      if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
    }
  });
};

function createSimpleZip(files, rootDir) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const file of files) {
    const content = fs.readFileSync(file.fullPath);
    const fileName = file.relativePath.replace(/\\/g, '/');
    const fileNameBuffer = Buffer.from(fileName, 'utf-8');

    const crc = crc32(content);
    const compressedContent = zlib.deflateRawSync(content, { level: 9 });

    const localHeader = Buffer.alloc(30 + fileNameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt32LE(0, 10);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedContent.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(fileNameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    fileNameBuffer.copy(localHeader, 30);

    localHeaders.push(localHeader, compressedContent);

    const centralHeader = Buffer.alloc(46 + fileNameBuffer.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt32LE(0, 12);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedContent.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(fileNameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt32LE(0, 36);
    centralHeader.writeUInt32LE(offset, 42);
    fileNameBuffer.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);
    offset += localHeader.length + compressedContent.length;
  }

  const centralDirectoryOffset = offset;
  let centralDirectorySize = 0;
  for (const ch of centralHeaders) centralDirectorySize += ch.length;

  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(files.length, 8);
  endRecord.writeUInt16LE(files.length, 10);
  endRecord.writeUInt32LE(centralDirectorySize, 12);
  endRecord.writeUInt32LE(centralDirectoryOffset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, ...centralHeaders, endRecord]);
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let c = (crc ^ buf[i]) & 0xff;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ -1) >>> 0;
}

handler.command = /^zip$/i;
handler.owner = true;

export default handler;