// Config by elixir, punisher & 888 staff
import { watchFile, unwatchFile } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import chalk from 'chalk'
import fs from 'fs'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
import NodeCache from 'node-cache'

const pkg = JSON.parse(await fs.promises.readFile(new URL('./package.json', import.meta.url), 'utf-8'))
const moduleCache = new NodeCache({ stdTTL: 300 });

function normalizeOwnerList(list) {
  return list.map(entry => [
    entry[0], 
    entry[1],
    entry[2]
  ]);
}

global.browserless = "888"

global.elixir = ['393272723855','393297014539','393784409415','17577575541','79524931364']

let ownerData = [
  ['393297014539', 'elixir', true],
  ['447785114563', 'Dado', true],
  ['393331663641', 'Manu', true],
  ['79524931364', 'Punisher', true],
  ['5564920039928', 'riley', true],
  ['212785655331', 'Ghost', true],
  ['17577575541', 'Axtral', true],        

// ---- Owner LID ----

  ['83245710491831', 'Axtral lid', true],

];

if (fs.existsSync('./owner.json')) {
  try {
    const fromFile = JSON.parse(fs.readFileSync('./owner.json', 'utf-8'));
    if (Array.isArray(fromFile) && fromFile.length) {

      const merged = [...ownerData]
for (const entry of fromFile) {
  const id = String(entry?.[0] ?? '');
  if (id && !merged.some(e => String(e?.[0] ?? '') === id)) {
    merged.push(entry);
  }
}
      ownerData = merged;
    }
  } catch (e) {
    console.error("Errore nella lettura di owner.json:", e);
  }
} else {
  fs.writeFileSync('./owner.json', JSON.stringify(ownerData, null, 2));
}

global.owner = normalizeOwnerList(ownerData)


global.nomepack = '𝟴𝟴𝟴 𝗕𝗢𝗧'
global.nomebot = '𝟴𝟴𝟴 𝗕𝗢𝗧'
global.wm = '𝟴𝟴𝟴 𝗕𝗢𝗧'
global.autore = 'The punisher'
global.dev = 'Elixir'
global.testobot = `𝟴𝟴𝟴 𝗕𝗢𝗧`
global.versione = pkg.version
global.errore = '⚠️ *Errore inatteso!* Usa il comando `.segnala` per avvisare gli owner.'

global.repobot = 'https//wa.me/393206032199'
global.canale = 'https://whatsapp.com/channel/0029VauhQviCsU9Ibrwlkb0h'
global.gruppo = 'https://chat.whatsapp.com/KqBeKHgrc53BNdvuPTKLTL'

global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment

global.APIKeys = { 
    spotifyclientid: '888',
    spotifysecret: '888',
    screenshotone: '888',
    screenshotone_default: '888',
    tmdb: '888',
    gemini:'AQ.Ab8RN6Jg9lmcMeIuoneNkCzBeS0sSc39BOaoRLPXjTKX45VTDQ',
    ocrspace: '888',
    assemblyai: '888',
    google: '888',
    googlex: '888',
    googleCX: '888',
    genius: '888',
    unsplash: '888',
    removebg: 'FEx4CYmYN1QRQWD1mbZp87jV',
    openrouter: '888',
    groq: '888',
    lastfm: '36f859a1fc4121e7f0e931806507d5f9',
}

let filePath = fileURLToPath(import.meta.url)
let fileUrl = pathToFileURL(filePath).href

const reloadConfig = async () => {
  const cached = moduleCache.get(fileUrl);
  if (cached) return cached;
  unwatchFile(filePath)
  console.log(chalk.bgHex('#ff0000')(chalk.white.bold("File: 'config.js' Aggiornato")))
  const module = await import(`${fileUrl}?update=${Date.now()}`)
  moduleCache.set(fileUrl, module, { ttl: 300 });
  return module;
}

watchFile(filePath, reloadConfig)
