// Рисует иконки приложения (icon-192.png, icon-512.png) из спрайта мага прямо в игре.
// Запуск: node tools/icons.mjs — нужен, только если поменялся вид мага.
import puppeteer from 'puppeteer-core';
import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { serve } from './serve.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const CHROME = process.env.CHROME_PATH || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
const server = await serve(8138);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:8138/', { waitUntil: 'networkidle2' });
for (const size of [192, 512]){
  const data = await page.evaluate(size => {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'), img = SPR.mage[0];
    const bg = g.createRadialGradient(size / 2, size * 0.42, 0, size / 2, size / 2, size * 0.7);
    bg.addColorStop(0, '#3d2d7a'); bg.addColorStop(1, '#0b0618');
    g.fillStyle = bg; g.fillRect(0, 0, size, size);
    const k = Math.floor(size * 0.72 / img.height);
    g.imageSmoothingEnabled = false;
    g.drawImage(img, (size - img.width * k) / 2, (size - img.height * k) / 2, img.width * k, img.height * k);
    return c.toDataURL('image/png').split(',')[1];
  }, size);
  writeFileSync(`${ROOT}/icon-${size}.png`, Buffer.from(data, 'base64'));
}
await browser.close(); server.close();
console.log('готово: icon-192.png, icon-512.png');
