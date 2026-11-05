// Yhteinen selainapuri: käyttää koneen Chromea tai Edgeä (puppeteer-core).
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

const SITE = path.resolve(__dirname, '..', 'site');
const { start } = require('./serve');
const PORT = 8765;
const PAGE_URL = `http://localhost:${PORT}/index.html`;
let server = null;

async function launch() {
  if (!server) { server = await start(PORT); server.unref(); }
  const exe = CANDIDATES.find(p => fs.existsSync(p));
  if (!exe) throw new Error('Chromea tai Edgeä ei löytynyt. Aseta CHROME_PATH.');
  return puppeteer.launch({ executablePath: exe, headless: true });
}

async function openSite(browser, { width = 1440, height = 900, snapshot = true } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  if (snapshot) await page.evaluateOnNewDocument(() => { window.SNAPSHOT_MODE = true; });
  page.on('pageerror', e => console.error('Sivuvirhe:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('Konsoli:', m.text()); });
  await page.goto(PAGE_URL, { waitUntil: 'networkidle0', timeout: 60000 });
  return page;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = { launch, openSite, sleep, SITE, PAGE_URL };
