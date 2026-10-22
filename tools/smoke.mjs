// Смоук-тест: запускает игру в настоящем Chrome на ПК и в эмуляции телефона,
// проходит старт → пакт → бой → мастерская → выбор руны → пауза и падает при любой ошибке JS.
// Скриншоты кладёт в tools/out/ — по ним удобно проверять вёрстку.
// Запуск: npm test   (Chrome ищется сам, или укажи путь в CHROME_PATH)
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { serve } from './serve.mjs';

const OUT = resolve(import.meta.dirname, 'out');
const PORT = 8137;
const CHROME = process.env.CHROME_PATH || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'
].find(existsSync);
if (!CHROME){ console.error('Не нашёл Chrome — укажи путь в CHROME_PATH'); process.exit(1); }

const PROFILES = [
  { name: 'desktop', viewport: { width: 1366, height: 768 } },
  { name: 'phone-landscape', viewport: { width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: true } },
  { name: 'phone-portrait', viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
  { name: 'phone-small', viewport: { width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }
];
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

mkdirSync(OUT, { recursive: true });
const server = await serve(PORT);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let failed = false;

for (const prof of PROFILES){
  const errors = [];
  const page = await browser.newPage();
  if (prof.viewport.isMobile) await page.setUserAgent(IPHONE_UA);
  await page.setViewport(prof.viewport);
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
  const touch = !!prof.viewport.hasTouch;
  const g = expr => page.evaluate(expr); // игровые переменные — глобальные, достаём их напрямую
  // вёрстка: страница не прокручена и не увеличена, видимые элементы не вылезают за края экрана
  const layoutCheck = () => page.evaluate(() => {
    const bad = [];
    if (scrollX || scrollY) bad.push(`страница прокручена на ${scrollX},${scrollY}`);
    if (visualViewport && visualViewport.scale !== 1) bad.push(`зум ${visualViewport.scale}`);
    const de = document.documentElement;
    if (de.scrollWidth > innerWidth || de.scrollHeight > innerHeight) bad.push(`страница ${de.scrollWidth}×${de.scrollHeight} больше экрана`);
    for (const el of document.querySelectorAll('body *')){
      if (!el.checkVisibility || !el.checkVisibility({ visibilityProperty: true })) continue;
      if (el.closest('.box') && !el.matches('.box')) continue; // внутри окна прокрутка разрешена
      const r = el.getBoundingClientRect();
      if (r.width && (r.left < -2 || r.right > innerWidth + 2)) bad.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${el.className} вылезает: ${r.left | 0}…${r.right | 0}`);
    }
    return bad;
  });
  const shot = async name => {
    await page.screenshot({ path: `${OUT}/${prof.name}-${name}.png` });
    const bad = await layoutCheck();
    if (bad.length) throw new Error(`вёрстка на «${name}»: ` + bad.slice(0, 5).join('; '));
  };
  const press = async sel => {
    const el = await page.waitForSelector(sel, { visible: true, timeout: 3000 });
    if (touch) await el.tap(); else await el.click();
    await sleep(150);
  };
  const step = async (title, fn) => {
    try { await fn(); console.log(`  ✓ ${title}`); }
    catch (e){ failed = true; console.log(`  ✗ ${title}: ${e.message}`); }
  };

  console.log(`\n${prof.name} ${prof.viewport.width}×${prof.viewport.height}`);
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2' });
  await sleep(300);

  await step('стартовый экран', async () => {
    if (await g('state') !== 'start') throw new Error('state = ' + await g('state'));
    if (await g('TOUCH') !== touch) throw new Error('TOUCH = ' + await g('TOUCH'));
    await shot('1-start');
  });
  await step('выбор пакта и начало боя', async () => {
    await press('#startBtn');
    await shot('2-pact');
    await press('#pactCards .card');
    if (await g('state') !== 'play') throw new Error('state = ' + await g('state'));
    await g('player.hp = player.maxHp = 1e9'); // бессмертие, чтобы тест не зависел от удачи
  });
  await step('маг бежит', async () => {
    const x0 = await g('player.x');
    if (touch){
      const { width: w, height: h } = prof.viewport;
      await page.touchscreen.touchStart(w * 0.2, h * 0.7);
      await page.touchscreen.touchMove(w * 0.2 + 60, h * 0.7);
      await sleep(800);
      if (!(await g('stick.x') > 0.5)) throw new Error('джойстик не отклонился: ' + await g('stick.x'));
      await shot('3-stick');
      await page.touchscreen.touchEnd();
      if (await g('stick.x') !== 0) throw new Error('джойстик не отпустился');
    } else {
      await page.keyboard.down('KeyD'); await sleep(800); await page.keyboard.up('KeyD');
    }
    const dx = await g('player.x') - x0;
    if (dx < 50) throw new Error('сместился только на ' + dx.toFixed(1));
  });
  if (touch) await step('свайпы не двигают страницу', async () => {
    const { width: w, height: h } = prof.viewport;
    // по игре, по HUD сверху и от края экрана — во все стороны (мимо экранных кнопок справа)
    for (const [x0, y0, x1, y1] of [[w * 0.62, h * 0.5, w * 0.1, h * 0.5], [w * 0.5, 20, w * 0.5, h * 0.9], [w * 0.3, h * 0.9, w * 0.3, 10], [2, h * 0.5, w * 0.8, h * 0.5]]){
      await page.touchscreen.touchStart(x0, y0);
      for (let k = 1; k <= 8; k++) await page.touchscreen.touchMove(x0 + (x1 - x0) * k / 8, y0 + (y1 - y0) * k / 8);
      await page.touchscreen.touchEnd();
    }
    const bad = await layoutCheck();
    if (bad.length) throw new Error(bad.join('; '));
  });
  await step('рывок', async () => {
    if (touch) await page.touchscreen.tap(prof.viewport.width * 0.8, prof.viewport.height * 0.4);
    else await page.keyboard.press('Space');
    await sleep(50);
    if (!(await g('player.dashCd') > 0)) throw new Error('рывок не сработал');
  });
  await step('бой 6 секунд без ошибок', async () => {
    const t0 = await g('tick');
    await sleep(6000);
    const t1 = await g('tick'), n = await g('enemies.length');
    if (t1 - t0 < 200) throw new Error(`игра почти стоит: ${t1 - t0} шагов`);
    if (touch && n && !(await g('!!autoTarget'))) throw new Error('автоприцел не выбрал цель');
    await shot('4-fight');
  });
  await step('мастерская', async () => {
    if (touch) await press('#tCraft'); else { await page.keyboard.press('Tab'); await sleep(150); }
    if (await g('state') !== 'craft') throw new Error('state = ' + await g('state'));
    await shot('5-craft');
    await press('#craftClose');
    if (await g('state') !== 'play') throw new Error('не закрылась');
  });
  await step('новый уровень и выбор руны', async () => {
    await g("pendingLevels = 1; openPick('level')");
    await shot('6-pick');
    const inv = await g('inventory.length');
    await press('#cards .card');
    if (await g('inventory.length') !== inv + 1) throw new Error('руна не добавилась');
  });
  await step('пауза', async () => {
    if (touch) await press('#tPause'); else { await page.keyboard.press('Escape'); await sleep(150); }
    if (await g('state') !== 'pause') throw new Error('state = ' + await g('state'));
    await shot('7-pause');
    await press('#resumeBtn');
  });
  await step('смерть и новый забег', async () => {
    await g('player.hp = -100');
    await sleep(500);
    if (await g('state') !== 'dead') throw new Error('state = ' + await g('state'));
    await shot('8-dead');
    await press('#againBtn');
    if (await g('state') !== 'pact') throw new Error('state = ' + await g('state'));
  });
  if (errors.length){ failed = true; console.log('  ✗ ошибки в консоли:\n    ' + errors.join('\n    ')); }
  await page.close();
}

await browser.close(); server.close();
console.log(failed ? '\nЕСТЬ ОШИБКИ' : `\nвсё ок, скриншоты: ${OUT}`);
process.exit(failed ? 1 : 0);
