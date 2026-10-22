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
  // тестовые забеги не должны попадать в настоящий общий рейтинг: запросы к Supabase глушим (нужный шаг подменяет fetch сам)
  await page.setRequestInterception(true);
  page.on('request', r => /supabase\.co/.test(r.url()) ? r.abort() : r.continue());
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|supabase\.co|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  const touch = !!prof.viewport.hasTouch;
  const g = expr => page.evaluate(expr); // игровые переменные — глобальные, достаём их напрямую
  // вёрстка: страница не прокручена и не увеличена, видимые элементы не вылезают за края экрана
  const layoutCheck = () => page.evaluate(() => {
    const bad = [];
    if (scrollX || scrollY) bad.push(`страница прокручена на ${scrollX},${scrollY}`);
    if (visualViewport && visualViewport.scale !== 1) bad.push(`зум ${visualViewport.scale}`);
    const de = document.documentElement;
    if (de.scrollWidth > innerWidth || de.scrollHeight > innerHeight) bad.push(`страница ${de.scrollWidth}×${de.scrollHeight} больше экрана`);
    // окно может прокручиваться только вертикально: лишняя ширина = «невидимый слайдер» под пальцем
    for (const box of document.querySelectorAll('.modal.show .box'))
      if (box.scrollWidth > box.clientWidth + 1) bad.push(`окно #${box.parentElement.id} шире экрана: ${box.scrollWidth} > ${box.clientWidth}`);
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

  await page.evaluate(() => localStorage.clear()); // каждый прогон — как первый запуск
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(300);
  await step('главное меню', async () => {
    if (await g('state') !== 'menu') throw new Error('state = ' + await g('state'));
    if (await g('TOUCH') !== touch) throw new Error('TOUCH = ' + await g('TOUCH'));
    await shot('0-menu');
  });
  await step('настройки и «как играть»', async () => {
    await press('#setBtn'); await shot('0-settings');
    const before = await g('SET.music');
    await press('[data-opt=music]');
    if (await g('SET.music') === before) throw new Error('музыка не переключилась');
    await press('[data-opt=music]');
    await press('#setClose');
    await press('#helpBtn'); await shot('0-help'); await press('#helpClose');
    if (!(await g("$('menuM').classList.contains('show')"))) throw new Error('не вернулись в меню');
  });
  await step('прокачка: покупка и бонус в забеге', async () => {
    await g('META.shards = 500; renderMenu()');
    await press('#treeBtn');
    await shot('0-tree');
    await press('.node[data-u=might]');
    await shot('0-tree-node');
    await press('#buyBtn');
    if (await g('upLvl("might")') !== 1) throw new Error('не купилось');
    if (await g('META.shards') !== 485) throw new Error('осколки: ' + await g('META.shards'));
    if (Math.abs(await g('pactStats(null).dmg') - 0.85 * 1.06) > 1e-9) throw new Error('бонус не применился');
    await press('.node[data-u=heart]'); // закрытый навык: купить нельзя
    if (!(await g("$('buyBtn').disabled"))) throw new Error('закрытый навык можно купить');
    await press('#treeClose');
  });
  await step('гардероб: примерка, покупка, след', async () => {
    await g('META.coins = 200; saveMeta(); renderMenu()');
    await press('#wardBtn');
    await shot('0-wardrobe');
    await press('.wcard[data-i=hat_top]'); // магазинная вещь: сначала только примерка
    if (await g('WARD.on.hat') !== 'hat_wizard') throw new Error('надел, не купив');
    await press('#wardAct');
    if (await g('WARD.on.hat') !== 'hat_top' || await g('META.coins') !== 80) throw new Error(`покупка: ${await g('WARD.on.hat')}, монет ${await g('META.coins')}`);
    await press('#slotTabs [data-s=trail]');
    await press('.wcard[data-i=trail_sparks]'); await press('#wardAct');
    if (await g('LOOK.trail.kind') !== 'sparks') throw new Error('след не наделся');
    await press('#slotTabs [data-s=beard]');
    await press('.wcard[data-i=beard_rainbow]'); // из рулетки: купить нельзя
    if (await g("!!$('wardAct')")) throw new Error('вещь из рулетки можно купить');
    await sleep(400); await shot('0-wardrobe-try');
  });
  await step('рулетка', async () => {
    await press('#wardRoll');
    await g('REEL_MS = 300; META.coins = 60; renderRoll()');
    await shot('0-roll');
    const own = await g('Object.values(WARD.own).reduce((s, n) => s + n, 0)');
    await press('#rollBtn'); await sleep(700);
    if (await g('META.coins') !== 60 - await g('ROLL_COST')) throw new Error('монеты не списались');
    if (await g('Object.values(WARD.own).reduce((s, n) => s + n, 0)') !== own + 1) throw new Error('вещь не выпала');
    if (!(await g("$('rollRes').textContent.length > 0"))) throw new Error('нет результата');
    await shot('0-roll-win');
    await press('#rollBtn'); await sleep(700);
    if (!(await g("$('rollBtn').disabled"))) throw new Error('крутится без монет');
    // честность: на 20000 бросков доли редкостей близки к заявленным, повторы есть
    const share = await g(`(() => { const n = {}; for (let i = 0; i < 20000; i++){ const r = ITEMS[randomRollItem()].rar; n[r] = (n[r] || 0) + 1; } return n; })()`);
    if (Math.abs(share.junk / 20000 - 0.38) > 0.03 || !(share.legend > 300 && share.legend < 900)) throw new Error('доли редкостей: ' + JSON.stringify(share));
    await press('#rollClose'); await press('#wardClose');
    if (!(await g("$('menuM').classList.contains('show')"))) throw new Error('не вернулись в меню');
    await g('META.coins = 0; saveMeta(); renderMenu()');
  });
  await step('рекорды и общий рейтинг (сервер подменён)', async () => {
    await press('#recBtn'); await shot('0-records');
    await press('#recClose');
    await g(`ONLINE.url = 'https://test.supabase.co'; ONLINE.key = 'sb_publishable_test'; META.best.score = 100; window.__calls = [];
      window.__fetch = window.__fetch || fetch;
      window.fetch = (u, o) => {
        const fn = u.split('/').pop(), body = JSON.parse(o.body); __calls.push([fn, body]);
        const data = fn === 'top_scores' ? [{ id: 'x', name: '<b>Хакер</b>', score: 5000, kills: 300, level: 15, runs: 3 }, { id: onlinePlayer().id, name: playerName(), score: 100, kills: 5, level: 2, runs: 1 }] : fn === 'my_rank' ? 2 : null;
        return Promise.resolve(new Response(data === null ? null : JSON.stringify(data), { status: data === null ? 204 : 200 }));
      }`);
    await press('#recBtn'); await sleep(300);
    if (await g("document.querySelectorAll('#recTable tr').length") !== 3) throw new Error('таблица: ' + await g("$('recTable').textContent"));
    if (await g("!!document.querySelector('#recTable b')")) throw new Error('имя игрока не экранировано');
    await page.click('#nameIn', { clickCount: 3 }); await page.keyboard.type('Тест'); await page.keyboard.press('Enter'); await sleep(300);
    const sub = await g("__calls.filter(c => c[0] === 'submit_score').pop()");
    if (!sub || sub[1].p_name !== 'Тест') throw new Error('имя не отправилось: ' + JSON.stringify(sub));
    if (await g('state') !== 'menu' || !(await g("$('recM').classList.contains('show')"))) throw new Error('Enter в поле имени сработал как «Играть»');
    await shot('0-records-online');
    await press('#recClose');
    await g("ONLINE.url = ''; META.best.score = 0; saveMeta()"); // дальше — снова без сети
  });
  await step('выбор пакта и начало боя', async () => {
    await press('#playBtn');
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
  // новый контент гоняем на ПК и на телефоне стоя — этого хватает, чтобы поймать ошибки
  if (prof.name === 'desktop' || prof.name === 'phone-portrait') await step('новые формы, враги, боссы и миры', async () => {
    const FORMS = {
      deck: 'projs.some(p => p.card)', billiard: 'projs.some(p => p.billiard) || enemies.some(e => e.fly > 0)',
      trail: "projs.some(p => p.kind === 'puff')", debt: 'enemies.some(e => e.debt)', tether: 'ties.length > 0',
      seed: "projs.some(p => p.kind === 'seed')", prism: "projs.filter(p => p.kind === 'prism').length === 1",
      bait: "projs.filter(p => p.kind === 'bait').length === 1", sigil: "projs.filter(p => p.kind === 'sigil').length === 1",
      shadow: "projs.filter(p => p.kind === 'shade').length === 1"
    };
    for (const [f, check] of Object.entries(FORMS)){
      await g(`level = 12; slots[0] = { form: '${f}', element: 'fire', mods: ['trigger', 'multi', null] };
        slots[1] = { form: 'bolt', element: null, mods: ['echo', null, null] }; recompile(); cds.fill(1);
        for (let k = 0; k < 8; k++) spawnEnemy('brute', player.x + 110 + (k % 4) * 40, player.y + (k - 4) * 34, true, true);`);
      // ждём, пока форма проявится, до 1.5 с
      let ok = false;
      for (let t = 0; t < 30 && !ok; t++){ ok = await g(check); if (!ok) await sleep(50); }
      if (!ok) throw new Error(`форма ${f} не сработала (${check})`);
      await sleep(300);
    }
    await shot('10-forms');
    await g(`for (const t of ['bomber', 'bomber', 'shield', 'shield', 'queen', 'clock']) spawnEnemy(t, player.x + rnd(-260, 260), player.y + rnd(-200, 200), false, true)`);
    await sleep(4000);
    await shot('11-bosses');
    for (const [biome, hazard] of [['caves', 'resonator'], ['desert', 'quicksand']]){
      await g(`startRun(); RUN.biome = '${biome}'; chunks.clear(); groundPat = null; choosePact('swarm'); player.hp = player.maxHp = 1e9`);
      await sleep(2500);
      if (!(await g(`nearProps.some(h => h.kind === '${hazard}')`))) throw new Error(`в мире ${biome} нет опасности ${hazard}`);
      await shot(`12-${biome}`);
    }
  });
  await step('выпадение «Цепи»', async () => {
    const n = await g("inventory.filter(r => r === 'trigger').length");
    await g("dropRune(player.x + 260, player.y - 40, 'trigger')");
    await sleep(400);
    await shot('4-chain');
    await g("for (const gm of gems) if (gm.chain){ gm.x = player.x; gm.y = player.y; }");
    await sleep(300);
    if (await g("inventory.filter(r => r === 'trigger').length") !== n + 1) throw new Error('цепь не подобралась');
  });
  await step('мастерская', async () => {
    if (touch) await press('#tCraft'); else { await page.keyboard.press('Tab'); await sleep(150); }
    if (await g('state') !== 'craft') throw new Error('state = ' + await g('state'));
    await shot('5-craft');
    // ячейка → в списке только руны её типа → нажатие на руну вставляет её
    await g("inventory.push('echo', 'split', 'fire'); sortInv(); resetCraftSel(); renderCraft()");
    const sock = await g("(el => el && [el.dataset.s, el.dataset.i])(document.querySelector('.sock.t-mod:not(.filled)'))");
    await press(`.sock[data-k=mod][data-s="${sock[0]}"][data-i="${sock[1]}"]`);
    if (await g('invFilter') !== 'mod') throw new Error('фильтр не включился: ' + await g('invFilter'));
    if (await g("[...document.querySelectorAll('#invUI .rune')].some(el => RUNES[inventory[+el.dataset.ri]].type !== 'mod')")) throw new Error('в списке не только моды');
    await shot('5-craft-sock');
    await press('#invUI .rune');
    if (!(await g(`slots[${sock[0]}].mods[${sock[1]}]`))) throw new Error('руна не вставилась в выбранную ячейку');
    await shot('5-craft-placed');
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
  await step('смерть, награда и новый забег', async () => {
    const shards = await g('META.shards');
    await g('tick = Math.max(tick, 600); player.hp = -100'); // забег должен длиться хоть немного, иначе награда 0
    await sleep(500);
    if (await g('state') !== 'dead') throw new Error('state = ' + await g('state'));
    if (!(await g('META.shards') > shards)) throw new Error('осколки не начислились');
    if (!(await g('META.coins') > 0)) throw new Error('монеты не начислились');
    if (await g('META.top.length') !== 1 || await g('META.best.score') !== await g('score')) throw new Error('рекорд не записался');
    await shot('8-dead');
    await press('#againBtn');
    if (await g('state') !== 'pact') throw new Error('state = ' + await g('state'));
  });
  await step('из выбора пакта обратно в меню', async () => {
    await press('#pactBack');
    if (await g('state') !== 'menu') throw new Error('state = ' + await g('state'));
  });
  await step('вся прокачка на максимуме', async () => {
    await g('for (const u of UPGRADES) META.up[u.id] = u.max; saveMeta(); goMenu()');
    await press('#playBtn');
    const pacts = await g("document.querySelectorAll('#pactCards .card').length");
    if (pacts !== 5) throw new Error(`пактов на выбор ${pacts}, а должно быть 5`);
    await g("choosePact('swarm')"); // пакт без особых правил, чтобы проверять чистые бонусы
    await sleep(300);
    if (await g('state') !== 'pick') throw new Error('стартовый уровень не дал выбор руны, state = ' + await g('state'));
    const cards = await g("document.querySelectorAll('#cards .card').length");
    if (cards !== 4) throw new Error(`рун на выбор ${cards}, а должно быть 4`);
    await shot('9-maxed-pick');
    await press('#cards .card'); await sleep(200);
    if (await g('state') === 'pick') await press('#cards .card');
    if (await g('level') !== 3) throw new Error('уровень ' + await g('level'));
    if (await g('lives') !== 1) throw new Error('нет второго дыхания');
    await g('player.hp = -100'); await sleep(300);
    if (await g('state') !== 'play' || await g('lives') !== 0) throw new Error('второе дыхание не сработало');
    await sleep(2500);
    await g('META.up = {}; saveMeta()');
  });
  if (errors.length){ failed = true; console.log('  ✗ ошибки в консоли:\n    ' + errors.join('\n    ')); }
  await page.close();
}

await browser.close(); server.close();
console.log(failed ? '\nЕСТЬ ОШИБКИ' : `\nвсё ок, скриншоты: ${OUT}`);
process.exit(failed ? 1 : 0);
