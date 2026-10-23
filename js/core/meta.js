// ---------- прогресс между забегами ----------
// 💠 осколки хаоса копятся за забеги и тратятся в дереве прокачки (data/upgrades.js),
// 🪙 монеты — в гардеробе и рулетке (core/wardrobe.js).
// best — личные рекорды, top — 10 лучших забегов по очкам, player — имя и ключи для общего рейтинга (core/online.js).
const META = { shards: 0, coins: 0, up: {}, runs: 0, bestSec: 0, kills: 0, best: { score: 0, kills: 0, level: 0 }, top: [], player: null };
try { Object.assign(META, JSON.parse(localStorage.getItem('chaosMageMeta') || '{}')); } catch (e) {}
// v2: очки стали 1 / 3 / 10 за врага — рекорды по старой формуле несравнимы, сбрасываем
if (META.scoreV !== 2){ META.scoreV = 2; META.best.score = 0; META.top = []; }
const saveMeta = () => { try { localStorage.setItem('chaosMageMeta', JSON.stringify(META)); } catch (e) {} };

const upLvl = id => META.up[id] || 0;
const levelCost = (u, l) => Math.round(u.cost * (1 + l * 0.75)); // цена перехода с уровня l на l+1
const upCost = u => levelCost(u, upLvl(u.id));
// max — вкачан до конца, locked — не выполнено условие, buy — можно купить, poor — не хватает осколков
function upState(u){
  if (upLvl(u.id) >= u.max) return 'max';
  if (u.req && upLvl(u.req[0]) < u.req[1]) return 'locked';
  return META.shards >= upCost(u) ? 'buy' : 'poor';
}
function buyUpgrade(id){
  const u = UP[id];
  if (upState(u) !== 'buy') return false;
  META.shards -= upCost(u); META.up[id] = upLvl(id) + 1;
  saveMeta();
  return true;
}
// сброс возвращает все потраченные осколки
function resetUpgrades(){
  for (const u of UPGRADES) for (let l = 0; l < upLvl(u.id); l++) META.shards += levelCost(u, l);
  META.up = {};
  saveMeta();
}

// бонусы прокачки поверх характеристик пакта (вызывается из pactStats)
function applyMeta(P){
  for (const u of UPGRADES){ const l = upLvl(u.id); if (l) u.apply(P, l); }
  return P;
}

// награда за забег: время, убийства, уровень и боссы
function runReward(){
  const sec = tick / 60;
  const parts = [
    ['⏱ за время', sec / 30],
    ['💀 за убийства', kills / 40],
    ['⭐ за уровень', (level - 1) * 1],
    ['👑 за боссов', bossCount * 6]
  ].map(([k, v]) => [k, Math.floor(v)]);
  const base = parts.reduce((s, [, v]) => s + v, 0);
  return { parts, total: Math.round(base * PACT.shards), bonus: PACT.shards > 1 ? Math.round(base * (PACT.shards - 1)) : 0 };
}
// очки забега (копятся за убийства в game/damage.js) — по ним строится таблица рекордов
const runScore = () => score;
// монеты: немного за каждый забег, чуть больше за долгий и с боссами
const runCoins = () => 1 + Math.floor(tick / 60 / 150) + Math.floor(kills / 400) + bossCount + Math.floor(level / 10);
function finishRun(){
  const r = runReward(), sec = Math.floor(tick / 60);
  r.score = runScore(); r.coins = runCoins(); r.record = r.score > META.best.score;
  META.shards += r.total; META.coins += r.coins; META.runs++; META.kills += kills;
  META.bestSec = Math.max(META.bestSec, sec);
  const B = META.best;
  B.score = Math.max(B.score, r.score); B.kills = Math.max(B.kills, kills); B.level = Math.max(B.level, level);
  META.top.push({ score: r.score, kills, level, sec, biome: RUN.biome, at: Date.now() });
  META.top.sort((a, b) => b.score - a.score); META.top.length = Math.min(META.top.length, 10);
  saveMeta();
  submitScore(true);
  return r;
}
